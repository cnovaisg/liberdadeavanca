import { beforeEach, describe, expect, it, vi } from "vitest";

const getLatestBlogPosts = vi.fn();

vi.mock("@/features/blog/services/blog.service", () => ({
	default: {
		getLatestBlogPosts: (...args: unknown[]) => getLatestBlogPosts(...args),
	},
}));

vi.mock("@/shared/lib/env", () => ({
	getSiteUrl: () => "https://liberdadeavanca.vercel.app",
}));

import sitemap from "./sitemap";

describe("sitemap", () => {
	let errorLog: ReturnType<typeof vi.spyOn> | undefined;

	beforeEach(() => {
		errorLog?.mockRestore();
		vi.clearAllMocks();
		errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("inclui as rotas estáticas e os artigos", async () => {
		getLatestBlogPosts.mockResolvedValue([
			{
				id: "post-1",
				updatedAt: "2026-03-01T00:00:00.000Z",
			},
		]);

		const entries = await sitemap();

		expect(entries.map((entry) => entry.url)).toEqual([
			"https://liberdadeavanca.vercel.app",
			"https://liberdadeavanca.vercel.app/manifesto",
			"https://liberdadeavanca.vercel.app/blog",
			"https://liberdadeavanca.vercel.app/blog/post-1",
		]);
	});

	it("fica só com as rotas estáticas se o Contentful falhar", async () => {
		getLatestBlogPosts.mockRejectedValue(new Error("Contentful API error"));

		const entries = await sitemap();

		expect(entries.map((entry) => entry.url)).toEqual([
			"https://liberdadeavanca.vercel.app",
			"https://liberdadeavanca.vercel.app/manifesto",
			"https://liberdadeavanca.vercel.app/blog",
		]);
		expect(JSON.stringify(errorLog?.mock.calls)).toContain(
			"contentful.sitemap_failed",
		);
	});
});
