import { resolveAuthors } from "@/shared/lib/contentful/authors";
import { fetchContentfulEntries } from "@/shared/lib/contentful/client";
import { parseRichTextField } from "@/shared/lib/contentful/rich-text";
import type { BlogPostEntryType, PrunedBlogPostType } from "../types";
import {
	BLOG_CACHE_TAG,
	BLOG_REVALIDATE_SECONDS,
	blogPostCacheTag,
} from "./blog.cache";

class BlogService {
	private pruneBlogPost(post: BlogPostEntryType): PrunedBlogPostType {
		const { sys, fields, includes } = post;

		return {
			id: sys.id,
			title: fields.title,
			subtitle: fields.subtitle,
			createdAt: sys.createdAt,
			updatedAt: sys.updatedAt,
			revision: sys.revision,
			authors: resolveAuthors(fields.authors, includes),
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
		const data = await this.fetchEntries(numberOfPosts);
		if (!data) return [];

		return data.items.map((post) =>
			this.pruneBlogPost({ ...post, includes: data.includes }),
		);
	}

	async getPostById(id: string): Promise<PrunedBlogPostType | null> {
		const data = await fetchContentfulEntries<BlogPostEntryType>({
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
		});

		if (!data) return null;

		const post = data.items[0];
		if (!post) return null;

		return this.pruneBlogPost({ ...post, includes: data.includes });
	}

	async getAllBlogPosts(): Promise<PrunedBlogPostType[]> {
		const data = await this.fetchEntries();
		if (!data) return [];

		return data.items.map((post) =>
			this.pruneBlogPost({ ...post, includes: data.includes }),
		);
	}
}

const blogService = new BlogService();
export default blogService;
