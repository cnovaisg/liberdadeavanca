import { getContentfulConfig } from "./config";

export type ContentfulTag = {
	id: string;
	name: string;
};

type ContentfulTagEntry = {
	sys: { id: string };
	name: string;
};

type ContentfulTagsResponse = {
	items?: ContentfulTagEntry[];
};

/** Public tags only — private tags are not exposed on the Delivery API. */
export async function fetchPublicTags(options?: {
	next?: NextFetchRequestConfig;
	cache?: RequestCache;
}): Promise<ContentfulTag[]> {
	const config = getContentfulConfig();
	if (!config) {
		return [];
	}

	const url = new URL(`${config.baseUrl}/tags`);
	const response = await fetch(url.toString(), {
		headers: config.headers,
		next: options?.next,
		cache: options?.cache,
	});

	if (!response.ok) {
		console.error(
			"Contentful tags request failed",
			response.status,
			response.statusText,
		);
		return [];
	}

	const data = (await response.json()) as ContentfulTagsResponse;
	return (data.items ?? []).map((tag) => ({
		id: tag.sys.id,
		name: tag.name,
	}));
}

export function buildTagMap(tags: ContentfulTag[]): Map<string, string> {
	return new Map(tags.map((tag) => [tag.id, tag.name]));
}

export function resolveEntryTags(
	tagLinks: Array<{ sys?: { id?: string } }> | undefined,
	tagNamesById: Map<string, string>,
): ContentfulTag[] {
	if (!tagLinks?.length) return [];

	const seen = new Set<string>();
	const resolved: ContentfulTag[] = [];

	for (const link of tagLinks) {
		const id = link.sys?.id;
		if (!id || seen.has(id)) continue;
		seen.add(id);
		resolved.push({
			id,
			name: tagNamesById.get(id) ?? id,
		});
	}

	return resolved;
}
