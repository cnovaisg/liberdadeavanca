import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
	unstable_rethrow: () => {},
}));

vi.mock("@/features/blog", () => ({
	blogService: {
		getBlogPage: vi.fn(),
	},
	Blog: () => null,
}));

import { notFound } from "next/navigation";
import { blogService } from "@/features/blog";
import { BlogIndex, generateMetadata } from "./page";

const search = (page?: string) =>
	Promise.resolve(page === undefined ? {} : { page });

describe("BlogIndex", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("pede a página 1 quando o query não traz page", async () => {
		vi.mocked(blogService.getBlogPage).mockResolvedValue({
			posts: [],
			page: 1,
			pageSize: 12,
			total: 0,
			totalPages: 1,
		});

		const view = await BlogIndex({ searchParams: search() });

		expect(blogService.getBlogPage).toHaveBeenCalledWith(1);
		expect(view.props).toMatchObject({
			posts: [],
			pagination: { page: 1, totalPages: 1, basePath: "/blog" },
		});
	});

	it("passa a página pedida à listagem", async () => {
		vi.mocked(blogService.getBlogPage).mockResolvedValue({
			posts: [],
			page: 2,
			pageSize: 12,
			total: 20,
			totalPages: 2,
		});

		const view = await BlogIndex({ searchParams: search("2") });

		expect(blogService.getBlogPage).toHaveBeenCalledWith(2);
		expect(view.props.pagination).toEqual({
			page: 2,
			totalPages: 2,
			basePath: "/blog",
		});
	});

	it("responde 404 a uma página inválida ou fora do intervalo", async () => {
		await expect(BlogIndex({ searchParams: search("0") })).rejects.toThrow(
			"NEXT_NOT_FOUND",
		);
		expect(blogService.getBlogPage).not.toHaveBeenCalled();

		vi.mocked(blogService.getBlogPage).mockResolvedValue(null);
		await expect(BlogIndex({ searchParams: search("9") })).rejects.toThrow(
			"NEXT_NOT_FOUND",
		);
		expect(notFound).toHaveBeenCalledTimes(2);
	});
});

describe("generateMetadata da listagem", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("aponta o canonical da página 2 para ?page=2", async () => {
		vi.mocked(blogService.getBlogPage).mockResolvedValue({
			posts: [],
			page: 2,
			pageSize: 12,
			total: 30,
			totalPages: 3,
		});

		const metadata = await generateMetadata({ searchParams: search("2") });

		expect(metadata.alternates?.canonical).toBe("/blog?page=2");
		expect(metadata.pagination).toEqual({
			previous: "/blog",
			next: "/blog?page=3",
		});
	});
});
