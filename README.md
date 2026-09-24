This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment variables

Set these in `.env.local` (copy from `.env.example`). Same keys in the Vercel project. Do not commit secrets.

| Variable | Purpose |
| --- | --- |
| `CONTENTFUL_SPACE_ID` | Contentful space id |
| `CONTENTFUL_API_BASE_URL` | CDA host, typically `https://cdn.contentful.com` |
| `CONTENTFUL_API_ACCESS_TOKEN` | Contentful Content Delivery API token |
| `REVALIDATE_SECRET` | Shared secret for the on-demand revalidation webhook |
| `ACCOUNT_MAIL` | Contact address for the mailto icon |
| `SOCIAL_DATA_X_ACCOUNT` | X/Twitter handle for the homepage feed |
| `SOCIAL_DATA_BASE_URL` | SocialData API host, typically `https://api.socialdata.tools` |
| `SOCIAL_DATA_API_KEY` | SocialData API key |

## Contentful publish webhook

Blog pages cache Contentful fetches for 60 seconds and also accept on-demand revalidation.

1. Add `REVALIDATE_SECRET` in Vercel (Production and Preview).
2. In Contentful: **Settings → Webhooks → Add webhook**.
3. URL: `https://<your-domain>/api/revalidate` (no secret in the URL).
4. Custom header: `x-revalidate-secret` = `<REVALIDATE_SECRET>`  
   (or `Authorization: Bearer <REVALIDATE_SECRET>`).
5. Method: **POST** only. Triggers: Entry **Publish**, **Unpublish**, and **Delete** (content type `blogPost`).
6. On success the route revalidates `/blog` and, when the payload includes a valid entry id, `/blog/[postId]`.

Do not put the secret in the query string — it can leak via logs and referrers.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
