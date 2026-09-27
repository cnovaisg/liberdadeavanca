/**
 * Best-effort in-memory sliding-window rate limiter.
 * On Vercel each serverless isolate has its own map — still blocks
 * bursts within an instance; use Firewall/KV for global hard limits.
 */

type WindowState = {
	timestamps: number[];
};

const windows = new Map<string, WindowState>();

export type RateLimitResult = {
	limited: boolean;
	remaining: number;
	retryAfterSeconds: number;
};

export function checkRateLimit(
	key: string,
	options: { windowMs: number; max: number },
): RateLimitResult {
	const now = Date.now();
	const windowStart = now - options.windowMs;
	const state = windows.get(key) ?? { timestamps: [] };

	const timestamps = state.timestamps.filter((t) => t > windowStart);

	if (timestamps.length >= options.max) {
		windows.set(key, { timestamps });
		const oldest = timestamps[0] ?? now;
		const retryAfterMs = Math.max(0, oldest + options.windowMs - now);
		return {
			limited: true,
			remaining: 0,
			retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
		};
	}

	timestamps.push(now);
	windows.set(key, { timestamps });

	// Opportunistic cleanup to avoid unbounded growth of idle keys.
	if (windows.size > 500) {
		for (const [k, v] of windows) {
			const fresh = v.timestamps.filter((t) => t > windowStart);
			if (fresh.length === 0) windows.delete(k);
			else windows.set(k, { timestamps: fresh });
		}
	}

	return {
		limited: false,
		remaining: Math.max(0, options.max - timestamps.length),
		retryAfterSeconds: 0,
	};
}

/** Client IP from common proxy headers; falls back to a shared bucket. */
export function clientIpFromRequest(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}

	const realIp = request.headers.get("x-real-ip")?.trim();
	if (realIp) return realIp;

	return "unknown";
}
