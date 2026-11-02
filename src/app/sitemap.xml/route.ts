import blogService from "@/features/blog/services/blog.service";
import {
	renderSitemapXml,
	SITEMAP_POST_LIMIT,
	sitemapUrls,
} from "@/features/blog/sitemap-xml";
import { getSiteUrl } from "@/shared/lib/env";
import { log } from "@/shared/lib/log";

/**
 * Render on each request. `revalidate = 60` prerenders this URL as a static
 * file (build output: revalidate 1m, expire 1y). On Vercel that file stays
 * `x-vercel-cache: HIT` and `revalidatePath("/sitemap.xml")` does not replace
 * it, so an unpublished post remains listed after the webhook.
 *
 * The post list still comes from `getLatestBlogPosts`, which uses the `blog`
 * fetch tag and the same 60s window as `/rss.xml` and `/blog`. The webhook's
 * `revalidateTag("blog")` drops that entry; the next request reads published
 * posts, including `sys.updatedAt` for `<lastmod>`.
 */
export const dynamic = "force-dynamic";

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
			"Cache-Control":
				"private, no-cache, no-store, max-age=0, must-revalidate",
		},
	});
}
