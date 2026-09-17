export const BLOG_CACHE_TAG = "blog"
export const BLOG_REVALIDATE_SECONDS = 60

export const blogPostCacheTag = (id: string) => `blog:${id}`
