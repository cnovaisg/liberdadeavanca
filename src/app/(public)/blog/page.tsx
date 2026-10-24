import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { Blog, blogService } from "@/features/blog";
import { blogIndexMetadata } from "@/features/blog/metadata";
import { parseBlogPageParam } from "@/features/blog/pagination";
import { log } from "@/shared/lib/log";
import Spinner from "@/shared/ui/components/spinner/spinner";

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

const BlogPage = (props: BlogPageProps) => {
	return (
		<Suspense fallback={<Spinner />}>
			<BlogIndex {...props} />
		</Suspense>
	);
};

export default BlogPage;
