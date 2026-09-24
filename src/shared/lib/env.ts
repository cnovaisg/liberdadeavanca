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

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

const optionalEmail = z.preprocess(
	emptyToUndefined,
	z.string().email().optional(),
);

/** Read-only Contentful hosts — never the Management API (`api.contentful.com`). */
export const CONTENTFUL_READ_HOSTS = new Set([
	"cdn.contentful.com",
	"preview.contentful.com",
]);

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

/**
 * All secrets/config are optional so local/CI builds work without `.env.local`.
 * When a value *is* present, Zod still validates shape (URL, email, non-empty).
 */
const envSchema = z.object({
	CONTENTFUL_SPACE_ID: optionalString,
	CONTENTFUL_API_BASE_URL: optionalContentfulBaseUrl,
	/** Content Delivery API (CDA) or Preview token — never a Management (CMA) token. */
	CONTENTFUL_API_ACCESS_TOKEN: optionalString,
	REVALIDATE_SECRET: optionalString,
	ACCOUNT_MAIL: optionalEmail,
	SOCIAL_DATA_X_ACCOUNT: optionalString,
	SOCIAL_DATA_BASE_URL: optionalUrl,
	SOCIAL_DATA_API_KEY: optionalString,
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
	const result = envSchema.safeParse({
		CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
		CONTENTFUL_API_BASE_URL: process.env.CONTENTFUL_API_BASE_URL,
		CONTENTFUL_API_ACCESS_TOKEN: process.env.CONTENTFUL_API_ACCESS_TOKEN,
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

	return {
		account: account.replace(/^@/, ""),
		baseUrl: baseUrl.replace(/\/$/, ""),
		apiKey,
	};
}
