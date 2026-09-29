/**
 * Canonical author shape for UI and pruned CMS entries.
 * Contentful delivery fields map onto this after `resolveAuthors`.
 * Avatars (`imageUrl`) are not used in the UI today and are omitted.
 */
export type Author = {
	name: string;
	role: string;
	contact?: string;
};
