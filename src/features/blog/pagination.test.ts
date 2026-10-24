import { describe, expect, it } from "vitest";
import {
	BLOG_PAGE_SIZE,
	blogPageHref,
	listingPageState,
	parseBlogPageParam,
} from "./pagination";

describe("paginação do blog", () => {
	it("usa entre 10 e 12 artigos por página", () => {
		expect(BLOG_PAGE_SIZE).toBeGreaterThanOrEqual(10);
		expect(BLOG_PAGE_SIZE).toBeLessThanOrEqual(12);
		expect(BLOG_PAGE_SIZE).toBe(12);
	});

	it("trata a ausência de page como 1 e rejeita valores fora do formato", () => {
		expect(parseBlogPageParam(undefined)).toBe(1);
		expect(parseBlogPageParam("")).toBe(1);
		expect(parseBlogPageParam("  ")).toBe(1);
		expect(parseBlogPageParam("2")).toBe(2);
		expect(parseBlogPageParam(["3"])).toBe(3);
		expect(parseBlogPageParam("0")).toBeNull();
		expect(parseBlogPageParam("-1")).toBeNull();
		expect(parseBlogPageParam("01")).toBeNull();
		expect(parseBlogPageParam("1.5")).toBeNull();
		expect(parseBlogPageParam("abc")).toBeNull();
		expect(parseBlogPageParam("10001")).toBeNull();
	});

	it("calcula o intervalo e marca páginas a mais como fora", () => {
		expect(listingPageState(0, 1)).toEqual({
			status: "ok",
			totalPages: 1,
			skip: 0,
		});
		expect(listingPageState(25, 1)).toEqual({
			status: "ok",
			totalPages: 3,
			skip: 0,
		});
		expect(listingPageState(25, 2)).toEqual({
			status: "ok",
			totalPages: 3,
			skip: 12,
		});
		expect(listingPageState(25, 3)).toEqual({
			status: "ok",
			totalPages: 3,
			skip: 24,
		});
		expect(listingPageState(25, 4)).toEqual({
			status: "out_of_range",
			totalPages: 3,
		});
		expect(listingPageState(0, 2).status).toBe("out_of_range");
	});

	it("combina a página com o filtro por etiqueta", () => {
		expect(blogPageHref("/blog", 1)).toBe("/blog");
		expect(blogPageHref("/blog", 2)).toBe("/blog?page=2");
		expect(blogPageHref("/blog/tag/economia", 1)).toBe("/blog/tag/economia");
		expect(blogPageHref("/blog/tag/economia", 2)).toBe(
			"/blog/tag/economia?page=2",
		);
	});
});
