import { resolveAuthors } from "@/shared/lib/contentful/authors";
import { fetchContentfulEntries } from "@/shared/lib/contentful/client";
import { parseRichTextField } from "@/shared/lib/contentful/rich-text";
import {
	buildTagMap,
	fetchPublicTags,
	resolveEntryTags,
} from "@/shared/lib/contentful/tags";
import type {
	BlogPostEntryType,
	BlogPostTagLink,
	BlogTag,
	PrunedBlogPostType,
} from "../types";
import {
	BLOG_CACHE_TAG,
	BLOG_REVALIDATE_SECONDS,
	BLOG_TAGS_CACHE_TAG,
	blogPostCacheTag,
	isBlogTagId,
} from "./blog.cache";

const blogCache: NextFetchRequestConfig = {
	revalidate: BLOG_REVALIDATE_SECONDS,
	tags: [BLOG_CACHE_TAG, BLOG_TAGS_CACHE_TAG],
};

class BlogService {
	private async getTagNamesById() {
		const tags = await fetchPublicTags({ next: blogCache });
		return buildTagMap(tags);
	}

	/** Drops links whose public name is missing, so raw ids are not shown. */
	private resolveTags(
		links: BlogPostTagLink[] | undefined,
		tagNamesById: Map<string, string>,
	): BlogTag[] {
		return resolveEntryTags(links, tagNamesById).filter((tag) =>
			tagNamesById.has(tag.id),
		);
	}

	private pruneBlogPost(
		post: BlogPostEntryType,
		tagNamesById: Map<string, string>,
	): PrunedBlogPostType {
		const { sys, fields, includes, metadata } = post;

		return {
			id: sys.id,
			title: fields.title,
			subtitle: fields.subtitle,
			createdAt: sys.createdAt,
			updatedAt: sys.updatedAt,
			revision: sys.revision,
			authors: resolveAuthors(fields.authors, includes),
			tags: this.resolveTags(metadata?.tags, tagNamesById),
			value: parseRichTextField(fields.blogPostContent),
		};
	}

	private async fetchEntries(limit?: number) {
		return fetchContentfulEntries<BlogPostEntryType>({
			contentType: "blogPost",
			searchParams: {
				locale: "en-US",
				include: "2",
				order: "-sys.createdAt",
				...(limit ? { limit: limit.toString() } : {}),
			},
			next: { revalidate: BLOG_REVALIDATE_SECONDS, tags: [BLOG_CACHE_TAG] },
		});
	}

	private mapPosts(
		data: {
			items: BlogPostEntryType[];
			includes?: BlogPostEntryType["includes"];
		} | null,
		tagNamesById: Map<string, string>,
	): PrunedBlogPostType[] {
		if (!data) return [];

		return data.items.map((post) =>
			this.pruneBlogPost({ ...post, includes: data.includes }, tagNamesById),
		);
	}

	async getLatestBlogPosts(
		numberOfPosts: number = 3,
	): Promise<PrunedBlogPostType[]> {
		const [data, tagNamesById] = await Promise.all([
			this.fetchEntries(numberOfPosts),
			this.getTagNamesById(),
		]);

		return this.mapPosts(data, tagNamesById);
	}

	async getPostById(id: string): Promise<PrunedBlogPostType | null> {
		const [data, tagNamesById] = await Promise.all([
			fetchContentfulEntries<BlogPostEntryType>({
				contentType: "blogPost",
				searchParams: {
					"sys.id": id,
					locale: "en-US",
					include: "2",
					limit: "1",
				},
				next: {
					revalidate: BLOG_REVALIDATE_SECONDS,
					tags: [BLOG_CACHE_TAG, blogPostCacheTag(id)],
				},
			}),
			this.getTagNamesById(),
		]);

		const post = data?.items[0];
		if (!post) return null;

		return this.pruneBlogPost(
			{ ...post, includes: data.includes },
			tagNamesById,
		);
	}

	async getAllBlogPosts(): Promise<PrunedBlogPostType[]> {
		const [data, tagNamesById] = await Promise.all([
			this.fetchEntries(),
			this.getTagNamesById(),
		]);

		return this.mapPosts(data, tagNamesById);
	}

	/**
	 * Posts that carry the public tag `tagId`, plus the resolved tag when the
	 * id exists in the Delivery API tag catalog.
	 * Invalid ids skip the entries query and return an empty list.
	 */
	async getPostsByTag(
		tagId: string,
	): Promise<{ posts: PrunedBlogPostType[]; tag: BlogTag | null }> {
		const normalized = tagId.trim();
		if (!isBlogTagId(normalized)) {
			return { posts: [], tag: null };
		}

		const [data, tagNamesById] = await Promise.all([
			fetchContentfulEntries<BlogPostEntryType>({
				contentType: "blogPost",
				searchParams: {
					locale: "en-US",
					include: "2",
					order: "-sys.createdAt",
					limit: "100",
					"metadata.tags.sys.id[in]": normalized,
				},
				next: blogCache,
			}),
			this.getTagNamesById(),
		]);

		const name = tagNamesById.get(normalized);

		return {
			tag: name ? { id: normalized, name } : null,
			posts: this.mapPosts(data, tagNamesById),
		};
	}
}

const blogService = new BlogService();
export default blogService;
