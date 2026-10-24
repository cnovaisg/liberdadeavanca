import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_URL } from "@/shared/lib/env";
import {
	clipShareTitle,
	OG_IMAGE_SIZE,
	postShareCard,
	SHARE_SITE_ALT,
	shareTitleSize,
	siteHost,
	siteShareCard,
} from "./copy";

const siteUrl = DEFAULT_SITE_URL;

describe("cartão de partilha", () => {
	it("o cartão do site leva o nome, o lema e o domínio", () => {
		expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
		expect(siteShareCard(siteUrl)).toMatchObject({
			variant: "site",
			kicker: "MOVIMENTO",
			title: "LIBERDADE AVANÇA",
			subtitle: "Em defesa da sociedade civil.",
			footer: "liberdadeavanca.vercel.app",
			alt: SHARE_SITE_ALT,
		});
		expect(siteHost(siteUrl)).toBe("liberdadeavanca.vercel.app");
	});

	it("o cartão do artigo destaca o título e define o alt", () => {
		expect(postShareCard("Impostos justos", siteUrl)).toMatchObject({
			variant: "post",
			kicker: "LIBERDADE AVANÇA",
			title: "Impostos justos",
			footer: "liberdadeavanca.vercel.app",
			alt: "Impostos justos · Liberdade Avança",
			titleSize: 84,
		});
		expect(postShareCard("   ", siteUrl)).toBeNull();
	});

	it("encurta títulos longos e reduz o corpo da letra", () => {
		const long = "palavra ".repeat(30);
		const clipped = clipShareTitle(long);
		expect([...clipped].length).toBeLessThanOrEqual(110);
		expect(clipped.endsWith("…")).toBe(true);
		expect(shareTitleSize(clipped)).toBe(44);
		expect(shareTitleSize("Curto")).toBe(84);
		expect(postShareCard(`  linha\n\tseguinte  `, siteUrl)?.title).toBe(
			"linha seguinte",
		);
	});
});
