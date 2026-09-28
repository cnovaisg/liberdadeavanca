import { BLOCKS, type Document } from "@contentful/rich-text-types";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function hasControlCharacter(value: string): boolean {
	for (const character of value) {
		const code = character.charCodeAt(0);
		if (code <= 31 || code === 127) return true;
	}
	return false;
}

type RichNode = {
	nodeType?: string;
	value?: string;
	content?: RichNode[];
};

/** Accepts a Contentful rich-text document; anything else becomes null. */
export function toRichTextDocument(field: unknown): Document | null {
	if (!field || typeof field !== "object") return null;

	const candidate = field as Partial<Document>;
	if (
		candidate.nodeType !== BLOCKS.DOCUMENT ||
		!Array.isArray(candidate.content)
	) {
		return null;
	}

	return candidate as Document;
}

export function hasRichText(field: unknown): boolean {
	const document = toRichTextDocument(field);
	return Boolean(document && document.content.length > 0);
}

/**
 * http, https and mailto only. `javascript:`, `data:` and relative URLs are
 * dropped so a Contentful hyperlink cannot become an XSS sink.
 */
export function sanitizeRichTextHref(uri: unknown): string | null {
	if (typeof uri !== "string") return null;

	const trimmed = uri.trim();
	if (!trimmed || hasControlCharacter(trimmed)) return null;

	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		return null;
	}

	if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
	return url.href;
}

/** http(s) leaves the site; mailto stays in the mail client. */
export function isExternalHttpHref(href: string): boolean {
	try {
		const url = new URL(href);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function nodePlainText(node: RichNode | undefined): string {
	if (!node) return "";
	if (node.nodeType === "text") return node.value ?? "";
	return (node.content ?? []).map((child) => nodePlainText(child)).join("");
}

/** First paragraph, including the visible text of hyperlinks and marks. */
export function richTextExcerpt(field: unknown): string {
	const document = toRichTextDocument(field);
	if (!document) return "";

	const paragraph = document.content.find(
		(node) => node.nodeType === BLOCKS.PARAGRAPH,
	);
	if (!paragraph) return "";

	return nodePlainText(paragraph as RichNode)
		.replace(/\s+/g, " ")
		.trim();
}

export type { Document };
