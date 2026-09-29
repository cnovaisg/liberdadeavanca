import type { Author } from "@/shared/lib/author";

/**
 * Author fields as stored in Contentful. May include CMS-only fields
 * (e.g. `imageUrl`) that are stripped when pruning to {@link Author}.
 */
export type ContentfulAuthor = Author & {
	imageUrl?: string;
};

export type ContentfulAuthorLink = {
	sys: { id: string; type?: string; linkType?: string };
};

export type ContentfulAuthorField =
	| ContentfulAuthorLink
	| ContentfulAuthor
	| (ContentfulAuthor & { contact?: string });

export type ContentfulIncludes = {
	Entry?: Array<{
		sys: { id: string };
		fields: ContentfulAuthor;
	}>;
};

export type ContentfulSys = {
	id: string;
	createdAt: string;
	updatedAt: string;
	revision: number;
};
