import { unstable_rethrow } from "next/navigation";
import blogService from "@/features/blog/services/blog.service";
import { getSiteUrl } from "@/shared/lib/env";
import { log } from "@/shared/lib/log";
import { postShareCard, type ShareCardCopy, siteShareCard } from "./copy";

type PostImageParams = {
	postId?: string;
};

export async function readPostId(
	params: PostImageParams | Promise<PostImageParams> | undefined,
): Promise<string | undefined> {
	if (!params) return undefined;
	const resolved = await params;
	return resolved.postId;
}

/**
 * Same slug-then-id resolution as the article page.
 * A missing post, a blank title, or a Contentful failure becomes the site card.
 * Image routes must not redirect.
 */
export async function resolvePostShareCard(
	rawParam: string | undefined,
): Promise<ShareCardCopy> {
	const fallback = siteShareCard(getSiteUrl());
	const param = rawParam?.trim();
	if (!param) return fallback;

	try {
		const resolved = await blogService.resolveBlogPost(param);
		if (resolved.status === "not_found") return fallback;
		return postShareCard(resolved.post.title, getSiteUrl()) ?? fallback;
	} catch (error) {
		unstable_rethrow(error);
		log.error("og.post_image_failed", {
			message: error instanceof Error ? error.message : "unknown",
		});
		return fallback;
	}
}
