import type { Metadata } from "next";
import { Suspense } from "react";
import { Blog, blogService } from "@/features/blog";
import Spinner from "@/shared/ui/components/spinner/spinner";

type BlogTagPageProps = {
	params: Promise<{ tagId: string }>;
};

export async function generateMetadata({
	params,
}: BlogTagPageProps): Promise<Metadata> {
	const { tagId } = await params;
	const { tag } = await blogService.getPostsByTag(tagId);

	if (!tag) {
		return { title: "Etiqueta" };
	}

	return {
		title: `${tag.name} — Blog`,
		description: `Artigos com a etiqueta ${tag.name}.`,
	};
}

const BlogTagList = async ({ tagId }: { tagId: string }) => {
	const { posts, tag } = await blogService.getPostsByTag(tagId);
	return <Blog posts={posts} tag={tag} filtered />;
};

const BlogTagPage = async ({ params }: BlogTagPageProps) => {
	const { tagId } = await params;

	return (
		<Suspense fallback={<Spinner />}>
			<BlogTagList tagId={tagId} />
		</Suspense>
	);
};

export default BlogTagPage;
