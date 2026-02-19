export type BlogPostEntryType = {
  sys: {
    id: string
    createdAt: string
    updatedAt: string
    revision: number
  }
  fields: {
    title: string
    subtitle?: string
    date?: string
    blogPostContent: {
      nodeType: string
      data: Record<string, unknown>
      content: Array<{
        nodeType: string
        data: Record<string, unknown>
        content: Array<{ value: string; marks?: unknown[]; data?: unknown }>
      }>
    }
    authors?: Array<
      | { sys: { id: string; type?: string; linkType?: string } }
      | { name: string; role: string; imageUrl: string; contact?: string }
    >
  }
  includes?: {
    Entry?: Array<{
      sys: { id: string }
      fields: { name: string; role: string; imageUrl: string }
    }>
  }
}

export type PrunedBlogPostType = {
  title: string
  subtitle?: string
  createdAt: string      // original publication date (sys.createdAt)
  updatedAt: string      // last updated date (sys.updatedAt)
  revision: number       // sys.revision
  authors: Array<{ name: string; role: string; imageUrl: string }>
  value: Array<{ paragraph: string }>
}

class BlogService {
  private compositeBaseUrl: string
  private headers: HeadersInit

  constructor() {
    const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID
    const CONTENTFUL_API_BASE_URL = process.env.CONTENTFUL_API_BASE_URL
    const CONTENTFUL_API_ACCESS_TOKEN = process.env.CONTENTFUL_API_ACCESS_TOKEN

    if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_API_BASE_URL || !CONTENTFUL_API_ACCESS_TOKEN) {
      throw new Error("Missing Contentful environment variables")
    }

    this.compositeBaseUrl = `${CONTENTFUL_API_BASE_URL}/spaces/${CONTENTFUL_SPACE_ID}/environments/master`
    this.headers = {
      Authorization: `Bearer ${CONTENTFUL_API_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    }
  }

  private async fetchEntries(params: Record<string, string>): Promise<{ items: BlogPostEntryType[]; includes?: BlogPostEntryType["includes"] }> {
    const url = new URL(`${this.compositeBaseUrl}/entries`)
    Object.entries({ include: "2", ...params }).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )

    const response = await fetch(url.toString(), {
      headers: this.headers,
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      throw new Error(`Contentful API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<{ items: BlogPostEntryType[]; includes?: BlogPostEntryType["includes"] }>
  }

  private resolveAuthors(entry: BlogPostEntryType): Array<{ name: string; role: string; imageUrl: string }> {
    const linkedEntries = entry.includes?.Entry ?? []
    if (!entry.fields.authors) return []

    return entry.fields.authors
      .map((author) => {
        if ("sys" in author && author.sys?.type === "Link" && author.sys.linkType === "Entry") {
          const linked = linkedEntries.find((e) => e.sys.id === author.sys.id)
          return linked?.fields ?? null
        }
        if ("name" in author && "role" in author && "imageUrl" in author) return author
        return null
      })
      .filter((a): a is { name: string; role: string; imageUrl: string } => a !== null)
  }

  private pruneBlogPost(post: BlogPostEntryType | null): PrunedBlogPostType | null {
    if (!post) return null

    const { sys, fields, includes } = post
    const { createdAt, updatedAt, revision } = sys
    const { title, subtitle, blogPostContent } = fields

    const value: Array<{ paragraph: string }> =
      blogPostContent?.content
        ?.map((paragraph) =>
          paragraph.content
            .map((node) => node.value)
            .join("")
            .split(/\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p) => ({ paragraph: p }))
        )
        .flat() ?? []

    const authors = this.resolveAuthors({ ...post, includes })

    return { title, subtitle, createdAt, updatedAt, revision, authors, value }
  }

  async getLatestBlogPosts(numberOfPosts: number = 3): Promise<PrunedBlogPostType[]> {
    const data = await this.fetchEntries({
      content_type: "blogPost",
      order: "-sys.createdAt",
      limit: numberOfPosts.toString(),
      include: "2",
      locale: "en-US",
    })

    return data.items
      .map((post) => this.pruneBlogPost({ ...post, includes: data.includes }))
      .filter((p): p is PrunedBlogPostType => p !== null)
  }

  async getPostById(id: string): Promise<PrunedBlogPostType | null> {
    const url = `${this.compositeBaseUrl}/entries/${id}`
    const response = await fetch(url, { headers: this.headers })
    if (!response.ok) {
      throw new Error(`Contentful API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as BlogPostEntryType
    return this.pruneBlogPost(data)
  }

  async getAllBlogPosts(): Promise<PrunedBlogPostType[]> {
    const data = await this.fetchEntries({
      content_type: "blogPost",
      order: "-sys.createdAt",
      include: "2",
      locale: "en-US",
    })

    return data.items
      .map((post) => this.pruneBlogPost({ ...post, includes: data.includes }))
      .filter((p): p is PrunedBlogPostType => p !== null)
  }
}

const blogService = new BlogService()
export default blogService
