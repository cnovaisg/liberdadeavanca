import { describe, expect, it } from "vitest";
import {
	blogParamFromExpandedUrl,
	readTweetCardTitle,
	renderTweetText,
	siteHostsFromOrigins,
} from "./tweet-text";

const hosts = siteHostsFromOrigins(["https://liberdadeavanca.vercel.app"]);
const mileiUrl = "https://t.co/FBPY5ggWcC";
const mileiExpanded =
	"https://liberdadeavanca.vercel.app/blog/milei-e-o-mercado-de-arrendamento";
const mileiTitle = "Milei e o mercado de arrendamento: menos lei, mais casas";

describe("texto do tweet", () => {
	it("lê o slug de um artigo do próprio site", () => {
		expect(blogParamFromExpandedUrl(mileiExpanded, hosts)).toBe(
			"milei-e-o-mercado-de-arrendamento",
		);
		expect(
			blogParamFromExpandedUrl(
				"https://www.nytimes.com/2026/10/25/world.html",
				hosts,
			),
		).toBeUndefined();
		expect(
			blogParamFromExpandedUrl(
				"https://liberdadeavanca.vercel.app/manifesto",
				hosts,
			),
		).toBeUndefined();
	});

	it("um tweet só com o link do artigo mostra o título", () => {
		expect(
			renderTweetText(mileiUrl, [
				{
					url: mileiUrl,
					expandedUrl: mileiExpanded,
					displayUrl: "liberdadeavanca.vercel.app/blog/milei-e-o…",
					label: mileiTitle,
				},
			]),
		).toBe(mileiTitle);
	});

	it("um link externo usa o título do cartão ou o display_url", () => {
		const tco = "https://t.co/nyt1mes";
		expect(
			renderTweetText(tco, [
				{
					url: tco,
					displayUrl: "nytimes.com/…",
					label: "Argentina ends rent control",
				},
			]),
		).toBe("Argentina ends rent control");
		expect(
			renderTweetText(tco, [
				{ url: tco, displayUrl: "nytimes.com/…", label: "nytimes.com/…" },
			]),
		).toBe("nytimes.com/…");
	});

	it("com texto além do link, remove só o t.co final", () => {
		const card = "https://t.co/card00";
		const inline = "https://t.co/inline";
		expect(
			renderTweetText(`A oferta voltou. ${card}`, [
				{ url: card, label: "não deve aparecer" },
			]),
		).toBe("A oferta voltou.");
		expect(
			renderTweetText(`Ver ${inline} e o resto ${card}`, [
				{ url: inline, label: "nytimes.com/…" },
				{ url: card, label: "cartão" },
			]),
		).toBe("Ver nytimes.com/… e o resto");
	});

	it("lê o título do cartão nos formatos que a SocialData pode trazer", () => {
		expect(readTweetCardTitle({ title: "  Um título  " })).toBe("Um título");
		expect(
			readTweetCardTitle({
				legacy: {
					binding_values: [
						{ key: "title", value: { string_value: "Do binding" } },
					],
				},
			}),
		).toBe("Do binding");
		expect(readTweetCardTitle(undefined)).toBeUndefined();
	});
});
