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
		REVALIDATE_SECRET: "shared-revalidate-secret" as string | undefined,
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
	let errorLog: ReturnType<typeof vi.spyOn> | undefined;
	let warnLog: ReturnType<typeof vi.spyOn> | undefined;

	beforeEach(() => {
		errorLog?.mockRestore();
		warnLog?.mockRestore();
		vi.clearAllMocks();
		mustRequireWebhookHmac.mockReturnValue(false);
		env.REVALIDATE_SECRET = "shared-revalidate-secret";
		env.CONTENTFUL_WEBHOOK_SIGNING_SECRET = undefined;
		errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
		warnLog = vi.spyOn(console, "warn").mockImplementation(() => {});
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
		await expect(response.json()).resolves.toEqual({
			revalidated: false,
			message: "Service unavailable",
		});
		expect(JSON.stringify(errorLog?.mock.calls)).toContain(
			"CONTENTFUL_WEBHOOK_SIGNING_SECRET",
		);
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("hides a missing shared secret behind a generic 500", async () => {
		env.REVALIDATE_SECRET = undefined;
		const response = await post({ body: "{}" });
		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			revalidated: false,
			message: "Service unavailable",
		});
		expect(JSON.stringify(errorLog?.mock.calls)).toContain("REVALIDATE_SECRET");
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("returns a generic 401 when the HMAC signature is rejected", async () => {
		env.CONTENTFUL_WEBHOOK_SIGNING_SECRET = "a".repeat(64);
		const response = await post({
			headers: { "x-revalidate-secret": "shared-revalidate-secret" },
			body: "{}",
		});
		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body).toEqual({ revalidated: false, message: "Unauthorized" });
		expect(JSON.stringify(body)).not.toMatch(/signature|secret|Contentful/i);
		expect(JSON.stringify(warnLog?.mock.calls)).toContain(
			"Missing Contentful signature headers",
		);
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("rejects a content-length above 64 KB before revalidating", async () => {
		const response = await post({
			headers: {
				"x-revalidate-secret": "shared-revalidate-secret",
				"content-length": String(64 * 1024 + 1),
			},
			body: "{}",
		});
		expect(response.status).toBe(413);
		await expect(response.json()).resolves.toEqual({
			revalidated: false,
			message: "Payload too large",
		});
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("rejects a body that exceeds 64 KB while it is being read", async () => {
		const response = await post({
			headers: { "x-revalidate-secret": "shared-revalidate-secret" },
			body: "x".repeat(64 * 1024 + 1),
		});
		expect(response.status).toBe(413);
		await expect(response.json()).resolves.toEqual({
			revalidated: false,
			message: "Payload too large",
		});
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("stops reading a stream once it passes 64 KB", async () => {
		const chunk = new Uint8Array(32 * 1024);
		const stream = new ReadableStream<Uint8Array>({
			pull(controller) {
				controller.enqueue(chunk);
			},
		});
		const response = await POST(
			new Request("https://example.com/api/revalidate", {
				method: "POST",
				headers: { "x-revalidate-secret": "shared-revalidate-secret" },
				body: stream,
				duplex: "half",
			} as RequestInit & { duplex: "half" }),
		);
		expect(response.status).toBe(413);
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
		expect(body.paths).toContain("/sitemap.xml");
		expect(body.paths).toContain("/rss.xml");
		expect(revalidateTag).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
	});

	it("revalida o caminho do slug e o do id", async () => {
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
				fields: {
					slug: { "en-US": "impostos-justos" },
				},
			}),
		});

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.paths).toContain("/blog/post1");
		expect(body.paths).toContain("/blog/impostos-justos");
		expect(body.paths).toContain("/rss.xml");
		expect(revalidatePath).toHaveBeenCalledWith("/blog/impostos-justos");
		expect(revalidatePath).toHaveBeenCalledWith("/rss.xml");
	});

	it("ignora um slug inválido no webhook", async () => {
		const response = await post({
			headers: { "x-revalidate-secret": "shared-revalidate-secret" },
			body: JSON.stringify({
				sys: {
					id: "post1",
					contentType: { sys: { id: "blogPost" } },
				},
				fields: { slug: { "en-US": "../etc" } },
			}),
		});

		const body = await response.json();
		expect(body.paths).toContain("/blog/post1");
		expect(body.paths).not.toContain("/blog/../etc");
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
