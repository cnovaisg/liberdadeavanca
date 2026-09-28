/**
 * Production gate for Contentful webhook HMAC.
 *
 * On Vercel, `NODE_ENV` is always `"production"` (including Preview).
 * Prefer `VERCEL_ENV === "production"`; fall back to `NODE_ENV` off-Vercel.
 */
export function isProductionDeployment(): boolean {
	const vercelEnv = process.env.VERCEL_ENV;
	if (vercelEnv !== undefined && vercelEnv !== "") {
		return vercelEnv === "production";
	}
	return process.env.NODE_ENV === "production";
}

/** Fail closed: Production must verify Contentful request signatures. */
export function mustRequireWebhookHmac(): boolean {
	return isProductionDeployment();
}
