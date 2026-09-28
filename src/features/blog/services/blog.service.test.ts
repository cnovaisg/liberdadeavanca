import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/contentful/client", () => ({
	fetchContentfulEntries: vi.fn(),
}));

vi.mock("@/shared/lib/contentful/tags", async () => {
	const actual = await vi.importActual<
		typeof import("@/shared/lib/contentful/tags")
	>("@/shared/lib/contentful/tags");
	return {
		...actual,
		fetchPublicTags: vi.fn(),
	};
});

import { fetchContentfulEntries } from "@/shared/lib/contentful/client";
import { fetchPublicTags } from "@/shared/lib/contentful/tags";
import blogService from "./blog.service";

const entry = {
	sys: {
		id: "post-1",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-02T00:00:00.000Z",
		revision: 1,
	},
	metadata: {
		tags: [{ sys: { id: "economia", linkType: "Tag", type: "Link" } }],
	},
	fields: {
		title: "Impostos",
		subtitle: "Uma nota",
		blogPostContent: {
			nodeType: "document",
			data: {},
			content: [
				{
					nodeType: "paragraph",
					data: {},
					content: [
						{ nodeType: "text", value: "Ver ", marks: [], data: {} },
						{
							nodeType: "hyperlink",
							data: { uri: "https://exemplo.pt" },
							content: [
								{ nodeType: "text", value: "ligação", marks: [], data: {} },
							],
						},
						{ nodeType: "text", value: " hoje.", marks: [], data: {} },
					],
				},
			],
		},
	},
};

describe("BlogService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("mostra os artigos sem etiquetas quando o catálogo falha", async () => {
		vi.mocked(fetchContentfulEntries).mockResolvedValue({
			items: [entry],
		});
		vi.mocked(fetchPublicTags).mockResolvedValue(null);

		const posts = await blogService.getLatestBlogPosts(20);

		expect(posts).toHaveLength(1);
		expect(posts[0]?.tags).toEqual([]);
		expect(posts[0]?.title).toBe("Impostos");
	});

	it("propaga a falha da lista de artigos para a página de erro", async () => {
		vi.mocked(fetchContentfulEntries).mockRejectedValue(
			new Error("Contentful API error: 500"),
		);
		vi.mocked(fetchPublicTags).mockResolvedValue([]);

		await expect(blogService.getLatestBlogPosts(20)).rejects.toThrow(
			"Contentful API error: 500",
		);
		await expect(blogService.getPostById("post-1")).rejects.toThrow(
			"Contentful API error: 500",
		);
	});

	it("mantém a listagem filtrada quando o catálogo falha", async () => {
		vi.mocked(fetchContentfulEntries).mockResolvedValue({
			items: [entry],
		});
		vi.mocked(fetchPublicTags).mockResolvedValue(null);

		await expect(blogService.getPostsByTag("economia")).resolves.toMatchObject({
			tag: null,
			tagsUnavailable: true,
			posts: [{ id: "post-1", tags: [] }],
		});
	});
});
