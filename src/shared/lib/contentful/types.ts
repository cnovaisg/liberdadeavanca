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

export type ContentfulParagraph = { paragraph: string };
