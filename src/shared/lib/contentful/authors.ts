import type {
	ContentfulAuthor,
	ContentfulAuthorField,
	ContentfulIncludes,
} from "./types";

export function resolveAuthors(
	authors: ContentfulAuthorField[] | undefined,
	includes?: ContentfulIncludes,
): ContentfulAuthor[] {
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
				return linked?.fields ?? null;
			}

			if ("name" in author && "role" in author && "imageUrl" in author) {
				return {
					name: author.name,
					role: author.role,
					imageUrl: author.imageUrl,
				};
			}

			return null;
		})
		.filter((author): author is ContentfulAuthor => author !== null);
}
