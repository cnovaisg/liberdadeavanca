import type { ContentfulParagraph } from "./types";

type RichTextNode = { value?: string };

type RichTextParagraph = {
	content?: RichTextNode[];
};

type RichTextField = {
	content?: RichTextParagraph[];
};

/** Flattens a Contentful rich-text document into trimmed paragraph strings. */
export function parseRichTextField(
	field?: RichTextField | null,
): ContentfulParagraph[] {
	return (
		field?.content?.flatMap((paragraph) =>
			(paragraph.content ?? [])
				.map((node) => node.value ?? "")
				.join("")
				.split(/\n+/)
				.map((text) => text.trim())
				.filter(Boolean)
				.map((text) => ({ paragraph: text })),
		) ?? []
	);
}
