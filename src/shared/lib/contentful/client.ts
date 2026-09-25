import { getContentfulConfig } from "./config";
import type { ContentfulIncludes, ContentfulTag } from "./types";

export type ContentfulEntriesResponse<T> = {
	items: T[];
	includes?: ContentfulIncludes;
};

type FetchEntriesOptions = {
	contentType: string;
	searchParams?: Record<string, string>;
	next?: NextFetchRequestConfig;
	cache?: RequestCache;
};

/**
 * Fetches Contentful entries. Returns null when env config is missing
 * (so callers can degrade gracefully without throwing at import time).
 */
export async function fetchContentfulEntries<T>(
	options: FetchEntriesOptions,
): Promise<ContentfulEntriesResponse<T> | null> {
	const config = getContentfulConfig();
	if (!config) {
		return null;
	}

	const url = new URL(`${config.baseUrl}/entries`);
	url.searchParams.set("content_type", options.contentType);

	const rawQuery: string[] = [];
	for (const [key, value] of Object.entries(options.searchParams ?? {})) {
		// Contentful filter keys use brackets (`metadata.tags.sys.id[in]`).
		// `URLSearchParams` percent-encodes them, which the Delivery API rejects.
		if (key.includes("[") || key.includes("]")) {
			rawQuery.push(`${key}=${encodeURIComponent(value)}`);
			continue;
		}
		url.searchParams.set(key, value);
	}

	if (rawQuery.length > 0) {
		url.search += `${url.search ? "&" : "?"}${rawQuery.join("&")}`;
	}

	const response = await fetch(url.toString(), {
		headers: config.headers,
		next: options.next,
		cache: options.cache,
	});

	if (response.status === 404) {
		return { items: [] };
	}

	if (!response.ok) {
		throw new Error(
			`Contentful API error: ${response.status} ${response.statusText}`,
		);
	}

	return response.json() as Promise<ContentfulEntriesResponse<T>>;
}

type ContentfulTagsPage = {
	items?: ContentfulTag[];
	total?: number;
	skip?: number;
	limit?: number;
};

const TAGS_PAGE_LIMIT = "1000";

/**
 * Public tags from the Delivery API `/tags` endpoint.
 * Returns null when Contentful env config is missing.
 * Private tags are omitted by the Delivery API.
 */
export async function fetchContentfulTags(options?: {
	next?: NextFetchRequestConfig;
	cache?: RequestCache;
}): Promise<ContentfulTag[] | null> {
	const config = getContentfulConfig();
	if (!config) {
		return null;
	}

	const items: ContentfulTag[] = [];
	let skip = 0;
	let total = Number.POSITIVE_INFINITY;
	let pages = 0;

	while (items.length < total && pages < 10) {
		pages += 1;
		const url = new URL(`${config.baseUrl}/tags`);
		url.searchParams.set("limit", TAGS_PAGE_LIMIT);
		url.searchParams.set("skip", skip.toString());

		const response = await fetch(url.toString(), {
			headers: config.headers,
			next: options?.next,
			cache: options?.cache,
		});

		if (response.status === 404) {
			return items;
		}

		if (!response.ok) {
			throw new Error(
				`Contentful API error: ${response.status} ${response.statusText}`,
			);
		}

		const page = (await response.json()) as ContentfulTagsPage;
		const pageItems = page.items ?? [];
		total = page.total ?? pageItems.length;
		items.push(...pageItems);
		skip += pageItems.length;

		if (pageItems.length === 0) break;
	}

	return items;
}
