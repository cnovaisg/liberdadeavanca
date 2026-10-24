import type { Document } from "@contentful/rich-text-types";
import { richTextExcerpt } from "@/shared/lib/contentful/rich-text";
import { SITE_DESCRIPTION } from "@/shared/lib/seo";

/** Contentful Symbol, unique, optional. Public URLs use this when it is set. */
export const BLOG_SLUG_MAX_LENGTH = 80;

/**
 * Lowercase kebab-case. Rejects leading, trailing and repeated hyphens so a
 * slug cannot be confused with a path segment or an empty id.
 */
export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BLOG_SUMMARY_MAX_LENGTH = 300;

export function normalizeBlogSlug(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const slug = value.trim();
	if (!slug || slug.length > BLOG_SLUG_MAX_LENGTH) return undefined;
	if (!BLOG_SLUG_PATTERN.test(slug)) return undefined;
	return slug;
}

export function canonicalBlogPath(post: { id: string; slug?: string }): string {
	const slug = normalizeBlogSlug(post.slug);
	return `/blog/${encodeURIComponent(slug ?? post.id)}`;
}

function clipText(value: string, max = BLOG_SUMMARY_MAX_LENGTH): string {
	const chars = Array.from(value);
	if (chars.length <= max) return value;
	return chars.slice(0, max).join("").trimEnd();
}

export function normalizeBlogSummary(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const summary = value.replace(/\s+/g, " ").trim();
	if (!summary) return undefined;
	return clipText(summary);
}

/**
 * Editorial `date`, then the first time the entry was published, then the
 * moment it was created in Contentful. Returns an ISO string, or "" when
 * nothing parses.
 */
export function resolvePublishedAt(input: {
	date?: unknown;
	firstPublishedAt?: unknown;
	createdAt?: unknown;
}): string {
	for (const candidate of [
		input.date,
		input.firstPublishedAt,
		input.createdAt,
	]) {
		const iso = toIsoDate(candidate);
		if (iso) return iso;
	}
	return "";
}

function toIsoDate(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;

	const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
	if (dateOnly) {
		const year = Number(dateOnly[1]);
		const month = Number(dateOnly[2]);
		const day = Number(dateOnly[3]);
		const utc = new Date(Date.UTC(year, month - 1, day));
		if (
			utc.getUTCFullYear() !== year ||
			utc.getUTCMonth() !== month - 1 ||
			utc.getUTCDate() !== day
		) {
			return undefined;
		}
		return utc.toISOString();
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) return undefined;
	return parsed.toISOString();
}

/** Summary for the listing. Falls back to the first rich-text paragraph. */
export function blogPostSummaryText(post: {
	summary?: string;
	value: Document | null;
}): string {
	if (post.summary?.trim()) return post.summary.trim();
	return richTextExcerpt(post.value);
}

/** Meta description and RSS blurb: summary, excerpt, then subtitle. */
export function blogPostDescription(post: {
	summary?: string;
	subtitle?: string;
	value: Document | null;
}): string {
	const summary = blogPostSummaryText(post);
	if (summary) return clipText(summary);
	const subtitle = post.subtitle?.replace(/\s+/g, " ").trim();
	if (subtitle) return clipText(subtitle);
	return SITE_DESCRIPTION;
}

/**
 * Contentful webhooks send localized fields (`{ "en-US": "..." }`). A plain
 * string is accepted for flattened payloads. When several locales are present
 * and the configured one is missing, nothing is guessed.
 */
export function readLocalizedField(value: unknown, locale: string): unknown {
	if (typeof value === "string") return value;
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return undefined;
	}

	const record = value as Record<string, unknown>;
	if (locale in record) return record[locale];

	const strings = Object.values(record).filter(
		(item) => typeof item === "string",
	);
	if (strings.length === 1) return strings[0];
	return undefined;
}

export function readWebhookSlug(
	fields: unknown,
	locale: string,
): string | undefined {
	if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
		return undefined;
	}
	const slug = (fields as { slug?: unknown }).slug;
	return normalizeBlogSlug(readLocalizedField(slug, locale));
}
