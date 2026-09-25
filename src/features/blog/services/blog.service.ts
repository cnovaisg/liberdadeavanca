import { resolveAuthors } from "@/shared/lib/contentful/authors";
import { fetchContentfulEntries } from "@/shared/lib/contentful/client";
import { parseRichTextField } from "@/shared/lib/contentful/rich-text";
import {
	buildTagMap,
	fetchPublicTags,
	resolveEntryTags,
} from "@/shared/lib/contentful/tags";
import type { BlogPostEntryType, PrunedBlogPostType } from "../types";
import {
	BLOG_CACHE_TAG,
	BLOG_REVALIDATE_SECONDS,
	blogPostCacheTag,
} from "./blog.cache";

class BlogService {
	private async getTagNamesById() {
		const tags = await fetchPublicTags({
			next: { revalidate: BLOG_REVALIDATE_SECONDS, tags: [BLOG_CACHE_TAG] },
		});
		return buildTagMap(tags);
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
			hashtags: resolveEntryTags(metadata?.tags, tagNamesById),
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

	async getLatestBlogPosts(
		numberOfPosts: number = 3,
	): Promise<PrunedBlogPostType[]> {
		const [data, tagNamesById] = await Promise.all([
			this.fetchEntries(numberOfPosts),
			this.getTagNamesById(),
		]);
		if (!data) return [];

		return data.items.map((post) =>
			this.pruneBlogPost({ ...post, includes: data.includes }, tagNamesById),
		);
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

		if (!data) return null;

		const post = data.items[0];
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
		if (!data) return [];

		return data.items.map((post) =>
			this.pruneBlogPost({ ...post, includes: data.includes }, tagNamesById),
		);
	}
}

const blogService = new BlogService();
export default blogService;
