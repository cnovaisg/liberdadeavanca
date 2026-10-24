import { describe, expect, it } from "vitest";
import { buildRssFeed, escapeXml } from "./rss";

function assertWellFormedXml(xml: string) {
	expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
	const withoutDeclaration = xml.replace(/<\?xml[^?]*\?>/, "");
	const tokens = withoutDeclaration.match(/<\/?[^>]+>/g) ?? [];
	const stack: string[] = [];

	for (const token of tokens) {
		if (token.startsWith("</")) {
			const name = token.slice(2, -1).trim();
			expect(stack.pop()).toBe(name);
			continue;
		}
		if (token.endsWith("/>")) continue;
		const name = token.slice(1, -1).split(/\s/)[0] ?? "";
		stack.push(name);
	}

	expect(stack).toEqual([]);
	expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#)/);
}

describe("RSS", () => {
	it("gera XML válido com link canónico, resumo e data", () => {
		const xml = buildRssFeed({
			siteUrl: "https://liberdadeavanca.vercel.app",
			posts: [
				{
					title: "Impostos",
					path: "/blog/impostos-justos",
					description: "Um resumo",
					publishedAt: "2026-05-04T00:00:00.000Z",
				},
			],
		});

		assertWellFormedXml(xml);
		expect(xml).toContain("<language>pt-PT</language>");
		expect(xml).toContain(
			"<link>https://liberdadeavanca.vercel.app/blog/impostos-justos</link>",
		);
		expect(xml).toContain(
			'<guid isPermaLink="true">https://liberdadeavanca.vercel.app/blog/impostos-justos</guid>',
		);
		expect(xml).toContain("<description>Um resumo</description>");
		expect(xml).toContain("<pubDate>Mon, 04 May 2026 00:00:00 GMT</pubDate>");
	});

	it("escapa texto que quebraria o XML", () => {
		const hostile = `Tom & Jerry <script>alert("x")</script> d'água`;
		expect(escapeXml(hostile)).toBe(
			"Tom &amp; Jerry &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; d&apos;água",
		);

		const xml = buildRssFeed({
			siteUrl: "https://liberdadeavanca.vercel.app",
			posts: [
				{
					title: hostile,
					path: "/blog/tom-jerry",
					description: "A & B <tag>",
					publishedAt: "2026-01-01T00:00:00.000Z",
				},
			],
		});

		assertWellFormedXml(xml);
		expect(xml).toContain(
			"<title>Tom &amp; Jerry &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; d&apos;água</title>",
		);
		expect(xml).toContain("<description>A &amp; B &lt;tag&gt;</description>");
		expect(xml).not.toContain("<script>");
		expect(xml).not.toContain("A & B");
	});
});
