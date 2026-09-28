This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

```bash
npm test
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment variables

Set these in `.env.local` (copy from `.env.example`). Same keys in the Vercel project. Do not commit secrets.

| Variable | Purpose |
| --- | --- |
| `CONTENTFUL_SPACE_ID` | Contentful space id |
| `CONTENTFUL_API_BASE_URL` | Delivery host only: `https://cdn.contentful.com` (or Preview: `https://preview.contentful.com`). Never `api.contentful.com` |
| `CONTENTFUL_API_ACCESS_TOKEN` | Contentful **Content Delivery** (or Preview) token — not Management (CMA) |
| `CONTENTFUL_LOCALE` | Optional Delivery locale for queries (default `en-US`). UI language is `pt-PT` |
| `CONTENTFUL_WEBHOOK_SIGNING_SECRET` | Space-level webhook HMAC secret (Settings → Webhooks → Settings). **Required in Production** (`VERCEL_ENV=production`); optional in Preview/local. Comma-separate two secrets during rotation |
| `REVALIDATE_SECRET` | Shared secret for the on-demand revalidation webhook |
| `ACCOUNT_MAIL` | Contact address for the mailto icon |
| `SOCIAL_DATA_X_ACCOUNT` | X/Twitter handle for the homepage feed. Responses are cached for 60 seconds |
| `SOCIAL_DATA_BASE_URL` | SocialData API host — only `https://api.socialdata.tools` (allowlisted) |
| `SOCIAL_DATA_API_KEY` | SocialData API key |

### Rotating secrets

If a secret may have leaked (chat, logs, old webhook URL with `?secret=`), rotate it:

1. **`REVALIDATE_SECRET`** — generate a new random value, update Vercel (Production + Preview), update the Contentful webhook header, remove any old query-string secret from the webhook URL.
2. **`CONTENTFUL_WEBHOOK_SIGNING_SECRET`** — in Contentful Webhooks → Settings, rotate the signing secret; keep both old and new in Vercel (comma-separated) until Contentful only signs with the new one; then drop the old.
3. **`CONTENTFUL_API_ACCESS_TOKEN`** — in Contentful create a new Delivery API token, put it in Vercel/`.env.local`, revoke the old token.
4. **`SOCIAL_DATA_API_KEY`** — regenerate in SocialData, update Vercel/`.env.local`, revoke the old key.

Redeploy after changing Vercel env vars.

## Contentful publish webhook

Blog pages cache Contentful fetches for 60 seconds and also accept on-demand revalidation.

1. Add `REVALIDATE_SECRET` in Vercel (Production and Preview).
2. In Contentful: **Settings → Webhooks → Add webhook**.
3. URL: `https://<your-domain>/api/revalidate` (no secret in the URL).
4. Custom header: `x-revalidate-secret` = `<REVALIDATE_SECRET>`  
   (or `Authorization: Bearer <REVALIDATE_SECRET>`).
5. Method: **POST** only. Triggers: Entry **Publish**, **Unpublish**, and **Delete** (content types `blogPost` and `manifesto`). Tag **Create**, **Save**, and **Delete** are optional: they refresh a renamed tag immediately. Without them, the new name still appears within 60 seconds.
6. On success the route revalidates `/blog`, filtered listings under `/blog/tag/[tagId]`, and, when the payload includes a valid entry id, `/blog/[postId]`. Manifesto publishes revalidate `/manifesto`. Tag events also revalidate every `/blog/[postId]` page.

### Request verification (HMAC)

**Required in Production.** Proves the POST was signed by Contentful for your space.
Without `CONTENTFUL_WEBHOOK_SIGNING_SECRET`, Production returns **500** (fail closed).
Preview/local still allow the shared secret alone so you can iterate without HMAC.

1. Contentful: **Settings → Webhooks → Settings tab → Enable request verification**.
2. Copy the 64-character signing secret (shown once).
3. Vercel: set `CONTENTFUL_WEBHOOK_SIGNING_SECRET` (at least Production; Preview recommended) to that value, then redeploy.
4. When the env var is set, `/api/revalidate` requires valid `x-contentful-signature` / `x-contentful-signed-headers` / `x-contentful-timestamp` (60s TTL) **in addition to** `x-revalidate-secret`.

Do not put the secret in the query string — it can leak via logs and referrers.

The route applies a soft per-IP rate limit (30 requests / minute, in-memory). Over the limit it returns **429**. Pair with Vercel Firewall rate-limit rules for a hard edge cap (requests blocked at the edge are not billed as function invocations).

### Vercel Firewall (edge rate limits)

Custom WAF rules need a **Pro** (or higher) team. Stage with **log** first, review traffic, then switch the rate-limit action to `rate_limit` / `challenge`.

Suggested rules (Firewall → Custom Rules, or `vercel firewall rules add`):

1. **RL revalidate POST** — `path = /api/revalidate` AND `method = POST` → rate limit **60 / 60s / IP**, action start as **log**.
2. **RL HTML pages** — `method = GET` AND path not `/_next*`, `/api*`, `/favicon*` → rate limit **300 / 60s / IP**, action **log**.
3. **RL next/image** — `path` starts with `/_next/image` → rate limit **120 / 60s / IP**, action **log**.
4. **Block probe paths** — path contains `/wp-admin`, `/.env`, `/.git`, `/phpmyadmin`, `/xmlrpc.php` → **deny**.

Dashboard: [Firewall](https://vercel.com/carlos-novais-projects/liberdadeavanca/firewall). After staging, publish from the UI (or `vercel firewall publish --yes`).

## Contentful public tags

Blog posts show public tags from each entry (`metadata.tags`). The visible name comes from the Delivery API `/tags` catalog, so the id and the label can differ (`imigrao` is shown as imigração). Private tags are not returned and do not appear. Clicking a tag opens `/blog/tag/<id>`.

### Create public tags

1. In Contentful: **Settings → Tags** (or the Tags section in the sidebar).
2. Create a tag with **visibility = public**.
3. The id is what goes in the filter URL (`/blog/tag/economia`). The name is what visitors see.
4. Visibility cannot be changed after creation — if you create a private tag by mistake, create a new public one.

### Assign tags to posts

1. Open a `blogPost` entry.
2. In the sidebar, open **Tags** and add one or more public tags.
3. **Publish** the entry (and ensure the revalidate webhook is configured) so the site updates.

Until tags are assigned and published, the blog UI simply hides the etiquetas row.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Content Security Policy

CSP is applied per request in `src/proxy.ts` (not in `next.config.ts`):

- **Scripts:** `'nonce-…'` + `'strict-dynamic'` — no `'unsafe-inline'`. `'unsafe-eval'` only in development.
- **Styles:** `'unsafe-inline'` kept for Motion / style attributes (main XSS surface is scripts).

Root layout reads `headers()` so pages render at request time and Next.js can attach the nonce to framework scripts.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
