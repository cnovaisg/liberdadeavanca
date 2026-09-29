import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const revalidateTag = vi.fn();
const mustRequireWebhookHmac = vi.fn(() => false);

vi.mock("next/cache", () => ({
	revalidatePath: (...args: unknown[]) => revalidatePath(...args),
	revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/shared/lib/env", () => ({
	env: {
		REVALIDATE_SECRET: "shared-revalidate-secret",
		CONTENTFUL_WEBHOOK_SIGNING_SECRET: undefined as string | undefined,
	},
}));

vi.mock("@/shared/lib/contentful/webhook-policy", () => ({
	mustRequireWebhookHmac: () => mustRequireWebhookHmac(),
}));

vi.mock("@/shared/lib/rate-limit", () => ({
	checkRateLimit: () => ({
		limited: false,
		remaining: 30,
		retryAfterSeconds: 0,
	}),
	clientIpFromRequest: () => "203.0.113.50",
}));

import { env } from "@/shared/lib/env";
import { POST } from "./route";

const post = (init?: RequestInit) =>
	POST(
		new Request("https://example.com/api/revalidate", {
			method: "POST",
			...init,
		}),
	);

describe("POST /api/revalidate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mustRequireWebhookHmac.mockReturnValue(false);
		env.CONTENTFUL_WEBHOOK_SIGNING_SECRET = undefined;
	});

	it("rejects missing shared secret", async () => {
		const response = await post({ body: "{}" });
		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({
			revalidated: false,
		});
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("fails closed on deployed environments without HMAC secret", async () => {
		mustRequireWebhookHmac.mockReturnValue(true);
		const response = await post({
			headers: { "x-revalidate-secret": "shared-revalidate-secret" },
			body: JSON.stringify({
				sys: { id: "post1", contentType: { sys: { id: "blogPost" } } },
			}),
		});
		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toMatchObject({
			message:
				"CONTENTFUL_WEBHOOK_SIGNING_SECRET is required on deployed environments",
		});
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("revalidates blog paths when authorised without HMAC (local)", async () => {
		const response = await post({
			headers: {
				"x-revalidate-secret": "shared-revalidate-secret",
				"x-contentful-topic": "ContentManagement.Entry.publish",
			},
			body: JSON.stringify({
				sys: {
					id: "post1",
					contentType: { sys: { id: "blogPost" } },
				},
			}),
		});

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.revalidated).toBe(true);
		expect(body.paths).toContain("/blog");
		expect(body.paths).toContain("/blog/post1");
		expect(revalidateTag).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalled();
	});

	it("revalidates manifesto for manifesto content type", async () => {
		const response = await post({
			headers: { "x-revalidate-secret": "shared-revalidate-secret" },
			body: JSON.stringify({
				sys: {
					id: "man1",
					contentType: { sys: { id: "manifesto" } },
				},
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			revalidated: true,
			paths: ["/manifesto"],
		});
	});

	it("acknowledges unknown content types without revalidating", async () => {
		const response = await post({
			headers: { "x-revalidate-secret": "shared-revalidate-secret" },
			body: JSON.stringify({
				sys: {
					id: "other1",
					contentType: { sys: { id: "somethingElse" } },
				},
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			revalidated: true,
			paths: [],
		});
		expect(revalidateTag).not.toHaveBeenCalled();
		expect(revalidatePath).not.toHaveBeenCalled();
	});

	it("does not default-refresh blog when content type is missing", async () => {
		const response = await post({
			headers: { "x-revalidate-secret": "shared-revalidate-secret" },
			body: JSON.stringify({ sys: { id: "post1" } }),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({
			revalidated: true,
			paths: [],
		});
		expect(revalidateTag).not.toHaveBeenCalled();
	});
});
