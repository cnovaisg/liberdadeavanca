import type { Author } from "@/shared/lib/author";
import type { ContentfulAuthorField, ContentfulIncludes } from "./types";

const toAuthor = (fields: {
	name?: unknown;
	role?: unknown;
	contact?: unknown;
}): Author | null => {
	if (typeof fields.name !== "string" || typeof fields.role !== "string") {
		return null;
	}
	const author: Author = { name: fields.name, role: fields.role };
	if (typeof fields.contact === "string" && fields.contact.trim()) {
		author.contact = fields.contact;
	}
	return author;
};

export function resolveAuthors(
	authors: ContentfulAuthorField[] | undefined,
	includes?: ContentfulIncludes,
): Author[] {
	const linkedEntries = includes?.Entry ?? [];
	if (!authors?.length) return [];

	return authors
		.map((author) => {
			if (
				"sys" in author &&
				author.sys?.type === "Link" &&
				author.sys.linkType === "Entry"
			) {
				const linked = linkedEntries.find(
					(entry) => entry.sys.id === author.sys.id,
				);
				return linked ? toAuthor(linked.fields) : null;
			}

			if ("name" in author && "role" in author) {
				return toAuthor(author);
			}

			return null;
		})
		.filter((author): author is Author => author !== null);
}
