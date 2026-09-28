import type { Document } from "@contentful/rich-text-types";
import type { Author } from "@/shared/lib/author";
import type { ContentfulTag } from "@/shared/lib/contentful/tags";
import type {
	ContentfulAuthorField,
	ContentfulIncludes,
	ContentfulSys,
} from "@/shared/lib/contentful/types";

export type BlogPostTagLink = {
	sys: {
		type?: string;
		linkType?: string;
		id: string;
	};
};

export type BlogPostEntryType = {
	sys: ContentfulSys;
	metadata?: {
		tags?: BlogPostTagLink[];
	};
	fields: {
		title: string;
		subtitle?: string;
		date?: string;
		blogPostContent: {
			nodeType: string;
			data: Record<string, unknown>;
			content: Array<{
				nodeType: string;
				data: Record<string, unknown>;
				content: Array<{ value: string }>;
			}>;
		};
		authors?: ContentfulAuthorField[];
	};
	includes?: ContentfulIncludes;
};

export type BlogTag = ContentfulTag;

export type PrunedBlogPostType = {
	id: string;
	title: string;
	subtitle?: string;
	createdAt: string;
	updatedAt: string;
	revision: number;
	authors: Author[];
	/** Public tags with resolved display names. Unresolved ids are omitted. */
	tags: BlogTag[];
	value: Document | null;
};
