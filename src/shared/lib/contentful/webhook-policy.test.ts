import { afterEach, describe, expect, it } from "vitest";
import {
	isProductionDeployment,
	mustRequireWebhookHmac,
} from "./webhook-policy";

const env = process.env as Record<string, string | undefined>;
const originalVercelEnv = env.VERCEL_ENV;
const originalNodeEnv = env.NODE_ENV;

afterEach(() => {
	if (originalVercelEnv === undefined) delete env.VERCEL_ENV;
	else env.VERCEL_ENV = originalVercelEnv;

	if (originalNodeEnv === undefined) delete env.NODE_ENV;
	else env.NODE_ENV = originalNodeEnv;
});

describe("isProductionDeployment", () => {
	it("treats VERCEL_ENV=production as production", () => {
		env.VERCEL_ENV = "production";
		env.NODE_ENV = "production";
		expect(isProductionDeployment()).toBe(true);
		expect(mustRequireWebhookHmac()).toBe(true);
	});

	it("does not treat Vercel preview as production", () => {
		env.VERCEL_ENV = "preview";
		env.NODE_ENV = "production";
		expect(isProductionDeployment()).toBe(false);
		expect(mustRequireWebhookHmac()).toBe(false);
	});

	it("falls back to NODE_ENV when VERCEL_ENV is unset", () => {
		delete env.VERCEL_ENV;
		env.NODE_ENV = "production";
		expect(isProductionDeployment()).toBe(true);

		env.NODE_ENV = "development";
		expect(isProductionDeployment()).toBe(false);
	});
});
