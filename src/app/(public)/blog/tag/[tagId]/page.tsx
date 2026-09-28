import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blog, blogService } from "@/features/blog";

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
		console.error("Não foi possível gerar os metadados da etiqueta", error);
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
