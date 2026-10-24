import { log } from "@/shared/lib/log";
import { getContentfulConfig } from "./config";
import { parseContentfulEntriesPayload } from "./payload";
import type { ContentfulIncludes } from "./types";

export type ContentfulEntriesResponse<T> = {
	items: T[];
	/** Collection size reported by the Delivery API, not the page length. */
	total?: number;
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
		// Bubble up so /blog, articles and /manifesto hit their error boundary
		// instead of a generic 500. Tag catalog failures are handled separately.
		log.error("contentful.fetch_failed", {
			status: response.status,
			statusText: response.statusText,
			contentType: options.contentType,
		});
		throw new Error(
			`Contentful API error: ${response.status} ${response.statusText}`,
		);
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch (error) {
		log.error("contentful.response_invalid", {
			contentType: options.contentType,
			message: error instanceof Error ? error.message : "invalid json",
		});
		return null;
	}

	return parseContentfulEntriesPayload<T>(payload, options.contentType);
}
