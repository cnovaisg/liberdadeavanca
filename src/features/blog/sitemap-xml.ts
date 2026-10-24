import { canonicalBlogPath } from "./fields";
import { escapeXml } from "./rss";

/** Same cap the metadata sitemap used. Contentful allows at most 1000 per request. */
export const SITEMAP_POST_LIMIT = 1000;

const STATIC_PATHS = ["/", "/manifesto", "/blog"] as const;

export type SitemapUrl = {
	loc: string;
	lastmod?: string;
};

export function sitemapUrls(input: {
	siteUrl: string;
	posts: Array<{ id: string; slug?: string; updatedAt: string }>;
}): SitemapUrl[] {
	const siteUrl = input.siteUrl.replace(/\/$/, "");
	const entries: SitemapUrl[] = STATIC_PATHS.map((path) => ({
		loc: path === "/" ? siteUrl : `${siteUrl}${path}`,
	}));

	for (const post of input.posts) {
		const lastModified = new Date(post.updatedAt);
		entries.push({
			loc: `${siteUrl}${canonicalBlogPath(post)}`,
			...(Number.isNaN(lastModified.getTime())
				? {}
				: { lastmod: lastModified.toISOString() }),
		});
	}

	return entries;
}

export function renderSitemapXml(entries: SitemapUrl[]): string {
	const urls = entries
		.map((entry) => {
			const lastmod = entry.lastmod
				? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>`
				: "";
			return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
		})
		.join("");

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		"</urlset>",
	].join("");
}
