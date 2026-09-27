import {
	CONTENTFUL_ID_PATTERN,
	isContentfulId,
} from "@/shared/lib/contentful/ids";

export const BLOG_CACHE_TAG = "blog";
/** Tag catalog (`/tags`). Separate from `blog:${entryId}` so it cannot collide with an entry id. */
export const BLOG_TAGS_CACHE_TAG = "blog-tags";
export const BLOG_REVALIDATE_SECONDS = 60;

export const blogPostCacheTag = (id: string) => `blog:${id}`;

/** Contentful tag / entry ids share the same sys.id shape. */
export const BLOG_TAG_ID_PATTERN = CONTENTFUL_ID_PATTERN;

export const isBlogTagId = isContentfulId;
export const isBlogPostId = isContentfulId;
