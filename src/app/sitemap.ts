import type { MetadataRoute } from "next";
import blogService from "@/features/blog/services/blog.service";
import { getSiteUrl } from "@/shared/lib/env";
import { log } from "@/shared/lib/log";

/** Same window as the blog Contentful fetch (`BLOG_REVALIDATE_SECONDS`). */
export const revalidate = 60;

const staticPaths = ["/", "/manifesto", "/blog"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = getSiteUrl();
	const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
		url: path === "/" ? siteUrl : `${siteUrl}${path}`,
	}));

	try {
		const posts = await blogService.getLatestBlogPosts(1000);
		for (const post of posts) {
			const lastModified = new Date(post.updatedAt);
			entries.push({
				url: `${siteUrl}/blog/${encodeURIComponent(post.id)}`,
				...(Number.isNaN(lastModified.getTime()) ? {} : { lastModified }),
			});
		}
	} catch (error) {
		log.error("contentful.sitemap_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
	}

	return entries;
}
