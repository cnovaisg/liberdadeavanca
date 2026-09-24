import type {
	ContentfulAuthorField,
	ContentfulIncludes,
	ContentfulParagraph,
	ContentfulSys,
} from "@/shared/lib/contentful/types";

export type ManifestoEntryType = {
	sys: ContentfulSys;
	fields: {
		title: string;
		subtitle?: string;
		intro?: {
			content: Array<{
				content: Array<{ value: string }>;
			}>;
		};
		manifestoContent: {
			content: Array<{
				content: Array<{ value: string }>;
			}>;
		};
		authors?: ContentfulAuthorField[];
	};
	includes?: ContentfulIncludes;
};

export type PrunedManifestoEntryType = {
	createdAt: string;
	updatedAt: string;
	revision: number;
	title: string;
	subtitle?: string;
	intro: ContentfulParagraph[];
	value: ContentfulParagraph[];
	authors: Array<{ name: string; role: string; imageUrl: string }>;
};
