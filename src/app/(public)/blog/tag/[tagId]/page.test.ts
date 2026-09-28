import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
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
		});

		await expect(
			BlogTagPage({ params: Promise.resolve({ tagId: "inexistente" }) }),
		).rejects.toThrow("NEXT_NOT_FOUND");
		expect(notFound).toHaveBeenCalledOnce();
	});

	it("mantém a listagem quando o catálogo de etiquetas falha", async () => {
		vi.mocked(blogService.getPostsByTag).mockResolvedValue({
			posts: [],
			tag: null,
			tagsUnavailable: true,
		});

		const view = await BlogTagPage({
			params: Promise.resolve({ tagId: "sociedade" }),
		});

		expect(notFound).not.toHaveBeenCalled();
		expect(view.props).toMatchObject({
			posts: [],
			tag: null,
			filtered: true,
		});
	});

	it("mantém a listagem quando a etiqueta existe sem artigos", async () => {
		const tag = { id: "sociedade", name: "Sociedade" };
		vi.mocked(blogService.getPostsByTag).mockResolvedValue({
			posts: [],
			tag,
		});

		const view = await BlogTagPage({
			params: Promise.resolve({ tagId: "sociedade" }),
		});

		expect(notFound).not.toHaveBeenCalled();
		expect(view.props).toMatchObject({
			posts: [],
			tag,
			filtered: true,
		});
	});
});
