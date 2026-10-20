import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
	vi.resetModules();
	vi.unstubAllEnvs();
});

describe("getContentfulConfig", () => {
	it("usa CONTENTFUL_ENVIRONMENT no URL da Delivery API", async () => {
		vi.stubEnv("CONTENTFUL_SPACE_ID", "space");
		vi.stubEnv("CONTENTFUL_API_BASE_URL", "https://cdn.contentful.com");
		vi.stubEnv("CONTENTFUL_API_ACCESS_TOKEN", "token");
		vi.stubEnv("CONTENTFUL_ENVIRONMENT", "staging");

		const { getContentfulConfig } = await import("./config");

		expect(getContentfulConfig()?.baseUrl).toBe(
			"https://cdn.contentful.com/spaces/space/environments/staging",
		);
	});

	it("cai em master quando o ambiente não está definido", async () => {
		vi.stubEnv("CONTENTFUL_SPACE_ID", "space");
		vi.stubEnv("CONTENTFUL_API_BASE_URL", "https://cdn.contentful.com");
		vi.stubEnv("CONTENTFUL_API_ACCESS_TOKEN", "token");

		const { getContentfulConfig } = await import("./config");

		expect(getContentfulConfig()?.baseUrl).toBe(
			"https://cdn.contentful.com/spaces/space/environments/master",
		);
	});
});
