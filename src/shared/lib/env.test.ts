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

describe("env CONTENTFUL_ENVIRONMENT and SITE_URL", () => {
	it("defaults the environment to master and the site URL to production", async () => {
		const { env, getSiteUrl, DEFAULT_SITE_URL } = await import("./env");
		expect(env.CONTENTFUL_ENVIRONMENT).toBe("master");
		expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
	});

	it("accepts a Contentful environment id and an https origin", async () => {
		vi.stubEnv("CONTENTFUL_ENVIRONMENT", "staging");
		vi.stubEnv("SITE_URL", "https://exemplo.pt");
		const { env, getSiteUrl } = await import("./env");
		expect(env.CONTENTFUL_ENVIRONMENT).toBe("staging");
		expect(getSiteUrl()).toBe("https://exemplo.pt");
	});

	it("rejects a path-like environment and a site URL with a path", async () => {
		vi.stubEnv("CONTENTFUL_ENVIRONMENT", "../master");
		await expect(import("./env")).rejects.toThrow(/Invalid environment/);

		vi.resetModules();
		vi.unstubAllEnvs();
		vi.stubEnv("SITE_URL", "https://exemplo.pt/blog");
		await expect(import("./env")).rejects.toThrow(/Invalid environment/);
	});
});
