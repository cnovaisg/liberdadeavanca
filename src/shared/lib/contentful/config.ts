export type ContentfulConfig = {
	baseUrl: string;
	headers: HeadersInit;
};

/** Returns null when Contentful env vars are missing (e.g. local build without `.env.local`). */
export function getContentfulConfig(): ContentfulConfig | null {
	const spaceId = process.env.CONTENTFUL_SPACE_ID;
	const apiBaseUrl = process.env.CONTENTFUL_API_BASE_URL;
	const accessToken = process.env.CONTENTFUL_API_ACCESS_TOKEN;

	if (!spaceId || !apiBaseUrl || !accessToken) {
		return null;
	}

	return {
		baseUrl: `${apiBaseUrl}/spaces/${spaceId}/environments/master`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	};
}
