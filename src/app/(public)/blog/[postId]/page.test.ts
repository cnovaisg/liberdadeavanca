import { beforeEach, describe, expect, it, vi } from "vitest";

const permanentRedirect = vi.fn((url: string) => {
	throw new Error(`NEXT_REDIRECT:${url}`);
});
const redirect = vi.fn();
const notFound = vi.fn(() => {
	throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
	permanentRedirect: (url: string) => permanentRedirect(url),
	redirect: (...args: unknown[]) => redirect(...args),
	notFound: () => notFound(),
	unstable_rethrow: () => {},
}));

vi.mock("@/features/blog", () => ({
	blogService: {
		resolveBlogPost: vi.fn(),
	},
	BlogPost: () => null,
}));

import { permanentRedirect as frameworkPermanentRedirect } from "next/dist/client/components/redirect";
import { blogService } from "@/features/blog";
import IndividualBlogPage, { generateMetadata } from "./page";

const post = {
	id: "3S1ZJyfph0EEUqABNWBx9Q",
	slug: "impostos-justos",
	title: "Impostos",
	summary: "Um resumo",
	publishedAt: "2026-05-04T00:00:00.000Z",
	updatedAt: "2026-05-05T00:00:00.000Z",
	createdAt: "2026-01-01T00:00:00.000Z",
	revision: 1,
	authors: [],
	tags: [],
	value: null,
};

describe("artigo do blog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("permanentRedirect do Next.js responde 308", () => {
		expect(() => frameworkPermanentRedirect("/blog/impostos-justos")).toThrow(
			expect.objectContaining({
				digest: "NEXT_REDIRECT;replace;/blog/impostos-justos;308;",
			}),
		);
	});

	it("redirecciona de forma permanente o id para o slug", async () => {
		vi.mocked(blogService.resolveBlogPost).mockResolvedValue({
			status: "redirect",
			to: "/blog/impostos-justos",
			post,
		});

		await expect(
			IndividualBlogPage({
				params: Promise.resolve({ postId: "3S1ZJyfph0EEUqABNWBx9Q" }),
			}),
		).rejects.toThrow("NEXT_REDIRECT:/blog/impostos-justos");

		expect(permanentRedirect).toHaveBeenCalledWith("/blog/impostos-justos");
		expect(redirect).not.toHaveBeenCalled();
		expect(notFound).not.toHaveBeenCalled();
	});

	it("mostra o artigo quando o parâmetro já é o slug", async () => {
		vi.mocked(blogService.resolveBlogPost).mockResolvedValue({
			status: "ok",
			post,
		});

		const view = await IndividualBlogPage({
			params: Promise.resolve({ postId: "impostos-justos" }),
		});

		expect(permanentRedirect).not.toHaveBeenCalled();
		expect(view.props.post).toBe(post);
	});

	it("responde 404 quando o artigo não existe", async () => {
		vi.mocked(blogService.resolveBlogPost).mockResolvedValue({
			status: "not_found",
		});

		await expect(
			IndividualBlogPage({
				params: Promise.resolve({ postId: "nao-existe" }),
			}),
		).rejects.toThrow("NEXT_NOT_FOUND");
		expect(notFound).toHaveBeenCalledOnce();
	});

	it("o canonical dos metadados é o slug, mesmo a partir do id", async () => {
		vi.mocked(blogService.resolveBlogPost).mockResolvedValue({
			status: "redirect",
			to: "/blog/impostos-justos",
			post,
		});

		const metadata = await generateMetadata({
			params: Promise.resolve({ postId: "3S1ZJyfph0EEUqABNWBx9Q" }),
		});

		expect(metadata.alternates?.canonical).toBe("/blog/impostos-justos");
		expect(metadata.description).toBe("Um resumo");
		expect(metadata.openGraph).toMatchObject({
			type: "article",
			publishedTime: "2026-05-04T00:00:00.000Z",
		});
	});
});
