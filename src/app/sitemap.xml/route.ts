import blogService from "@/features/blog/services/blog.service";
import {
	renderSitemapXml,
	SITEMAP_POST_LIMIT,
	sitemapUrls,
} from "@/features/blog/sitemap-xml";
import { getSiteUrl } from "@/shared/lib/env";
import { log } from "@/shared/lib/log";

/**
 * Same cache window and purge path as `/rss.xml`.
 *
 * `app/sitemap.ts` (the metadata helper) is prerendered with the deploy.
 * On Vercel that copy stays a CDN HIT (`x-vercel-cache`) and
 * `revalidatePath("/sitemap.xml")` does not drop it, even with
 * `revalidate = 60`. A route handler is invalidated with the feed.
 */
export const revalidate = 60;

export async function GET() {
	let posts: Awaited<ReturnType<typeof blogService.getLatestBlogPosts>> = [];

	try {
		posts = await blogService.getLatestBlogPosts(SITEMAP_POST_LIMIT);
	} catch (error) {
		log.error("contentful.sitemap_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
	}

	const xml = renderSitemapXml(
		sitemapUrls({
			siteUrl: getSiteUrl(),
			posts,
		}),
	);

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
}
