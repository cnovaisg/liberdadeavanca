import { z } from "zod";
import { log } from "@/shared/lib/log";
import type { ContentfulIncludes } from "./types";

const entrySchema = z.looseObject({
	sys: z.looseObject({
		id: z.string().min(1),
	}),
	fields: z.record(z.string(), z.unknown()),
});

const includeEntrySchema = z.looseObject({
	sys: z.looseObject({
		id: z.string().min(1),
	}),
	fields: z.record(z.string(), z.unknown()),
});

const includesSchema = z.looseObject({
	Entry: z.array(z.unknown()).optional(),
});

const entriesResponseSchema = z.looseObject({
	items: z.array(z.unknown()).optional(),
	includes: z.unknown().optional(),
	total: z.unknown().optional(),
});

const tagItemSchema = z.looseObject({
	sys: z.looseObject({
		id: z.string().min(1),
	}),
	name: z.string().min(1),
});

const tagsResponseSchema = z.looseObject({
	items: z.array(z.unknown()).optional(),
});

const issuePaths = (error: z.ZodError) =>
	error.issues
		.slice(0, 5)
		.map((issue) => issue.path.join(".") || "(root)")
		.join(",");

export type ParsedContentfulEntries<T> = {
	items: T[];
	total?: number;
	includes?: ContentfulIncludes;
};

function readTotal(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
		return undefined;
	}
	return value;
}

/**
 * Accepts a Delivery API `/entries` payload. Malformed envelopes and items
 * are dropped and logged; callers render an empty result instead of throwing.
 */
export function parseContentfulEntriesPayload<T>(
	payload: unknown,
	contentType: string,
): ParsedContentfulEntries<T> | null {
	const parsed = entriesResponseSchema.safeParse(payload);
	if (!parsed.success) {
		log.error("contentful.response_invalid", {
			contentType,
			issues: issuePaths(parsed.error),
		});
		return null;
	}

	const items: T[] = [];
	let dropped = 0;
	for (const item of parsed.data.items ?? []) {
		const entry = entrySchema.safeParse(item);
		if (!entry.success) {
			dropped += 1;
			continue;
		}
		items.push(entry.data as T);
	}

	if (dropped > 0) {
		log.warn("contentful.response_invalid", {
			contentType,
			dropped,
			kept: items.length,
		});
	}

	const includes = parseIncludes(parsed.data.includes, contentType);
	const total = readTotal(parsed.data.total);
	return {
		items,
		...(total !== undefined ? { total } : {}),
		...(includes ? { includes } : {}),
	};
}

function parseIncludes(
	value: unknown,
	contentType: string,
): ContentfulIncludes | undefined {
	if (value === undefined) return undefined;

	const parsed = includesSchema.safeParse(value);
	if (!parsed.success) {
		log.warn("contentful.response_invalid", {
			contentType,
			includes: issuePaths(parsed.error),
		});
		return undefined;
	}

	if (!parsed.data.Entry) return undefined;

	const entries = [];
	let dropped = 0;
	for (const item of parsed.data.Entry) {
		const entry = includeEntrySchema.safeParse(item);
		if (!entry.success) {
			dropped += 1;
			continue;
		}
		entries.push(
			entry.data as NonNullable<ContentfulIncludes["Entry"]>[number],
		);
	}

	if (dropped > 0) {
		log.warn("contentful.response_invalid", {
			contentType,
			includesDropped: dropped,
		});
	}

	return { Entry: entries };
}

export type ParsedContentfulTag = {
	id: string;
	name: string;
};

/**
 * Public tag catalog. An unusable envelope returns `null` (catalog failure).
 * Individual bad tags are skipped. If every tag is unusable, returns `null`
 * so listings do not treat a broken catalog as "no tags".
 */
export function parseContentfulTagsPayload(
	payload: unknown,
): ParsedContentfulTag[] | null {
	const parsed = tagsResponseSchema.safeParse(payload);
	if (!parsed.success) {
		log.error("contentful.tags_invalid", {
			issues: issuePaths(parsed.error),
		});
		return null;
	}

	const items = parsed.data.items ?? [];
	const tags: ParsedContentfulTag[] = [];
	let dropped = 0;
	for (const item of items) {
		const tag = tagItemSchema.safeParse(item);
		if (!tag.success) {
			dropped += 1;
			continue;
		}
		tags.push({ id: tag.data.sys.id, name: tag.data.name });
	}

	if (dropped > 0) {
		log.warn("contentful.tags_invalid", {
			dropped,
			kept: tags.length,
		});
	}

	if (items.length > 0 && tags.length === 0) return null;
	return tags;
}
