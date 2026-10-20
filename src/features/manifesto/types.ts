import type { Document } from "@contentful/rich-text-types";
import type { Author } from "@/shared/lib/author";
import type {
	ContentfulAuthorField,
	ContentfulIncludes,
	ContentfulSys,
} from "@/shared/lib/contentful/types";

export type ManifestoEntryType = {
	sys: ContentfulSys;
	fields: {
		title: string;
		subtitle?: string;
		intro?: Document;
		manifestoContent: Document;
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
	intro: Document | null;
	value: Document | null;
	authors: Author[];
};
