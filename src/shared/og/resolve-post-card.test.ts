import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveBlogPost = vi.fn();

vi.mock("next/navigation", () => ({
	unstable_rethrow: (error: unknown) => {
		if (
			error &&
			typeof error === "object" &&
			"digest" in error &&
			typeof error.digest === "string" &&
			error.digest.startsWith("NEXT_REDIRECT")
		) {
			throw error;
		}
	},
}));

vi.mock("@/features/blog/services/blog.service", () => ({
	default: {
		resolveBlogPost: (...args: unknown[]) => resolveBlogPost(...args),
	},
}));

import { OG_POST_IMAGE_ID, SHARE_SITE_ALT } from "./copy";
import { readPostId, resolvePostShareCard } from "./resolve-post-card";

const post = {
	id: "3S1ZJyfph0EEUqABNWBx9Q",
	slug: "impostos-justos",
	title: "Impostos justos",
};

describe("resolver do cartão do artigo", () => {
	beforeEach(() => {
		resolveBlogPost.mockReset();
	});

	it("aceita params já resolvidos ou em Promise", async () => {
		await expect(readPostId(undefined)).resolves.toBeUndefined();
		await expect(readPostId({ postId: "impostos-justos" })).resolves.toBe(
			"impostos-justos",
		);
		await expect(readPostId(Promise.resolve({ postId: "abc" }))).resolves.toBe(
			"abc",
		);
	});

	it("usa o título quando o slug ou o id resolvem", async () => {
		resolveBlogPost.mockResolvedValue({ status: "ok", post });

		await expect(
			resolvePostShareCard("impostos-justos"),
		).resolves.toMatchObject({
			variant: "post",
			title: "Impostos justos",
			alt: "Impostos justos · Liberdade Avança",
		});
		expect(resolveBlogPost).toHaveBeenCalledWith("impostos-justos");

		resolveBlogPost.mockResolvedValue({
			status: "redirect",
			to: "/blog/impostos-justos",
			post,
		});
		await expect(
			resolvePostShareCard("3S1ZJyfph0EEUqABNWBx9Q"),
		).resolves.toMatchObject({ variant: "post", title: "Impostos justos" });
		expect(OG_POST_IMAGE_ID).toBe("card");
	});

	it("cai no cartão do site se o artigo não existe ou o Contentful falha", async () => {
		resolveBlogPost.mockResolvedValue({ status: "not_found" });
		await expect(resolvePostShareCard("nao-existe")).resolves.toMatchObject({
			variant: "site",
			alt: SHARE_SITE_ALT,
		});

		resolveBlogPost.mockRejectedValue(new Error("contentful down"));
		await expect(
			resolvePostShareCard("impostos-justos"),
		).resolves.toMatchObject({ variant: "site" });

		await expect(resolvePostShareCard("  ")).resolves.toMatchObject({
			variant: "site",
		});
		expect(resolveBlogPost).toHaveBeenCalledTimes(2);
	});

	it("não engole um redirect do Next.js", async () => {
		const redirect = Object.assign(new Error("redirect"), {
			digest: "NEXT_REDIRECT;replace;/blog/x;308;",
		});
		resolveBlogPost.mockRejectedValue(redirect);
		await expect(resolvePostShareCard("x")).rejects.toBe(redirect);
	});
});
