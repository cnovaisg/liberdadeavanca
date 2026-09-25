export type ContentfulAuthor = {
	name: string;
	role: string;
	imageUrl: string;
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

/** Built-in metadata tag link on an entry (`metadata.tags`). */
export type ContentfulTagLink = {
	sys: {
		type?: string;
		linkType?: string;
		id: string;
	};
};

/** Tag entity from the Delivery API `/tags` collection. */
export type ContentfulTag = {
	name: string;
	sys: {
		id: string;
		type?: string;
		visibility?: string;
	};
};

export type ContentfulParagraph = { paragraph: string };
