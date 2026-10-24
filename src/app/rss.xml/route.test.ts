import { beforeEach, describe, expect, it, vi } from "vitest";

const getLatestBlogPosts = vi.fn();

vi.mock("@/features/blog/services/blog.service", () => ({
	default: {
		getLatestBlogPosts: (...args: unknown[]) => getLatestBlogPosts(...args),
	},
}));

import { GET } from "./route";

describe("GET /rss.xml", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("responde com RSS escapado e o content-type correcto", async () => {
		getLatestBlogPosts.mockResolvedValue([
			{
				id: "post-1",
				slug: "tom-jerry",
				title: "Tom & Jerry",
				summary: "A & B <tag>",
				publishedAt: "2026-05-04T00:00:00.000Z",
				updatedAt: "2026-05-04T00:00:00.000Z",
				value: null,
			},
		]);

		const response = await GET();
		const body = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe(
			"application/rss+xml; charset=utf-8",
		);
		expect(body).toContain(
			"<link>https://liberdadeavanca.vercel.app/blog/tom-jerry</link>",
		);
		expect(body).toContain("<title>Tom &amp; Jerry</title>");
		expect(body).toContain("<description>A &amp; B &lt;tag&gt;</description>");
		expect(body).not.toContain("<tag>");
		expect(getLatestBlogPosts).toHaveBeenCalledWith(50);
	});
});
