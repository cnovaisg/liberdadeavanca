import { createHmac, timingSafeEqual } from "node:crypto";
import { escape as qsEscape } from "node:querystring";

const SIGNATURE_HEADER = "x-contentful-signature";
const SIGNED_HEADERS_HEADER = "x-contentful-signed-headers";
const TIMESTAMP_HEADER = "x-contentful-timestamp";

/** Contentful webhook signing secrets are exactly 64 chars from this alphabet. */
export const CONTENTFUL_SIGNING_SECRET_PATTERN = /^[0-9a-zA-Z+/=_-]{64}$/;

export type VerifyWebhookResult = { ok: true } | { ok: false; reason: string };

const sortHeaderKeys = (a: string, b: string) => (a > b ? 1 : -1);

const timingSafeUtf8Equal = (a: string, b: string) => {
	const aBuf = Buffer.from(a, "utf8");
	const bBuf = Buffer.from(b, "utf8");
	if (aBuf.length !== bBuf.length) return false;
	return timingSafeEqual(aBuf, bBuf);
};

const normalizePath = (uri: string) => {
	const [pathname, search] = uri.split("?");
	const escapedSearch = search ? qsEscape(search) : "";
	return encodeURI(escapedSearch ? `${pathname}?${escapedSearch}` : pathname);
};

const headersToRecord = (headers: Headers): Record<string, string> => {
	const out: Record<string, string> = {};
	headers.forEach((value, key) => {
		out[key.toLowerCase().trim()] = value.trim();
	});
	return out;
};

/**
 * Mirrors `@contentful/node-apps-toolkit` `signRequest` hash step for webhooks.
 * @see https://www.contentful.com/developers/docs/extensibility/webhooks/request-verification/
 */
const signCanonicalRequest = (
	secret: string,
	method: string,
	path: string,
	headers: Record<string, string>,
	body: string,
	timestampMs: number,
) => {
	const headerNames = new Set(Object.keys(headers));
	headerNames.add(SIGNED_HEADERS_HEADER);
	headerNames.add(TIMESTAMP_HEADER);

	const signedHeadersList = [...headerNames].sort(sortHeaderKeys).join(",");
	const headersForSign: Record<string, string> = {
		...headers,
		[TIMESTAMP_HEADER]: String(timestampMs),
		[SIGNED_HEADERS_HEADER]: signedHeadersList,
	};

	const stringifiedHeaders = Object.entries(headersForSign)
		.sort(([a], [b]) => sortHeaderKeys(a, b))
		.map(([key, value]) => `${key}:${value}`)
		.join(";");

	const canonical = [
		method,
		normalizePath(path),
		stringifiedHeaders,
		body,
	].join("\n");

	return createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
};

/**
 * Verify a Contentful-signed webhook request.
 * Pass `ttlSeconds: 0` to skip the replay window check (default 60s).
 */
export function verifyContentfulWebhookRequest(options: {
	secrets: string[];
	method: string;
	path: string;
	headers: Headers;
	rawBody: string;
	ttlSeconds?: number;
}): VerifyWebhookResult {
	const secrets = options.secrets.filter((secret) =>
		CONTENTFUL_SIGNING_SECRET_PATTERN.test(secret),
	);
	if (secrets.length === 0) {
		return {
			ok: false,
			reason: "No valid Contentful signing secret configured",
		};
	}

	const normalized = headersToRecord(options.headers);
	const signature = normalized[SIGNATURE_HEADER];
	const signedHeadersRaw = normalized[SIGNED_HEADERS_HEADER];
	const timestampRaw = normalized[TIMESTAMP_HEADER];

	if (!signature || !signedHeadersRaw || !timestampRaw) {
		return { ok: false, reason: "Missing Contentful signature headers" };
	}

	const timestampMs = Number.parseInt(timestampRaw, 10);
	if (!Number.isFinite(timestampMs)) {
		return { ok: false, reason: "Invalid Contentful timestamp" };
	}

	const ttlSeconds = options.ttlSeconds ?? 60;
	if (ttlSeconds !== 0 && Date.now() - timestampMs >= ttlSeconds * 1000) {
		return { ok: false, reason: "Contentful signature expired" };
	}

	const signedHeaderNames = signedHeadersRaw
		.split(",")
		.map((name) => name.trim().toLowerCase())
		.filter(Boolean);

	const picked: Record<string, string> = {};
	for (const name of signedHeaderNames) {
		if (name in normalized) {
			picked[name] = normalized[name];
		}
	}

	const method = options.method.toUpperCase();
	const path = options.path.startsWith("/") ? options.path : `/${options.path}`;

	for (const secret of secrets) {
		const computed = signCanonicalRequest(
			secret,
			method,
			path,
			picked,
			options.rawBody,
			timestampMs,
		);
		if (timingSafeUtf8Equal(signature, computed)) {
			return { ok: true };
		}
	}

	return { ok: false, reason: "Contentful signature mismatch" };
}

/** Split a single env value into secrets (comma-separated for key rotation). */
export function parseContentfulSigningSecrets(
	raw: string | undefined,
): string[] {
	if (!raw) return [];
	return raw
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
}
