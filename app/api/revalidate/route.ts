import { createHash, timingSafeEqual } from "node:crypto"
import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import {
  BLOG_CACHE_TAG,
  blogPostCacheTag,
} from "@/src/features/blog/services/blog.cache"

/**
 * On-demand cache revalidation for Contentful publishes.
 *
 * Env: REVALIDATE_SECRET (Vercel project env — do not commit the value).
 *
 * Contentful webhook (Settings → Webhooks):
 *   URL:  https://<host>/api/revalidate?secret=<REVALIDATE_SECRET>
 *   or header `x-revalidate-secret: <REVALIDATE_SECRET>` / `Authorization: Bearer <REVALIDATE_SECRET>`
 *   Method: POST
 *   Triggers: Entry publish, unpublish, delete (content type blogPost)
 *
 * The handler always refreshes `/blog`. When the webhook body or query
 * includes an entry id, it also refreshes `/blog/[postId]` for that entry.
 */

type ContentfulWebhookBody = {
  sys?: { id?: unknown }
  entryId?: unknown
  entityId?: unknown
}

const unauthorized = () =>
  NextResponse.json({ revalidated: false, message: "Unauthorized" }, { status: 401 })

const secretsMatch = (provided: string, expected: string) => {
  const providedHash = createHash("sha256").update(provided).digest()
  const expectedHash = createHash("sha256").update(expected).digest()
  return timingSafeEqual(providedHash, expectedHash)
}

const readProvidedSecret = (request: Request) => {
  const url = new URL(request.url)
  const fromQuery = url.searchParams.get("secret")
  const fromHeader = request.headers.get("x-revalidate-secret")
  const authorization = request.headers.get("authorization")
  const fromBearer = authorization?.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : null

  return fromQuery || fromHeader || fromBearer
}

const asId = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined

const extractEntryId = async (request: Request): Promise<string | undefined> => {
  const url = new URL(request.url)
  const fromQuery =
    url.searchParams.get("id") ??
    url.searchParams.get("entryId") ??
    url.searchParams.get("postId")
  if (fromQuery) return fromQuery
  if (request.method === "GET") return undefined

  try {
    const body = (await request.json()) as ContentfulWebhookBody
    return asId(body?.sys?.id) ?? asId(body?.entryId) ?? asId(body?.entityId)
  } catch {
    return undefined
  }
}

const revalidateBlog = (entryId?: string) => {
  revalidateTag(BLOG_CACHE_TAG, { expire: 0 })
  revalidatePath("/blog")

  if (entryId) {
    revalidateTag(blogPostCacheTag(entryId), { expire: 0 })
    revalidatePath(`/blog/${entryId}`)
  }
}

const handleRevalidate = async (request: Request) => {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected) {
    return NextResponse.json(
      { revalidated: false, message: "REVALIDATE_SECRET is not configured" },
      { status: 500 },
    )
  }

  const provided = readProvidedSecret(request)
  if (!provided || !secretsMatch(provided, expected)) {
    return unauthorized()
  }

  const entryId = await extractEntryId(request)
  revalidateBlog(entryId)

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    paths: entryId ? ["/blog", `/blog/${entryId}`] : ["/blog"],
  })
}

export async function POST(request: Request) {
  return handleRevalidate(request)
}

export async function GET(request: Request) {
  return handleRevalidate(request)
}
