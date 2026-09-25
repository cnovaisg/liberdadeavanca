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

	for (const [key, value] of Object.entries(options.searchParams ?? {})) {
		url.searchParams.set(key, value);
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
