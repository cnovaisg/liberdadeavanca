export const BLOG_CACHE_TAG = "blog";
/** Tag catalog (`/tags`). Separate from `blog:${entryId}` so it cannot collide with an entry id. */
export const BLOG_TAGS_CACHE_TAG = "blog-tags";
export const BLOG_REVALIDATE_SECONDS = 60;

export const blogPostCacheTag = (id: string) => `blog:${id}`;
