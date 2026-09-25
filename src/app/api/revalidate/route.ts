import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
	BLOG_CACHE_TAG,
	BLOG_TAGS_CACHE_TAG,
	blogPostCacheTag,
} from "@/features/blog/services/blog.cache";
import { env } from "@/shared/lib/env";

/**
 * On-demand cache revalidation for Contentful publishes.
 *
 * Env: REVALIDATE_SECRET (Vercel project env — do not commit the value).
 *
 * Contentful webhook (Settings → Webhooks):
 *   URL:  https://<host>/api/revalidate
 *   Headers: `x-revalidate-secret: <REVALIDATE_SECRET>`
 *            (or `Authorization: Bearer <REVALIDATE_SECRET>`)
 *   Method: POST only
 *   Triggers: Entry publish, unpublish, delete (content type blogPost).
 *             Tag create, save, and delete (so renames and new public tags
 *             refresh the catalog and every page that renders tag names).
 *
 * The secret must not be passed in the query string (avoids log/referrer leaks).
 * On success the route revalidates `/blog`, filtered listings at `/blog/tag/[tagId]`,
 * and, when the payload includes a valid entry id, `/blog/[postId]` for that entry.
 * Tag events also revalidate every blog post page, because display names live there.
 */

type ContentfulWebhookBody = {
	sys?: { id?: unknown; type?: unknown };
	entryId?: unknown;
	entityId?: unknown;
};

type WebhookTarget = {
	isTag: boolean;
	entryId?: string;
};

/** Contentful entry ids are alphanumeric (optionally with `_` / `-`). */
const ENTRY_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

const unauthorized = () =>
	NextResponse.json(
		{ revalidated: false, message: "Unauthorized" },
		{ status: 401 },
	);

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
	return ENTRY_ID_PATTERN.test(id) ? id : undefined;
};

const isTagTopic = (topic: string | null) =>
	typeof topic === "string" && /\.tag\./i.test(topic);

const readWebhookTarget = async (request: Request): Promise<WebhookTarget> => {
	const topic = request.headers.get("x-contentful-topic");

	try {
		const body = (await request.json()) as ContentfulWebhookBody;
		const isTag = isTagTopic(topic) || body?.sys?.type === "Tag";
		if (isTag) return { isTag: true };

		return {
			isTag: false,
			entryId:
				asEntryId(body?.sys?.id) ??
				asEntryId(body?.entryId) ??
				asEntryId(body?.entityId),
		};
	} catch {
		return { isTag: isTagTopic(topic) };
	}
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

export async function POST(request: Request) {
	const expected = env.REVALIDATE_SECRET;
	if (!expected) {
		return NextResponse.json(
			{ revalidated: false, message: "REVALIDATE_SECRET is not configured" },
			{ status: 500 },
		);
	}

	const provided = readProvidedSecret(request);
	if (!provided || !secretsMatch(provided, expected)) {
		return unauthorized();
	}

	const target = await readWebhookTarget(request);
	const paths = revalidateBlog(target);

	return NextResponse.json({
		revalidated: true,
		now: Date.now(),
		paths,
	});
}
