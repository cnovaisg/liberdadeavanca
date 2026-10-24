import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blog, blogService } from "@/features/blog";
import { log } from "@/shared/lib/log";

type BlogTagPageProps = {
	params: Promise<{ tagId: string }>;
};

export async function generateMetadata({
	params,
}: BlogTagPageProps): Promise<Metadata> {
	try {
		const { tagId } = await params;
		const { tag } = await blogService.getPostsByTag(tagId);

		if (!tag) {
			return { title: "Etiqueta" };
		}

		return {
			title: `${tag.name} — Blog`,
			description: `Artigos com a etiqueta ${tag.name}.`,
		};
	} catch (error) {
		log.error("blog.tag_metadata_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
		return { title: "Etiqueta" };
	}
}

const BlogTagPage = async ({ params }: BlogTagPageProps) => {
	const { tagId } = await params;
	const { posts, tag, tagsUnavailable } =
		await blogService.getPostsByTag(tagId);

	if (!tag && !tagsUnavailable) {
		notFound();
	}

	return <Blog posts={posts} tag={tag} filtered />;
};

export default BlogTagPage;
