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
		/** Editorial date. Optional on entries published before the field existed. */
		date?: string;
		/** Unique kebab-case public slug. Optional; missing values keep the id URL. */
		slug?: string;
		/** Plain-text blurb, at most 300 characters. Optional. */
		summary?: string;
		blogPostContent: Document;
		authors?: ContentfulAuthorField[];
	};
	includes?: ContentfulIncludes;
};

export type BlogTag = ContentfulTag;

export type PrunedBlogPostType = {
	id: string;
	/** Set only when Contentful stored a valid kebab-case slug. */
	slug?: string;
	title: string;
	subtitle?: string;
	/** Normalized summary. Omitted when the field is empty. */
	summary?: string;
	/**
	 * Public date: `fields.date`, then `sys.firstPublishedAt`, then
	 * `sys.createdAt`. ISO-8601, or "" when none of them parse.
	 */
	publishedAt: string;
	createdAt: string;
	updatedAt: string;
	revision: number;
	authors: Author[];
	/** Public tags with resolved display names. Unresolved ids are omitted. */
	tags: BlogTag[];
	value: Document | null;
};

export type BlogPostResolution =
	| { status: "not_found" }
	| { status: "ok"; post: PrunedBlogPostType }
	| { status: "redirect"; to: string; post: PrunedBlogPostType };
