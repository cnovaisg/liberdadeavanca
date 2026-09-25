import { getContentfulConfig } from "./config";
import type { ContentfulIncludes } from "./types";

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
