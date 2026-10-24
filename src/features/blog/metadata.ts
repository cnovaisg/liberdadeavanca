import type { Document } from "@contentful/rich-text-types";
import type { Metadata } from "next";
import { pageMetadata } from "@/shared/lib/seo";
import { blogPostDescription, canonicalBlogPath } from "./fields";
import { blogPageHref } from "./pagination";

type ArticleMetaSource = {
	id: string;
	slug?: string;
	title: string;
	subtitle?: string;
	summary?: string;
	publishedAt: string;
	updatedAt: string;
	value: Document | null;
};

export function articleMetadata(post: ArticleMetaSource): Metadata {
	return pageMetadata({
		title: post.title,
		description: blogPostDescription(post),
		canonicalPath: canonicalBlogPath(post),
		openGraphType: "article",
		publishedTime: post.publishedAt || undefined,
		modifiedTime: post.updatedAt || undefined,
	});
}

export function blogIndexMetadata(listing: {
	page: number;
	totalPages: number;
}): Metadata {
	const title = listing.page > 1 ? `Blog — página ${listing.page}` : "Blog";
	return pageMetadata({
		title,
		description: "Artigos do movimento Liberdade Avança.",
		canonicalPath: blogPageHref("/blog", listing.page),
		previous:
			listing.page > 1 ? blogPageHref("/blog", listing.page - 1) : undefined,
		next:
			listing.page < listing.totalPages
				? blogPageHref("/blog", listing.page + 1)
				: undefined,
	});
}

export function blogTagMetadata(input: {
	tagId: string;
	tagName?: string;
	page: number;
	totalPages: number;
}): Metadata {
	const basePath = `/blog/tag/${encodeURIComponent(input.tagId)}`;
	const title = input.tagName
		? input.page > 1
			? `${input.tagName} — página ${input.page}`
			: input.tagName
		: "Etiqueta";
	const description = input.tagName
		? `Artigos com a etiqueta ${input.tagName}.`
		: "Artigos por etiqueta.";

	return pageMetadata({
		title,
		description,
		canonicalPath: blogPageHref(basePath, input.page),
		previous:
			input.page > 1 ? blogPageHref(basePath, input.page - 1) : undefined,
		next:
			input.page < input.totalPages
				? blogPageHref(basePath, input.page + 1)
				: undefined,
	});
}
