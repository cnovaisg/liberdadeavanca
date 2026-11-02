import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { Blog, blogService } from "@/features/blog";
import { blogIndexMetadata } from "@/features/blog/metadata";
import { parseBlogPageParam } from "@/features/blog/pagination";
import { log } from "@/shared/lib/log";

type BlogPageProps = {
	searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({
	searchParams,
}: BlogPageProps): Promise<Metadata> {
	const page = parseBlogPageParam((await searchParams).page);
	if (page === null) return { title: "Página não encontrada" };

	try {
		const listing = await blogService.getBlogPage(page);
		if (!listing) return { title: "Página não encontrada" };

		return blogIndexMetadata(listing);
	} catch (error) {
		unstable_rethrow(error);
		log.error("blog.index_metadata_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
		return { title: "Blog" };
	}
}

/**
 * This is the page itself. `notFound()` inside `<Suspense>` streams a 200
 * and only then paints the not-found UI (`/blog?page=2` was that soft 404).
 * Invalid values (`0`, `foo`) and pages past the last one both 404, same as
 * `/blog/tag/[tagId]`.
 */
export async function BlogIndex({ searchParams }: BlogPageProps) {
	const page = parseBlogPageParam((await searchParams).page);
	if (page === null) notFound();

	const listing = await blogService.getBlogPage(page);
	if (!listing) notFound();

	return (
		<Blog
			posts={listing.posts}
			pagination={{
				page: listing.page,
				totalPages: listing.totalPages,
				basePath: "/blog",
			}}
		/>
	);
}

export default BlogIndex;
