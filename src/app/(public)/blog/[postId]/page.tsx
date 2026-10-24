import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPost, blogService } from "@/features/blog";
import { log } from "@/shared/lib/log";

type BlogPageProps = {
	params: Promise<{ postId: string }>;
};

export async function generateMetadata({
	params,
}: BlogPageProps): Promise<Metadata> {
	try {
		const { postId } = await params;
		const post = await blogService.getPostById(postId);

		if (!post) {
			return { title: "Artigo não encontrado" };
		}

		return {
			title: post.title,
			description: post.subtitle,
		};
	} catch (error) {
		log.error("blog.post_metadata_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
		return { title: "Artigo" };
	}
}

const IndividualBlogPage = async ({ params }: BlogPageProps) => {
	const { postId } = await params;
	const post = await blogService.getPostById(postId);

	if (!post) {
		notFound();
	}

	return <BlogPost post={post} />;
};

export default IndividualBlogPage;
