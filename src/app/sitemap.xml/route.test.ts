import { beforeEach, describe, expect, it, vi } from "vitest";

const getLatestBlogPosts = vi.fn();

vi.mock("@/features/blog/services/blog.service", () => ({
	default: {
		getLatestBlogPosts: (...args: unknown[]) => getLatestBlogPosts(...args),
	},
}));

import { dynamic, GET } from "./route";

describe("GET /sitemap.xml", () => {
	let errorLog: ReturnType<typeof vi.spyOn> | undefined;

	beforeEach(() => {
		errorLog?.mockRestore();
		vi.clearAllMocks();
		errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("não fica na cópia estática do deploy", () => {
		expect(dynamic).toBe("force-dynamic");
	});

	it("responde com XML, slug canónico e o content-type correcto", async () => {
		getLatestBlogPosts.mockResolvedValue([
			{
				id: "entry-id",
				slug: "teste-de-funcionalidades",
				publishedAt: "2026-02-01T00:00:00.000Z",
				updatedAt: "2026-03-01T00:00:00.000Z",
			},
		]);

		const response = await GET();
		const body = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe(
			"application/xml; charset=utf-8",
		);
		expect(response.headers.get("cache-control")).toBe(
			"private, no-cache, no-store, max-age=0, must-revalidate",
		);
		expect(body).toContain("<loc>https://liberdadeavanca.vercel.app</loc>");
		expect(body).toContain(
			"<loc>https://liberdadeavanca.vercel.app/manifesto</loc>",
		);
		expect(body).toContain(
			"<loc>https://liberdadeavanca.vercel.app/blog</loc>",
		);
		expect(body).toContain(
			"<loc>https://liberdadeavanca.vercel.app/blog/teste-de-funcionalidades</loc>",
		);
		expect(body).toContain("<lastmod>2026-03-01T00:00:00.000Z</lastmod>");
		expect(body).not.toContain("2026-02-01T00:00:00.000Z");
		expect(body).not.toContain("/blog/entry-id");
		expect(getLatestBlogPosts).toHaveBeenCalledWith(1000);
	});

	it("fica só com as rotas estáticas se o Contentful falhar", async () => {
		getLatestBlogPosts.mockRejectedValue(new Error("Contentful API error"));

		const response = await GET();
		const body = await response.text();

		expect(response.status).toBe(200);
		expect(body).toContain(
			"<loc>https://liberdadeavanca.vercel.app/blog</loc>",
		);
		expect(body).not.toContain("/blog/");
		expect(JSON.stringify(errorLog?.mock.calls)).toContain(
			"contentful.sitemap_failed",
		);
	});
});
