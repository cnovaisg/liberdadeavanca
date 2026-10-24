import type { Metadata } from "next";
import { notFound, permanentRedirect, unstable_rethrow } from "next/navigation";
import { BlogPost, blogService } from "@/features/blog";
import { articleMetadata } from "@/features/blog/metadata";
import { log } from "@/shared/lib/log";

type BlogPageProps = {
	params: Promise<{ postId: string }>;
};

export async function generateMetadata({
	params,
}: BlogPageProps): Promise<Metadata> {
	try {
		const { postId } = await params;
		const resolved = await blogService.resolveBlogPost(postId);

		if (resolved.status === "not_found") {
			return { title: "Artigo não encontrado" };
		}

		return articleMetadata(resolved.post);
	} catch (error) {
		unstable_rethrow(error);
		log.error("blog.post_metadata_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
		return { title: "Artigo" };
	}
}

const IndividualBlogPage = async ({ params }: BlogPageProps) => {
	const { postId } = await params;
	const resolved = await blogService.resolveBlogPost(postId);

	if (resolved.status === "not_found") {
		notFound();
	}

	// Next.js `permanentRedirect` responds with 308.
	if (resolved.status === "redirect") {
		permanentRedirect(resolved.to);
	}

	return <BlogPost post={resolved.post} />;
};

export default IndividualBlogPage;
