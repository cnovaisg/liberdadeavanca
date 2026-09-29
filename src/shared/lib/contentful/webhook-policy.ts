/**
 * Gate for Contentful webhook HMAC on deployed Vercel environments.
 *
 * On Vercel, `NODE_ENV` is always `"production"` (including Preview).
 * Require HMAC for both `production` and `preview`. Local `vercel dev`
 * (`VERCEL_ENV=development`) and plain local runs stay optional.
 * Off-Vercel, fall back to `NODE_ENV === "production"`.
 */
export function isDeployedVercelEnvironment(): boolean {
	const vercelEnv = process.env.VERCEL_ENV;
	return vercelEnv === "production" || vercelEnv === "preview";
}

/**
 * Fail closed: Production and Preview must verify Contentful signatures.
 * Local development may omit the signing secret.
 */
export function mustRequireWebhookHmac(): boolean {
	if (isDeployedVercelEnvironment()) return true;
	if (process.env.VERCEL_ENV === "development") return false;
	return process.env.NODE_ENV === "production";
}
