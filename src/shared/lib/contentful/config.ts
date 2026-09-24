import { getContentfulCredentials } from "@/shared/lib/env";

export type ContentfulConfig = {
	baseUrl: string;
	headers: HeadersInit;
};

/** Returns null when Contentful env vars are missing (e.g. local build without `.env.local`). */
export function getContentfulConfig(): ContentfulConfig | null {
	const credentials = getContentfulCredentials();
	if (!credentials) {
		return null;
	}

	const { spaceId, apiBaseUrl, accessToken } = credentials;

	return {
		baseUrl: `${apiBaseUrl}/spaces/${spaceId}/environments/master`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	};
}
