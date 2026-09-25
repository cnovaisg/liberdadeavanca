export const BLOG_CACHE_TAG = "blog";
/** Tag catalog (`/tags`). Separate from `blog:${entryId}` so it cannot collide with an entry id. */
export const BLOG_TAGS_CACHE_TAG = "blog-tags";
export const BLOG_REVALIDATE_SECONDS = 60;

export const blogPostCacheTag = (id: string) => `blog:${id}`;

/** Contentful tag ids: letters, numbers, `_` and `-`, up to 64 characters. */
export const BLOG_TAG_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const isBlogTagId = (value: string) => BLOG_TAG_ID_PATTERN.test(value);
