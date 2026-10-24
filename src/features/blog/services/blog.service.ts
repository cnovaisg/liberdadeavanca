import { resolveAuthors } from "@/shared/lib/contentful/authors";
import {
	type ContentfulEntriesResponse,
	fetchContentfulEntries,
} from "@/shared/lib/contentful/client";
import { isContentfulId } from "@/shared/lib/contentful/ids";
import { getContentfulLocale } from "@/shared/lib/contentful/locale";
import { toRichTextDocument } from "@/shared/lib/contentful/rich-text";
import {
	buildTagMap,
	fetchPublicTags,
	resolveEntryTags,
} from "@/shared/lib/contentful/tags";
import {
	canonicalBlogPath,
	normalizeBlogSlug,
	normalizeBlogSummary,
	resolvePublishedAt,
} from "../fields";
import {
	BLOG_MAX_PAGE,
	BLOG_PAGE_SIZE,
	type BlogPageInfo,
	listingPageState,
} from "../pagination";
import type {
	BlogPostEntryType,
	BlogPostResolution,
	BlogPostTagLink,
	BlogTag,
	PrunedBlogPostType,
} from "../types";
import {
	BLOG_CACHE_TAG,
	BLOG_REVALIDATE_SECONDS,
	BLOG_TAGS_CACHE_TAG,
	blogPostCacheTag,
} from "./blog.cache";

const blogCache: NextFetchRequestConfig = {
	revalidate: BLOG_REVALIDATE_SECONDS,
	tags: [BLOG_CACHE_TAG, BLOG_TAGS_CACHE_TAG],
};

export type BlogListing = BlogPageInfo & {
	posts: PrunedBlogPostType[];
};

export type BlogTagListing = BlogListing & {
	tag: BlogTag | null;
	/** Catalog request failed; the listing is still safe to show. */
	tagsUnavailable?: boolean;
	outOfRange: boolean;
};

const isRequestedPage = (page: number) =>
	Number.isInteger(page) && page >= 1 && page <= BLOG_MAX_PAGE;

class BlogService {
	/**
	 * `null` when the tag catalog request failed. Callers still render posts,
	 * just without etiquetas.
	 */
	private async getTagNamesById(): Promise<Map<string, string> | null> {
		const tags = await fetchPublicTags({ next: blogCache });
		if (tags === null) return null;
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
		const slug = normalizeBlogSlug(fields.slug);
		const summary = normalizeBlogSummary(fields.summary);

		return {
			id: sys.id,
			...(slug ? { slug } : {}),
			title: fields.title,
			subtitle: fields.subtitle,
			...(summary ? { summary } : {}),
			publishedAt: resolvePublishedAt({
				date: fields.date,
				firstPublishedAt: sys.firstPublishedAt,
				createdAt: sys.createdAt,
			}),
			createdAt: sys.createdAt,
			updatedAt: sys.updatedAt,
			revision: sys.revision,
			authors: resolveAuthors(fields.authors, includes),
			tags: this.resolveTags(metadata?.tags, tagNamesById),
			value: toRichTextDocument(fields.blogPostContent),
		};
	}

	private async fetchEntries(options?: {
		limit?: number;
		skip?: number;
		tagId?: string;
	}) {
		return fetchContentfulEntries<BlogPostEntryType>({
			contentType: "blogPost",
			searchParams: {
				locale: getContentfulLocale(),
				include: "2",
				order: "-sys.createdAt",
				...(options?.limit !== undefined
					? { limit: String(options.limit) }
					: {}),
				...(options?.skip ? { skip: String(options.skip) } : {}),
				...(options?.tagId
					? { "metadata.tags.sys.id[in]": options.tagId }
					: {}),
			},
			next: blogCache,
		});
	}

	private mapPosts(
		data: ContentfulEntriesResponse<BlogPostEntryType> | null,
		tagNamesById: Map<string, string>,
	): PrunedBlogPostType[] {
		if (!data) return [];

		return data.items.map((post) =>
			this.pruneBlogPost({ ...post, includes: data.includes }, tagNamesById),
		);
	}

	private listingTotal(
		data: ContentfulEntriesResponse<BlogPostEntryType> | null,
		skip: number,
	): number {
		if (!data) return 0;
		if (typeof data.total === "number") return data.total;
		return data.items.length + skip;
	}

	private async fetchPost(
		filter: Record<string, string>,
		tags: string[],
	): Promise<PrunedBlogPostType | null> {
		const [data, tagNamesById] = await Promise.all([
			fetchContentfulEntries<BlogPostEntryType>({
				contentType: "blogPost",
				searchParams: {
					...filter,
					locale: getContentfulLocale(),
					include: "2",
					limit: "1",
				},
				next: {
					revalidate: BLOG_REVALIDATE_SECONDS,
					tags,
				},
			}),
			this.getTagNamesById(),
		]);

		const post = data?.items[0];
		if (!post) return null;

		return this.pruneBlogPost(
			{ ...post, includes: data.includes },
			tagNamesById ?? new Map(),
		);
	}

