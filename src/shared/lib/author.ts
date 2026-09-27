/**
 * Canonical author shape for UI and pruned CMS entries.
 * Contentful delivery fields map onto this after `resolveAuthors`.
 */
export type Author = {
	name: string;
	role: string;
	imageUrl: string;
	contact?: string;
};
