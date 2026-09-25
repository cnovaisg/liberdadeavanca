import type {
	ContentfulAuthorField,
	ContentfulIncludes,
	ContentfulParagraph,
	ContentfulSys,
	ContentfulTagLink,
} from "@/shared/lib/contentful/types";

export type BlogTag = {
	id: string;
	name: string;
};

export type BlogPostEntryType = {
	sys: ContentfulSys;
	metadata?: {
		tags?: ContentfulTagLink[];
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

export type PrunedBlogPostType = {
	id: string;
	title: string;
	subtitle?: string;
	createdAt: string;
	updatedAt: string;
	revision: number;
	authors: Array<{ name: string; role: string; imageUrl: string }>;
	tags: BlogTag[];
	value: ContentfulParagraph[];
};