	async getLatestBlogPosts(
		numberOfPosts: number = 3,
	): Promise<PrunedBlogPostType[]> {
		const [data, tagNamesById] = await Promise.all([
			this.fetchEntries({ limit: numberOfPosts }),
			this.getTagNamesById(),
		]);

		return this.mapPosts(data, tagNamesById ?? new Map());
	}

	/**
	 * One page of the public listing. `null` when `page` is outside
	 * `1..totalPages` (or not a positive integer). Page 1 of an empty blog is
	 * an empty listing, not an error.
	 */
	async getBlogPage(page: number): Promise<BlogListing | null> {
		if (!isRequestedPage(page)) return null;

		const skip = (page - 1) * BLOG_PAGE_SIZE;
		const [data, tagNamesById] = await Promise.all([
			this.fetchEntries({ limit: BLOG_PAGE_SIZE, skip }),
			this.getTagNamesById(),
		]);

		const total = this.listingTotal(data, skip);
		const state = listingPageState(total, page);
		if (state.status === "out_of_range") return null;

		return {
			posts: this.mapPosts(data, tagNamesById ?? new Map()),
			page,
			pageSize: BLOG_PAGE_SIZE,
			total,
			totalPages: state.totalPages,
		};
	}

	async getPostById(id: string): Promise<PrunedBlogPostType | null> {
		const normalized = id.trim();
		if (!isContentfulId(normalized)) {
			return null;
		}

		return this.fetchPost({ "sys.id": normalized }, [
			BLOG_CACHE_TAG,
			blogPostCacheTag(normalized),
		]);
	}

	private async getPostBySlug(
		slug: string,
	): Promise<PrunedBlogPostType | null> {
		const normalized = normalizeBlogSlug(slug);
		if (!normalized) return null;

		// Tagged with the blog list so a publish clears it even when the
		// webhook only knows the entry id. The slug itself is not a stable
		// cache key across renames.
		return this.fetchPost({ "fields.slug": normalized }, [BLOG_CACHE_TAG]);
	}

	/**
	 * Resolves `/blog/<param>`.
	 *
	 * A kebab-case slug is also a valid Contentful id, so the slug query runs
	 * first. The id query runs only on a miss, and a hit that already has a
	 * slug redirects to that canonical path.
	 */
	async resolveBlogPost(rawParam: string): Promise<BlogPostResolution> {
		const param = normalizeRouteParam(rawParam);
		if (!param) return { status: "not_found" };

		const slug = normalizeBlogSlug(param);
		if (slug) {
			const bySlug = await this.getPostBySlug(slug);
			if (bySlug) return { status: "ok", post: bySlug };
		}

		if (!isContentfulId(param)) return { status: "not_found" };

		const byId = await this.getPostById(param);
		if (!byId) return { status: "not_found" };

		const canonical = canonicalBlogPath(byId);
		if (canonical !== `/blog/${encodeURIComponent(param)}`) {
			return { status: "redirect", to: canonical, post: byId };
		}

		return { status: "ok", post: byId };
	}

	/**
	 * Posts that carry the public tag `tagId`, plus the resolved tag when the
	 * id exists in the Delivery API tag catalog.
	 * Invalid ids skip the entries query and return an empty list.
	 * `outOfRange` is true when `page` is past the last page.
	 */
	async getPostsByTag(tagId: string, page = 1): Promise<BlogTagListing> {
		const normalized = tagId.trim();
		const empty = (outOfRange: boolean): BlogTagListing => ({
			posts: [],
			tag: null,
			page: outOfRange ? page : 1,
			pageSize: BLOG_PAGE_SIZE,
			total: 0,
			totalPages: 1,
			outOfRange,
		});

		if (!isRequestedPage(page)) return empty(true);
		if (!isContentfulId(normalized)) return empty(page > 1);

		const skip = (page - 1) * BLOG_PAGE_SIZE;
		const [data, tagNamesById] = await Promise.all([
			this.fetchEntries({
				limit: BLOG_PAGE_SIZE,
				skip,
				tagId: normalized,
			}),
			this.getTagNamesById(),
		]);

		const total = this.listingTotal(data, skip);
		const state = listingPageState(total, page);
		const names = tagNamesById ?? new Map();
		const name = tagNamesById?.get(normalized);

		return {
			posts: state.status === "ok" ? this.mapPosts(data, names) : [],
			tag: name ? { id: normalized, name } : null,
			...(tagNamesById === null ? { tagsUnavailable: true as const } : {}),
			page,
			pageSize: BLOG_PAGE_SIZE,
			total,
			totalPages: state.totalPages,
			outOfRange: state.status === "out_of_range",
		};
	}
}

function normalizeRouteParam(raw: string): string | null {
	let param = raw;
	try {
		param = decodeURIComponent(raw);
	} catch {
		return null;
	}

	const trimmed = param.trim();
	if (!trimmed || trimmed.length > 200) return null;
	return trimmed;
}

const blogService = new BlogService();
export default blogService;
