import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_URL, getSiteUrl } from "./env";
import { pageMetadata, rootMetadata, SITE_TITLE_TEMPLATE } from "./seo";

describe("metadados do site", () => {
	it("define metadataBase, o template de título e o feed RSS", () => {
		expect(DEFAULT_SITE_URL).toBe("https://liberdadeavanca.vercel.app");
		expect(SITE_TITLE_TEMPLATE).toBe("%s · Liberdade Avança");

		const metadata = rootMetadata();
		const siteUrl = getSiteUrl();

		expect(metadata.metadataBase).toEqual(new URL(siteUrl));
		expect(metadata.title).toEqual({
			default: "Liberdade Avança",
			template: "%s · Liberdade Avança",
		});
		expect(metadata.alternates?.types?.["application/rss+xml"]).toEqual([
			{
				title: "Liberdade Avança",
				url: `${siteUrl}/rss.xml`,
			},
		]);
		expect(metadata.openGraph).toMatchObject({
			type: "website",
			locale: "pt_PT",
			siteName: "Liberdade Avança",
		});
		expect(metadata.twitter).toMatchObject({ card: "summary" });
	});

	it("cada página leva canonical, Open Graph e Twitter", () => {
		const metadata = pageMetadata({
			title: "Manifesto",
			description: "Manifesto do movimento Liberdade Avança.",
			canonicalPath: "/manifesto",
		});

		expect(metadata.alternates?.canonical).toBe("/manifesto");
		expect(metadata.openGraph).toMatchObject({
			type: "website",
			title: "Manifesto",
			url: "/manifesto",
		});
		expect(metadata.twitter).toMatchObject({
			card: "summary",
			description: "Manifesto do movimento Liberdade Avança.",
		});
	});
});
