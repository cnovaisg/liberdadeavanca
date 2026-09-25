import { resolveAuthors } from "@/shared/lib/contentful/authors";
import {
	fetchContentfulEntries,
	fetchContentfulTags,
} from "@/shared/lib/contentful/client";
import { parseRichTextField } from "@/shared/lib/contentful/rich-text";
import type { ContentfulTagLink } from "@/shared/lib/contentful/types";
import type { BlogPostEntryType, BlogTag, PrunedBlogPostType } from "../types";
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
	private async fetchTagCatalog(): Promise<Map<string, string>> {
		const tags = await fetchContentfulTags({ next: blogCache });
		const catalog = new Map<string, string>();

		for (const tag of tags ?? []) {
			const id = tag.sys?.id?.trim();
			const name = tag.name?.trim();
			if (!id || !name) continue;
			catalog.set(id, name);
		}

		return catalog;
	}

	/** Resolves public tag links to display names. Unresolved ids are omitted. */
	private resolveTags(
		links: ContentfulTagLink[] | undefined,
		catalog: Map<string, string>,
	): BlogTag[] {
		if (!links?.length) return [];

		const seen = new Set<string>();
		const resolved: BlogTag[] = [];

		for (const link of links) {
			if (link?.sys?.linkType && link.sys.linkType !== "Tag") continue;
			const id = link?.sys?.id?.trim();
			if (!id || seen.has(id)) continue;
			const name = catalog.get(id);
			if (!name) continue;
			seen.add(id);
			resolved.push({ id, name });
		}

		return resolved;
	}

	private pruneBlogPost(
		post: BlogPostEntryType,
		catalog: Map<string, string>,
	): PrunedBlogPostType {
		const { sys, fields, includes } = post;

		return {
			id: sys.id,
			title: fields.title,
			subtitle: fields.subtitle,
			createdAt: sys.createdAt,
			updatedAt: sys.updatedAt,
			revision: sys.revision,
			authors: resolveAuthors(fields.authors, includes),
			tags: this.resolveTags(post.metadata?.tags, catalog),
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
		catalog: Map<string, string>,
	): PrunedBlogPostType[] {
		if (!data) return [];

		return data.items.map((post) =>
			this.pruneBlogPost({ ...post, includes: data.includes }, catalog),
		);
	}

	async getLatestBlogPosts(
		numberOfPosts: number = 3,
	): Promise<PrunedBlogPostType[]> {
		const [data, catalog] = await Promise.all([
			this.fetchEntries(numberOfPosts),
			this.fetchTagCatalog(),
		]);

		return this.mapPosts(data, catalog);
	}

	async getPostById(id: string): Promise<PrunedBlogPostType | null> {
		const [data, catalog] = await Promise.all([
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
			this.fetchTagCatalog(),
		]);

		const post = data?.items[0];
		if (!post) return null;

		return this.pruneBlogPost({ ...post, includes: data?.includes }, catalog);
	}

	async getAllBlogPosts(): Promise<PrunedBlogPostType[]> {
		const [data, catalog] = await Promise.all([
			this.fetchEntries(),
			this.fetchTagCatalog(),
		]);

		return this.mapPosts(data, catalog);
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

		const [data, catalog] = await Promise.all([
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
			this.fetchTagCatalog(),
		]);

		const name = catalog.get(normalized);

		return {
			tag: name ? { id: normalized, name } : null,
			posts: this.mapPosts(data, catalog),
		};
	}
}

const blogService = new BlogService();
export default blogService;
