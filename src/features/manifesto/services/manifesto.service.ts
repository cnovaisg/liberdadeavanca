// manifesto.service.ts

export type ManifestoEntryType = {
  metadata: { tags: unknown[]; concepts: unknown[] }
  sys: {
    id: string
    createdAt: string
    updatedAt: string
    locale: string
    publishedVersion: number
    revision: number
    contentType: { sys: { type: "Link"; linkType: "ContentType"; id: "manifesto" } }
  }
  fields: {
    title: string
    subtitle?: string
    version?: number
    date?: string
    manifestoContent: {
      nodeType: "document"
      data: Record<string, unknown>
      content: Array<{
        nodeType: "paragraph"
        data: Record<string, unknown>
        content: Array<{
          nodeType: "text"
          value: string
          marks: Array<{ type: string }>
          data: Record<string, unknown>
        }>
      }>
    }
    authors?: Array<
      | { sys: { id: string; type?: string; linkType?: string } }
      | { name: string; role: string; imageUrl: string }
    >
  }
  includes?: {
    Entry?: Array<{
      sys: { id: string }
      fields: { name: string; role: string; imageUrl: string }
    }>
  }
}

export type PrunedManifestoEntryType = {
  createdAt: string
  updatedAt: string
  revision: number
  title: string
  subtitle?: string
  value: Array<{ paragraph: string }>
  authors: Array<{ name: string; role: string; imageUrl: string }>
}

class ManifestoService {
  private baseUrl: string
  private headers: HeadersInit

  constructor() {
    const SPACE_ID = process.env.CONTENTFUL_SPACE_ID
    const API_BASE = process.env.CONTENTFUL_API_BASE_URL
    const TOKEN = process.env.CONTENTFUL_API_ACCESS_TOKEN

    if (!SPACE_ID || !API_BASE || !TOKEN) {
      throw new Error("Missing Contentful environment variables")
    }

    this.baseUrl = `${API_BASE}/spaces/${SPACE_ID}/environments/master`
    this.headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }
  }

  private async fetchEntries(params: Record<string, string>) {
    const url = new URL(`${this.baseUrl}/entries`)
    Object.entries({ include: "2", ...params }).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    )

    const response = await fetch(url.toString(), {
      headers: this.headers,
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      throw new Error(`Contentful API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private resolveAuthors(entry: ManifestoEntryType) {
    const entries = entry.includes?.Entry ?? []
    if (!entry.fields?.authors) return []

    const resolved = entry.fields.authors
      .map((author) => {
        if ("sys" in author && author.sys?.type === "Link" && author.sys.linkType === "Entry") {
          const authorEntry = entries.find((e) => e.sys.id === author.sys.id)
          return authorEntry?.fields ?? null
        }
        if ("name" in author && "role" in author && "imageUrl" in author) return author
        return null
      })
      .filter(Boolean) as Array<{ name: string; role: string; imageUrl: string }>

    return resolved
  }

  private pruneManifesto(manifesto: ManifestoEntryType | null): PrunedManifestoEntryType | null {
    if (!manifesto) return null

    const { createdAt, updatedAt, revision } = manifesto.sys
    const { title, subtitle } = manifesto.fields

  const value: Array<{ paragraph: string }> =
  manifesto.fields.manifestoContent?.content
    ?.map(paragraph =>
      paragraph.content
        .map(node => node.value)
        .join("")
        .split(/\n+/)
        .map(p => p.trim().replace(/\\"/g, '"'))
        .filter(Boolean)
        .map(p => ({ paragraph: p }))
    )
    .flat() || []



    const authors = this.resolveAuthors(manifesto)

    return { createdAt, updatedAt, revision, title, subtitle, value, authors }
  }

  async getManifesto(): Promise<PrunedManifestoEntryType | null> {
    const data = await this.fetchEntries({ content_type: "manifesto", limit: "1" })
    const manifestoItem = data.items?.[0] ?? null
    return this.pruneManifesto({ ...data, ...manifestoItem })
  }
}

const manifestoService = new ManifestoService()
export default manifestoService
