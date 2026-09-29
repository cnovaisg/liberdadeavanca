import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
	vi.resetModules();
	vi.unstubAllEnvs();
});

describe("env CONTENTFUL_LOCALE", () => {
	it("accepts BCP 47 locales", async () => {
		vi.stubEnv("CONTENTFUL_LOCALE", "en-US");
		const { env } = await import("./env");
		expect(env.CONTENTFUL_LOCALE).toBe("en-US");
	});

	it("rejects invalid locale tags", async () => {
		vi.stubEnv("CONTENTFUL_LOCALE", "not a locale!!!");
		await expect(import("./env")).rejects.toThrow(/Invalid environment/);
	});
});
