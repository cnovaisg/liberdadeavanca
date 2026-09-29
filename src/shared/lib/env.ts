import { z } from "zod";

/** Treat empty strings as unset (common in `.env.example` / Vercel placeholders). */
const emptyToUndefined = (value: unknown) => {
	if (value === undefined || value === null) return undefined;
	if (typeof value === "string" && value.trim() === "") return undefined;
	return value;
};

const optionalString = z.preprocess(
	emptyToUndefined,
	z.string().min(1).optional(),
);

const optionalEmail = z.preprocess(
	emptyToUndefined,
	z.string().email().optional(),
);

/** BCP 47 language tag (e.g. `en-US`, `pt-PT`). */
const BCP47_LOCALE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

const optionalContentfulLocale = z.preprocess(
	emptyToUndefined,
	z
		.string()
		.regex(BCP47_LOCALE_PATTERN, {
			message: "Must be a BCP 47 locale (e.g. en-US, pt-PT)",
		})
		.optional(),
);

/** Read-only Contentful hosts — never the Management API (`api.contentful.com`). */
export const CONTENTFUL_READ_HOSTS = new Set([
	"cdn.contentful.com",
	"preview.contentful.com",
]);

/** SocialData API hosts — keep fetch targets explicit (SSRF hygiene). */
export const SOCIAL_DATA_ALLOWED_HOSTS = new Set(["api.socialdata.tools"]);

const optionalContentfulBaseUrl = z.preprocess(
	emptyToUndefined,
	z
		.string()
		.url()
		.refine(
			(value) => {
				try {
					return CONTENTFUL_READ_HOSTS.has(new URL(value).hostname);
				} catch {
					return false;
				}
			},
			{
				message:
					"Must be Contentful Delivery (cdn.contentful.com) or Preview (preview.contentful.com), not Management (api.contentful.com)",
			},
		)
		.optional(),
);

const optionalSocialDataBaseUrl = z.preprocess(
	emptyToUndefined,
	z
		.string()
		.url()
		.refine(
			(value) => {
				try {
					return SOCIAL_DATA_ALLOWED_HOSTS.has(new URL(value).hostname);
				} catch {
					return false;
				}
			},
			{
				message: "Must be a SocialData host (api.socialdata.tools)",
			},
		)
		.optional(),
);

/**
 * All secrets/config are optional so local/CI builds work without `.env.local`.
 * When a value *is* present, Zod still validates shape (URL, email, non-empty).
 */
const envSchema = z.object({
	CONTENTFUL_SPACE_ID: optionalString,
	CONTENTFUL_API_BASE_URL: optionalContentfulBaseUrl,
	/** Content Delivery API (CDA) or Preview token — never a Management (CMA) token. */
	CONTENTFUL_API_ACCESS_TOKEN: optionalString,
	/** Delivery locale for CDA queries (default `en-US` when unset). */
	CONTENTFUL_LOCALE: optionalContentfulLocale,
	/**
	 * Space-level webhook signing secret(s) from Contentful
	 * (Settings → Webhooks → Settings → Enable request verification).
	 * Comma-separated for key rotation. Each secret must be 64 chars.
	 */
	CONTENTFUL_WEBHOOK_SIGNING_SECRET: optionalString,
	REVALIDATE_SECRET: optionalString,
	ACCOUNT_MAIL: optionalEmail,
	SOCIAL_DATA_X_ACCOUNT: optionalString,
	SOCIAL_DATA_BASE_URL: optionalSocialDataBaseUrl,
	SOCIAL_DATA_API_KEY: optionalString,
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
	const result = envSchema.safeParse({
		CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
		CONTENTFUL_API_BASE_URL: process.env.CONTENTFUL_API_BASE_URL,
		CONTENTFUL_API_ACCESS_TOKEN: process.env.CONTENTFUL_API_ACCESS_TOKEN,
		CONTENTFUL_LOCALE: process.env.CONTENTFUL_LOCALE,
		CONTENTFUL_WEBHOOK_SIGNING_SECRET:
			process.env.CONTENTFUL_WEBHOOK_SIGNING_SECRET,
		REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
		ACCOUNT_MAIL: process.env.ACCOUNT_MAIL,
		SOCIAL_DATA_X_ACCOUNT: process.env.SOCIAL_DATA_X_ACCOUNT,
		SOCIAL_DATA_BASE_URL: process.env.SOCIAL_DATA_BASE_URL,
		SOCIAL_DATA_API_KEY: process.env.SOCIAL_DATA_API_KEY,
	});

	if (!result.success) {
		const details = result.error.issues
			.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
			.join("; ");
		throw new Error(`Invalid environment variables: ${details}`);
	}

	return result.data;
}

/** Parsed once at module load (server). Missing values are `undefined`. */
export const env = loadEnv();

export function getContentfulCredentials() {
	const spaceId = env.CONTENTFUL_SPACE_ID;
	const apiBaseUrl = env.CONTENTFUL_API_BASE_URL;
	const accessToken = env.CONTENTFUL_API_ACCESS_TOKEN;

	if (!spaceId || !apiBaseUrl || !accessToken) {
		return null;
	}

	const hostname = new URL(apiBaseUrl).hostname;
	if (!CONTENTFUL_READ_HOSTS.has(hostname)) {
		throw new Error(
			`Refusing Contentful host "${hostname}". Use Delivery/Preview only.`,
		);
	}

	return { spaceId, apiBaseUrl, accessToken };
}

export function getSocialDataCredentials() {
	const account = env.SOCIAL_DATA_X_ACCOUNT;
	const baseUrl = env.SOCIAL_DATA_BASE_URL;
	const apiKey = env.SOCIAL_DATA_API_KEY;

	if (!account || !baseUrl || !apiKey) {
		return null;
	}

	const hostname = new URL(baseUrl).hostname;
	if (!SOCIAL_DATA_ALLOWED_HOSTS.has(hostname)) {
		throw new Error(
			`Refusing SocialData host "${hostname}". Allowed: ${[...SOCIAL_DATA_ALLOWED_HOSTS].join(", ")}.`,
		);
	}

	return {
		account: account.replace(/^@/, ""),
		baseUrl: baseUrl.replace(/\/$/, ""),
		apiKey,
	};
}
