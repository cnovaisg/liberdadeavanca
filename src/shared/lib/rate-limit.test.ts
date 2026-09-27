import { describe, expect, it } from "vitest";
import { checkRateLimit, clientIpFromRequest } from "./rate-limit";

describe("checkRateLimit", () => {
	it("allows traffic under the cap and then limits", () => {
		const key = `test-${Math.random()}`;
		const options = { windowMs: 60_000, max: 3 };

		expect(checkRateLimit(key, options).limited).toBe(false);
		expect(checkRateLimit(key, options).limited).toBe(false);
		expect(checkRateLimit(key, options).limited).toBe(false);
		const blocked = checkRateLimit(key, options);
		expect(blocked.limited).toBe(true);
		expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
	});
});

describe("clientIpFromRequest", () => {
	it("prefers the first x-forwarded-for hop", () => {
		const request = new Request("https://example.com", {
			headers: {
				"x-forwarded-for": "203.0.113.1, 10.0.0.1",
				"x-real-ip": "198.51.100.1",
			},
		});
		expect(clientIpFromRequest(request)).toBe("203.0.113.1");
	});

	it("falls back to unknown", () => {
		expect(clientIpFromRequest(new Request("https://example.com"))).toBe(
			"unknown",
		);
	});
});
