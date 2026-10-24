import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { Blog, blogService } from "@/features/blog";
import { blogTagMetadata } from "@/features/blog/metadata";
import { parseBlogPageParam } from "@/features/blog/pagination";
import { log } from "@/shared/lib/log";

type BlogTagPageProps = {
	params: Promise<{ tagId: string }>;
	searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({
	params,
	searchParams,
}: BlogTagPageProps): Promise<Metadata> {
	const [{ tagId }, query] = await Promise.all([params, searchParams]);
	const page = parseBlogPageParam(query.page);
	if (page === null) return { title: "Página não encontrada" };

	try {
		const listing = await blogService.getPostsByTag(tagId, page);
		if (listing.outOfRange) return { title: "Página não encontrada" };
		if (!listing.tag && !listing.tagsUnavailable) {
			return { title: "Etiqueta" };
		}

		return blogTagMetadata({
			tagId,
			tagName: listing.tag?.name,
			page: listing.page,
			totalPages: listing.totalPages,
		});
	} catch (error) {
		unstable_rethrow(error);
		log.error("blog.tag_metadata_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
		return { title: "Etiqueta" };
	}
}

const BlogTagPage = async ({ params, searchParams }: BlogTagPageProps) => {
	const [{ tagId }, query] = await Promise.all([params, searchParams]);
	const page = parseBlogPageParam(query.page);
	if (page === null) notFound();

	const listing = await blogService.getPostsByTag(tagId, page);
	if (listing.outOfRange) notFound();
	if (!listing.tag && !listing.tagsUnavailable) notFound();

	return (
		<Blog
			posts={listing.posts}
			tag={listing.tag}
			filtered
			pagination={{
				page: listing.page,
				totalPages: listing.totalPages,
				basePath: `/blog/tag/${encodeURIComponent(tagId)}`,
			}}
		/>
	);
};

export default BlogTagPage;
