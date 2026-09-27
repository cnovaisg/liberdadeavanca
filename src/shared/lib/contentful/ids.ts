/** Contentful sys.id / tag id: alphanumeric, `_`, `-`, up to 64 chars. */
export const CONTENTFUL_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export const isContentfulId = (value: string) =>
	CONTENTFUL_ID_PATTERN.test(value);
