import type { Metadata } from "next";
import { Suspense } from "react";
import blogService from "@/features/blog/services/blog.service";
import Blog from "@/features/blog/ui/blog.page";
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

const BlogTagPage = async ({ params }: BlogTagPageProps) => {
	const { tagId } = await params;

	return (
		<Suspense fallback={<Spinner />}>
			<Blog tagId={tagId} />
		</Suspense>
	);
};

export default BlogTagPage;
