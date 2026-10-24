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

	it("mapeia slug, summary e date e ignora campos em falta ou inválidos", async () => {
		vi.mocked(fetchPublicTags).mockResolvedValue([]);
		vi.mocked(fetchContentfulEntries).mockResolvedValue({
			items: [
				{
					...entry,
					sys: {
						...entry.sys,
						firstPublishedAt: "2026-04-01T08:00:00.000Z",
					},
					fields: {
						...entry.fields,
						slug: "impostos-justos",
						summary: "  uma\nnota  ",
						date: "2026-05-04",
					},
				},
				{
					...entry,
					sys: {
						...entry.sys,
						id: "post-2",
						firstPublishedAt: "2026-04-01T08:00:00.000Z",
					},
					fields: {
						...entry.fields,
						slug: "Não é slug",
						summary: "",
					},
				},
			],
		});

		const posts = await blogService.getLatestBlogPosts(20);

		expect(posts[0]).toMatchObject({
			slug: "impostos-justos",
			summary: "uma nota",
			publishedAt: "2026-05-04T00:00:00.000Z",
		});
		expect(posts[1]?.slug).toBeUndefined();
		expect(posts[1]?.summary).toBeUndefined();
		expect(posts[1]?.publishedAt).toBe("2026-04-01T08:00:00.000Z");
	});

	it("resolve o slug sem redireccionar e o id com slug para o URL canónico", async () => {
		vi.mocked(fetchPublicTags).mockResolvedValue([]);
		vi.mocked(fetchContentfulEntries).mockImplementation(async (options) => {
			const params = options?.searchParams ?? {};
			if (params["fields.slug"] === "impostos-justos") {
				return {
					items: [
						{
							...entry,
							fields: { ...entry.fields, slug: "impostos-justos" },
						},
					],
				};
			}
			if (params["sys.id"] === "3S1ZJyfph0EEUqABNWBx9Q") {
				return {
					items: [
						{
							...entry,
							sys: { ...entry.sys, id: "3S1ZJyfph0EEUqABNWBx9Q" },
							fields: { ...entry.fields, slug: "impostos-justos" },
						},
					],
				};
			}
			if (params["sys.id"] === "post-1") {
				return { items: [entry] };
			}
			return { items: [] };
		});

		await expect(
			blogService.resolveBlogPost("impostos-justos"),
		).resolves.toMatchObject({
			status: "ok",
			post: { slug: "impostos-justos" },
		});
		expect(fetchContentfulEntries).toHaveBeenCalledTimes(1);

		vi.mocked(fetchContentfulEntries).mockClear();
		await expect(
			blogService.resolveBlogPost("3S1ZJyfph0EEUqABNWBx9Q"),
		).resolves.toMatchObject({
			status: "redirect",
			to: "/blog/impostos-justos",
		});
		expect(fetchContentfulEntries).toHaveBeenCalledTimes(1);

		vi.mocked(fetchContentfulEntries).mockClear();
		await expect(blogService.resolveBlogPost("post-1")).resolves.toMatchObject({
			status: "ok",
			post: { id: "post-1" },
		});
		expect(fetchContentfulEntries).toHaveBeenCalledTimes(2);

		vi.mocked(fetchContentfulEntries).mockClear();
		await expect(blogService.resolveBlogPost("../etc")).resolves.toEqual({
			status: "not_found",
		});
		expect(fetchContentfulEntries).not.toHaveBeenCalled();
	});

	it("pagina a listagem e a etiqueta e devolve null fora do intervalo", async () => {
		vi.mocked(fetchPublicTags).mockResolvedValue([
			{ id: "economia", name: "Economia" },
		]);
		vi.mocked(fetchContentfulEntries).mockResolvedValue({
			items: [entry],
			total: 25,
		});

		await expect(blogService.getBlogPage(2)).resolves.toMatchObject({
			page: 2,
			pageSize: 12,
			total: 25,
			totalPages: 3,
		});
		expect(fetchContentfulEntries).toHaveBeenCalledWith(
			expect.objectContaining({
				searchParams: expect.objectContaining({
					limit: "12",
					skip: "12",
				}),
			}),
		);

		vi.mocked(fetchContentfulEntries).mockClear();
		await expect(blogService.getBlogPage(4)).resolves.toBeNull();

		vi.mocked(fetchContentfulEntries).mockClear();
		await expect(blogService.getBlogPage(0)).resolves.toBeNull();
		expect(fetchContentfulEntries).not.toHaveBeenCalled();

		await expect(
			blogService.getPostsByTag("economia", 2),
		).resolves.toMatchObject({
			tag: { id: "economia", name: "Economia" },
			page: 2,
			totalPages: 3,
			outOfRange: false,
		});
		expect(fetchContentfulEntries).toHaveBeenCalledWith(
			expect.objectContaining({
				searchParams: expect.objectContaining({
					"metadata.tags.sys.id[in]": "economia",
					limit: "12",
					skip: "12",
				}),
			}),
		);
	});

	it("artigos antigos sem slug, summary ou date continuam pelo id e por createdAt", async () => {
		vi.mocked(fetchContentfulEntries).mockResolvedValue({ items: [entry] });
		vi.mocked(fetchPublicTags).mockResolvedValue([]);

		const posts = await blogService.getLatestBlogPosts(1);

		expect(posts[0]).toMatchObject({
			id: "post-1",
			publishedAt: "2026-01-01T00:00:00.000Z",
		});
		expect(posts[0]?.slug).toBeUndefined();
		expect(posts[0]?.summary).toBeUndefined();
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
