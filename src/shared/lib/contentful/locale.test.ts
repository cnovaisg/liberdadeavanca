import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
	vi.resetModules();
	vi.unstubAllEnvs();
});

describe("getContentfulLocale", () => {
	it("defaults Contentful queries to en-US", async () => {
		vi.stubEnv("CONTENTFUL_LOCALE", "");
		const { getContentfulLocale } = await import("./locale");
		expect(getContentfulLocale()).toBe("en-US");
	});

	it("honours CONTENTFUL_LOCALE when set", async () => {
		vi.stubEnv("CONTENTFUL_LOCALE", "pt-PT");
		const { getContentfulLocale } = await import("./locale");
		expect(getContentfulLocale()).toBe("pt-PT");
	});
});
