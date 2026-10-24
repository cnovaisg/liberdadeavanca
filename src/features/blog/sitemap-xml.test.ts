import { describe, expect, it } from "vitest";
import { renderSitemapXml, sitemapUrls } from "./sitemap-xml";

const siteUrl = "https://liberdadeavanca.vercel.app";

function assertWellFormedXml(xml: string) {
	expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
	const withoutDeclaration = xml.replace(/<\?xml[^?]*\?>/, "");
	const tokens = withoutDeclaration.match(/<\/?[^>]+>/g) ?? [];
	const stack: string[] = [];

	for (const token of tokens) {
		if (token.startsWith("</")) {
			expect(stack.pop()).toBe(token.slice(2, -1).split(/\s/)[0]);
			continue;
		}
		if (token.endsWith("/>")) continue;
		const name = token.slice(1, -1).split(/\s/)[0] ?? "";
		stack.push(name);
	}

	expect(stack).toEqual([]);
	expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#)/);
}

describe("sitemap XML", () => {
	it("inclui as rotas estáticas e o id quando não há slug", () => {
		const urls = sitemapUrls({
			siteUrl,
			posts: [{ id: "post-1", updatedAt: "2026-03-01T00:00:00.000Z" }],
		});

		expect(urls.map((entry) => entry.loc)).toEqual([
			siteUrl,
			`${siteUrl}/manifesto`,
			`${siteUrl}/blog`,
			`${siteUrl}/blog/post-1`,
		]);
		expect(urls[3]?.lastmod).toBe("2026-03-01T00:00:00.000Z");
	});

	it("usa o slug e ignora uma data de actualização inválida", () => {
		const urls = sitemapUrls({
			siteUrl,
			posts: [
				{
					id: "post-1",
					slug: "teste-de-funcionalidades",
					updatedAt: "2026-03-01T00:00:00.000Z",
				},
				{ id: "post-2", updatedAt: "não é data" },
			],
		});

		expect(urls.map((entry) => entry.loc)).toEqual([
			siteUrl,
			`${siteUrl}/manifesto`,
			`${siteUrl}/blog`,
			`${siteUrl}/blog/teste-de-funcionalidades`,
			`${siteUrl}/blog/post-2`,
		]);
		expect(urls[4]?.lastmod).toBeUndefined();
	});

	it("escapa o XML e mantém o documento bem formado", () => {
		const xml = renderSitemapXml([
			{ loc: "https://example.com/?a=1&b=2" },
			{
				loc: "https://example.com/blog/teste-de-funcionalidades",
				lastmod: "2026-03-01T00:00:00.000Z",
			},
		]);

		assertWellFormedXml(xml);
		expect(xml).toContain("<loc>https://example.com/?a=1&amp;b=2</loc>");
		expect(xml).toContain(
			"<loc>https://example.com/blog/teste-de-funcionalidades</loc>",
		);
		expect(xml).toContain("<lastmod>2026-03-01T00:00:00.000Z</lastmod>");
		expect(xml).not.toContain("a=1&b=2");
	});
});
