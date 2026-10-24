import { blogPostDescription, canonicalBlogPath } from "@/features/blog/fields";
import { buildRssFeed, RSS_POST_LIMIT } from "@/features/blog/rss";
import blogService from "@/features/blog/services/blog.service";
import { getSiteUrl } from "@/shared/lib/env";
import { log } from "@/shared/lib/log";

/** Same window as the blog Contentful fetch. The webhook also purges this path. */
export const revalidate = 60;

export async function GET() {
	let posts: Awaited<ReturnType<typeof blogService.getLatestBlogPosts>> = [];

	try {
		posts = await blogService.getLatestBlogPosts(RSS_POST_LIMIT);
	} catch (error) {
		log.error("contentful.rss_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
	}

	const xml = buildRssFeed({
		siteUrl: getSiteUrl(),
		posts: posts.map((post) => ({
			title: post.title,
			path: canonicalBlogPath(post),
			description: blogPostDescription(post),
			publishedAt: post.publishedAt,
		})),
	});

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
		},
	});
}
