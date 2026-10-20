import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
	BLOG_CACHE_TAG,
	BLOG_TAGS_CACHE_TAG,
	blogPostCacheTag,
} from "@/features/blog";
import { MANIFESTO_CACHE_TAG } from "@/features/manifesto";
import { isContentfulId } from "@/shared/lib/contentful/ids";
import { mustRequireWebhookHmac } from "@/shared/lib/contentful/webhook-policy";
import {
	parseContentfulSigningSecrets,
	verifyContentfulWebhookRequest,
} from "@/shared/lib/contentful/webhook-signature";
import { env } from "@/shared/lib/env";
import { log } from "@/shared/lib/log";
import { checkRateLimit, clientIpFromRequest } from "@/shared/lib/rate-limit";

/** Soft per-IP cap (in-memory; best-effort across serverless isolates). */
const REVALIDATE_RATE_LIMIT = {
	windowMs: 60_000,
	max: 30,
} as const;

/** Replay window for Contentful HMAC timestamps. */
const CONTENTFUL_SIGNATURE_TTL_SECONDS = 60;

/** Hard cap so a webhook body cannot be buffered without bound. */
const MAX_REVALIDATE_BODY_BYTES = 64 * 1024;

const GENERIC_UNAUTHORIZED = "Unauthorized";
const GENERIC_UNAVAILABLE = "Service unavailable";
const GENERIC_TOO_LARGE = "Payload too large";
const GENERIC_BAD_REQUEST = "Bad request";

/**
 * On-demand cache revalidation for Contentful publishes.
 *
 * Env:
 *   - REVALIDATE_SECRET — shared header secret (required)
 *   - CONTENTFUL_WEBHOOK_SIGNING_SECRET — space signing secret. Required on
 *     Vercel Production and Preview; optional for local development.
 *
 * Contentful webhook (Settings → Webhooks):
 *   URL:  https://<host>/api/revalidate
 *   Headers: `x-revalidate-secret: <REVALIDATE_SECRET>`
 *            (or `Authorization: Bearer <REVALIDATE_SECRET>`)
 *   Method: POST only
 *   Also enable space-level request verification (Settings tab) and set
 *   CONTENTFUL_WEBHOOK_SIGNING_SECRET in Vercel to the generated secret.
 *   Triggers: Entry publish, unpublish, delete (content types blogPost, manifesto).
 *             Tag create, save, and delete are optional: they refresh display
 *             names immediately. Without them, a rename still appears within
 *             the 60 second cache window.
 *
 * The secret must not be passed in the query string (avoids log/referrer leaks).
 * On success the route revalidates:
 *   - blog: `/blog`, `/blog/tag/[tagId]`, and optionally `/blog/[postId]`
 *   - manifesto: `/manifesto`
 * Tag events also revalidate every blog post page, because display names live there.
 */

type ContentfulWebhookBody = {
	sys?: {
		id?: unknown;
		type?: unknown;
		contentType?: { sys?: { id?: unknown } };
	};
	entryId?: unknown;
	entityId?: unknown;
};

type WebhookTarget = {
	isTag: boolean;
	entryId?: string;
	contentTypeId?: string;
};

const jsonError = (status: number, message: string) =>
	NextResponse.json({ revalidated: false, message }, { status });

const unauthorized = () => jsonError(401, GENERIC_UNAUTHORIZED);

const secretsMatch = (provided: string, expected: string) => {
	const providedHash = createHash("sha256").update(provided).digest();
	const expectedHash = createHash("sha256").update(expected).digest();
	return timingSafeEqual(providedHash, expectedHash);
};

const readProvidedSecret = (request: Request) => {
	const fromHeader = request.headers.get("x-revalidate-secret")?.trim();
	if (fromHeader) return fromHeader;

	const authorization = request.headers.get("authorization");
	if (authorization?.toLowerCase().startsWith("bearer ")) {
		const token = authorization.slice(7).trim();
		return token || null;
	}

	return null;
};

const asEntryId = (value: unknown): string | undefined => {
	if (typeof value !== "string") return undefined;
	const id = value.trim();
	return isContentfulId(id) ? id : undefined;
};

const asContentTypeId = (value: unknown): string | undefined => {
	if (typeof value !== "string") return undefined;
	const id = value.trim();
	return isContentfulId(id) ? id : undefined;
};

const isTagTopic = (topic: string | null) =>
	typeof topic === "string" && /\.tag\./i.test(topic);

const readWebhookTarget = (
	topic: string | null,
	body: ContentfulWebhookBody | null,
): WebhookTarget => {
	if (!body) {
		return { isTag: isTagTopic(topic) };
	}

	const isTag = isTagTopic(topic) || body?.sys?.type === "Tag";
	if (isTag) return { isTag: true };

	return {
		isTag: false,
		entryId:
			asEntryId(body?.sys?.id) ??
			asEntryId(body?.entryId) ??
			asEntryId(body?.entityId),
		contentTypeId: asContentTypeId(body?.sys?.contentType?.sys?.id),
	};
};

const revalidateBlog = ({ isTag, entryId }: WebhookTarget) => {
	revalidateTag(BLOG_CACHE_TAG, { expire: 0 });
	revalidateTag(BLOG_TAGS_CACHE_TAG, { expire: 0 });
	revalidatePath("/blog");
	revalidatePath("/blog/tag/[tagId]", "page");

	const paths = ["/blog", "/blog/tag/[tagId]"];

	if (isTag) {
		revalidatePath("/blog/[postId]", "page");
		paths.push("/blog/[postId]");
	}

	if (entryId) {
		revalidateTag(blogPostCacheTag(entryId), { expire: 0 });
		revalidatePath(`/blog/${entryId}`);
		paths.push(`/blog/${entryId}`);
	}

	return paths;
};

