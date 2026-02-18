export type ManifestoEntryType = {
  sys: {
    id: string
    createdAt: string
    updatedAt: string
    revision: number
  }
  fields: {
    title: string
    subtitle?: string
    manifestoContent: {
      content: Array<{
        content: Array<{ value: string }>
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

const THIRTY_DAYS = 60 * 60 * 24 * 30
const MANIFESTO_TTL = THIRTY_DAYS

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

  private resolveAuthors(entry: ManifestoEntryType) {
    const linkedEntries = entry.includes?.Entry ?? []
    if (!entry.fields?.authors) return []

    const authors = entry.fields.authors
      .map((author) => {
        if ("sys" in author && author.sys?.type === "Link" && author.sys.linkType === "Entry") {
          const linked = linkedEntries.find((e) => e.sys.id === author.sys.id)
          return linked?.fields ?? null
        }
        if ("name" in author && "role" in author && "imageUrl" in author) return author
        return null
      })
      .filter(Boolean) as Array<{ name: string; role: string; imageUrl: string }>

    return authors
  }

  private pruneManifesto(
    manifesto: ManifestoEntryType | null
  ) {
    if (!manifesto) return null

    const { createdAt, updatedAt, revision } = manifesto.sys
    const { title, subtitle } = manifesto.fields

    const value =
      manifesto.fields.manifestoContent?.content
        ?.map((paragraph) =>
          paragraph.content
            .map((node) => node.value)
            .join("")
            .split(/\n+/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((currentParagraph) => ({ paragraph: currentParagraph }))
        )
        .flat() || []


        const authors = this.resolveAuthors(manifesto)
        return { createdAt, updatedAt, revision, title, subtitle, value, authors }
      }

  async getManifesto(): Promise<PrunedManifestoEntryType | null> {
    const url = `${this.baseUrl}/entries?content_type=manifesto&limit=1&include=2`
    const response = await fetch(url, { headers: this.headers, next: { revalidate: MANIFESTO_TTL } })
    if (!response.ok) throw new Error(`Contentful API error: ${response.status} ${response.statusText}`)
    const data = await response.json()

    const manifesto = data.items?.[0]
    if (!manifesto) return null

    const prunedMAnifesto = this.pruneManifesto({ ...manifesto, includes: data.includes })
    return prunedMAnifesto
  }
}

const manifestoService = new ManifestoService()
export default manifestoService
