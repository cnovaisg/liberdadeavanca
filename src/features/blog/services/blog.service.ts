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
        content: Array<{ value: string }>
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
  createdAt: string
  updatedAt: string
  revision: number
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

  private async fetchEntries(limit?: number): Promise<{ items: BlogPostEntryType[]; includes?: BlogPostEntryType["includes"] }> {
    const url = new URL(`${this.compositeBaseUrl}/entries`)
    url.searchParams.append("content_type", "blogPost")
    url.searchParams.append("locale", "en-US")
    url.searchParams.append("include", "2")
    url.searchParams.append("order", "-sys.createdAt")
    if (limit) url.searchParams.append("limit", limit.toString())

    const response = await fetch(url.toString(), { headers: this.headers, next: { revalidate: 60 } })
    if (!response.ok) {
      throw new Error(`Contentful API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<{ items: BlogPostEntryType[]; includes?: BlogPostEntryType["includes"] }>
  }

  private resolveAuthors(entry: BlogPostEntryType): Array<{ name: string; role: string; imageUrl: string }> {
    const entries = entry.includes?.Entry ?? []
    if (!entry.fields.authors) return []

    return entry.fields.authors
      .map((author) => {
        if ("sys" in author && author.sys?.type === "Link" && author.sys.linkType === "Entry") {
          const authorEntry = entries.find((entry) => entry.sys.id === author.sys.id)
          return authorEntry?.fields ?? null
        }
        if ("name" in author && "role" in author && "imageUrl" in author) return author
        return null
      })
      .filter((author): author is { name: string; role: string; imageUrl: string } => author !== null)
  }

  private pruneBlogPost(post: BlogPostEntryType): PrunedBlogPostType {
    const { sys, fields, includes } = post
    const value: Array<{ paragraph: string }> =
      fields.blogPostContent.content
        .map((paragraph) =>
          paragraph.content
            .map((node) => node.value)
            .join("")
            .split(/\n+/)
            .map((currentParagraph) => currentParagraph.trim())
            .filter(Boolean)
            .map((currentParagraph) => ({ paragraph: currentParagraph }))
        )
        .flat()

    const authors = this.resolveAuthors({ ...post, includes })

    return {
      title: fields.title,
      subtitle: fields.subtitle,
      createdAt: sys.createdAt,
      updatedAt: sys.updatedAt,
      revision: sys.revision,
      authors,
      value,
    }
  }

  async getLatestBlogPosts(numberOfPosts: number = 3): Promise<PrunedBlogPostType[]> {
    const data = await this.fetchEntries(numberOfPosts)
    return data.items.map((post) => this.pruneBlogPost({ ...post, includes: data.includes }))
  }

  async getPostById(id: string): Promise<PrunedBlogPostType | null> {
    const url = `${this.compositeBaseUrl}/entries/${id}`
    const response = await fetch(url, { headers: this.headers })
    if (!response.ok) throw new Error(`Contentful API error: ${response.status} ${response.statusText}`)

    const data = (await response.json()) as BlogPostEntryType
    return this.pruneBlogPost(data)
  }

  async getAllBlogPosts(): Promise<PrunedBlogPostType[]> {
    const data = await this.fetchEntries()
    return data.items.map((post) => this.pruneBlogPost({ ...post, includes: data.includes }))
  }
}

const blogService = new BlogService()
export default blogService