const revalidateManifesto = () => {
	revalidateTag(MANIFESTO_CACHE_TAG, { expire: 0 });
	revalidatePath("/manifesto");
	return ["/manifesto"];
};

const webhookBodySchema = z.looseObject({
	sys: z
		.looseObject({
			id: z.unknown().optional(),
			type: z.unknown().optional(),
			contentType: z
				.looseObject({
					sys: z.looseObject({ id: z.unknown().optional() }).optional(),
				})
				.optional(),
		})
		.optional(),
	entryId: z.unknown().optional(),
	entityId: z.unknown().optional(),
});

const declaredBodyTooLarge = (request: Request) => {
	const raw = request.headers.get("content-length");
	if (raw === null) return false;
	const length = Number(raw);
	if (!Number.isInteger(length) || length < 0) return true;
	return length > MAX_REVALIDATE_BODY_BYTES;
};

/** Reads the body, stopping as soon as it exceeds `maxBytes`. */
const readLimitedBody = async (
	request: Request,
	maxBytes: number,
): Promise<string | null> => {
	const reader = request.body?.getReader();
	if (!reader) return "";

	const decoder = new TextDecoder();
	let received = 0;
	let text = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (!value) continue;
		received += value.byteLength;
		if (received > maxBytes) {
			await reader.cancel();
			return null;
		}
		text += decoder.decode(value, { stream: true });
	}

	text += decoder.decode();
	return text;
};

const parseJsonBody = (rawBody: string): ContentfulWebhookBody | null => {
	if (!rawBody) return null;
	let payload: unknown;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		log.warn("revalidate.body_invalid", { reason: "invalid json" });
		return null;
	}

	const parsed = webhookBodySchema.safeParse(payload);
	if (!parsed.success) {
		log.warn("revalidate.body_invalid", { reason: "unexpected shape" });
		return null;
	}

	return parsed.data;
};

export async function POST(request: Request) {
	const expected = env.REVALIDATE_SECRET;
	if (!expected) {
		log.error("revalidate.misconfigured", { missing: "REVALIDATE_SECRET" });
		return jsonError(500, GENERIC_UNAVAILABLE);
	}

	const ip = clientIpFromRequest(request);
	const rate = checkRateLimit(`revalidate:${ip}`, REVALIDATE_RATE_LIMIT);
	if (rate.limited) {
		log.warn("revalidate.rate_limited", { ip });
		return NextResponse.json(
			{ revalidated: false, message: "Too many requests" },
			{
				status: 429,
				headers: {
					"Retry-After": String(rate.retryAfterSeconds),
				},
			},
		);
	}

	const provided = readProvidedSecret(request);
	if (!provided || !secretsMatch(provided, expected)) {
		log.warn("revalidate.unauthorized", { ip });
		return unauthorized();
	}

	if (declaredBodyTooLarge(request)) {
		log.warn("revalidate.body_too_large", {
			ip,
			contentLength: request.headers.get("content-length") ?? "missing",
		});
		return jsonError(413, GENERIC_TOO_LARGE);
	}

	// Raw body is required for HMAC verification (must match bytes Contentful signed).
	let rawBody: string;
	try {
		const limited = await readLimitedBody(request, MAX_REVALIDATE_BODY_BYTES);
		if (limited === null) {
			log.warn("revalidate.body_too_large", { ip, contentLength: "stream" });
			return jsonError(413, GENERIC_TOO_LARGE);
		}
		rawBody = limited;
	} catch (error) {
		log.warn("revalidate.body_unreadable", {
			ip,
			message: error instanceof Error ? error.message : "unknown",
		});
		return jsonError(400, GENERIC_BAD_REQUEST);
	}

	const requestUrl = new URL(request.url);
	const requestPath = `${requestUrl.pathname}${requestUrl.search}`;

	const signingSecrets = parseContentfulSigningSecrets(
		env.CONTENTFUL_WEBHOOK_SIGNING_SECRET,
	);
	if (signingSecrets.length === 0) {
		if (mustRequireWebhookHmac()) {
			log.error("revalidate.misconfigured", {
				missing: "CONTENTFUL_WEBHOOK_SIGNING_SECRET",
			});
			return jsonError(500, GENERIC_UNAVAILABLE);
		}
	} else {
		const verified = verifyContentfulWebhookRequest({
			secrets: signingSecrets,
			method: request.method,
			path: requestPath,
			headers: request.headers,
			rawBody,
			ttlSeconds: CONTENTFUL_SIGNATURE_TTL_SECONDS,
		});
		if (!verified.ok) {
			log.warn("revalidate.unauthorized", { ip, reason: verified.reason });
			return unauthorized();
		}
	}

	const topic = request.headers.get("x-contentful-topic");
	const target = readWebhookTarget(topic, parseJsonBody(rawBody));
	const paths: string[] = [];

	if (target.isTag) {
		paths.push(...revalidateBlog(target));
	} else if (target.contentTypeId === "manifesto") {
		paths.push(...revalidateManifesto());
	} else if (target.contentTypeId === "blogPost") {
		paths.push(...revalidateBlog(target));
	} else {
		// Unknown / missing content type: acknowledge without cache thrash.
		log.info("revalidate.skipped_unknown_type", {
			contentTypeId: target.contentTypeId ?? "missing",
			topic: topic ?? "missing",
		});
	}

	if (paths.length > 0) {
		log.info("revalidate.ok", {
			pathCount: paths.length,
			contentTypeId: target.contentTypeId ?? (target.isTag ? "tag" : "n/a"),
		});
	}

	return NextResponse.json({
		revalidated: true,
		now: Date.now(),
		paths,
	});
}
