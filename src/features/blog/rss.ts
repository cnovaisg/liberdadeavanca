import { SITE_DESCRIPTION, SITE_NAME } from "@/shared/lib/seo";

export const RSS_POST_LIMIT = 50;

export type RssFeedItem = {
	title: string;
	/** Site path, preferably the canonical slug URL. */
	path: string;
	description: string;
	publishedAt: string;
};

/** XML 1.0 disallows most C0 controls, plus U+FFFE and U+FFFF. */
function stripIllegalXml(value: string): string {
	let result = "";
	for (const char of value) {
		const code = char.codePointAt(0) ?? 0;
		const illegal =
			code <= 8 ||
			code === 11 ||
			code === 12 ||
			(code >= 14 && code <= 31) ||
			code === 0xfffe ||
			code === 0xffff;
		if (!illegal) result += char;
	}
	return result;
}

/** Escapes text and attribute values. Ampersands are replaced first. */
export function escapeXml(value: string): string {
	return stripIllegalXml(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function absoluteUrl(siteUrl: string, path: string): string {
	const origin = siteUrl.replace(/\/$/, "");
	if (/^https?:\/\//i.test(path)) return path;
	return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function rssPubDate(iso: string): string | undefined {
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return undefined;
	return parsed.toUTCString();
}

export function buildRssFeed(input: {
	siteUrl: string;
	title?: string;
	description?: string;
	posts: RssFeedItem[];
}): string {
	const siteUrl = input.siteUrl.replace(/\/$/, "");
	const items = input.posts
		.map((post) => {
			const link = absoluteUrl(siteUrl, post.path);
			const pubDate = rssPubDate(post.publishedAt);
			return [
				"<item>",
				`<title>${escapeXml(post.title)}</title>`,
				`<link>${escapeXml(link)}</link>`,
				`<guid isPermaLink="true">${escapeXml(link)}</guid>`,
				`<description>${escapeXml(post.description)}</description>`,
				pubDate ? `<pubDate>${escapeXml(pubDate)}</pubDate>` : "",
				"</item>",
			].join("");
		})
		.join("");

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0">',
		"<channel>",
		`<title>${escapeXml(input.title ?? SITE_NAME)}</title>`,
		`<link>${escapeXml(siteUrl)}</link>`,
		`<description>${escapeXml(input.description ?? SITE_DESCRIPTION)}</description>`,
		"<language>pt-PT</language>",
		items,
		"</channel>",
		"</rss>",
	].join("");
}
