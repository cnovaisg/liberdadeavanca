import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
	unstable_rethrow: () => {},
}));

vi.mock("@/features/blog", () => ({
	blogService: {
		getPostsByTag: vi.fn(),
	},
	Blog: () => null,
}));

import { notFound } from "next/navigation";
import { blogService } from "@/features/blog";
import BlogTagPage from "./page";

describe("BlogTagPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("chama notFound quando a etiqueta não existe", async () => {
		vi.mocked(blogService.getPostsByTag).mockResolvedValue({
			posts: [],
			tag: null,
			page: 1,
			pageSize: 12,
			total: 0,
			totalPages: 1,
			outOfRange: false,
		});

		await expect(
			BlogTagPage({
				params: Promise.resolve({ tagId: "inexistente" }),
				searchParams: Promise.resolve({}),
			}),
		).rejects.toThrow("NEXT_NOT_FOUND");
		expect(notFound).toHaveBeenCalledOnce();
	});

	it("mantém a listagem quando o catálogo de etiquetas falha", async () => {
		vi.mocked(blogService.getPostsByTag).mockResolvedValue({
			posts: [],
			tag: null,
			tagsUnavailable: true,
			page: 1,
			pageSize: 12,
			total: 0,
			totalPages: 1,
			outOfRange: false,
		});

		const view = await BlogTagPage({
			params: Promise.resolve({ tagId: "sociedade" }),
			searchParams: Promise.resolve({}),
		});

		expect(notFound).not.toHaveBeenCalled();
		expect(view.props).toMatchObject({
			posts: [],
			tag: null,
			filtered: true,
			pagination: {
				page: 1,
				basePath: "/blog/tag/sociedade",
			},
		});
	});

	it("mantém a listagem quando a etiqueta existe sem artigos", async () => {
		const tag = { id: "sociedade", name: "Sociedade" };
		vi.mocked(blogService.getPostsByTag).mockResolvedValue({
			posts: [],
			tag,
			page: 1,
			pageSize: 12,
			total: 0,
			totalPages: 1,
			outOfRange: false,
		});

		const view = await BlogTagPage({
			params: Promise.resolve({ tagId: "sociedade" }),
			searchParams: Promise.resolve({}),
		});

		expect(notFound).not.toHaveBeenCalled();
		expect(view.props).toMatchObject({
			posts: [],
			tag,
			filtered: true,
		});
	});

	it("responde 404 quando a página da etiqueta está fora do intervalo", async () => {
		vi.mocked(blogService.getPostsByTag).mockResolvedValue({
			posts: [],
			tag: { id: "sociedade", name: "Sociedade" },
			page: 4,
			pageSize: 12,
			total: 12,
			totalPages: 1,
			outOfRange: true,
		});

		await expect(
			BlogTagPage({
				params: Promise.resolve({ tagId: "sociedade" }),
				searchParams: Promise.resolve({ page: "4" }),
			}),
		).rejects.toThrow("NEXT_NOT_FOUND");
		expect(blogService.getPostsByTag).toHaveBeenCalledWith("sociedade", 4);
	});

	it("mantém o filtro ao paginar", async () => {
		const tag = { id: "economia", name: "Economia" };
		vi.mocked(blogService.getPostsByTag).mockResolvedValue({
			posts: [],
			tag,
			page: 2,
			pageSize: 12,
			total: 20,
			totalPages: 2,
			outOfRange: false,
		});

		const view = await BlogTagPage({
			params: Promise.resolve({ tagId: "economia" }),
			searchParams: Promise.resolve({ page: "2" }),
		});

		expect(view.props).toMatchObject({
			tag,
			filtered: true,
			pagination: {
				page: 2,
				totalPages: 2,
				basePath: "/blog/tag/economia",
			},
		});
	});
});
