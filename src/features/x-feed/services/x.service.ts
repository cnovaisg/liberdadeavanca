import { getSocialDataCredentials } from "@/shared/lib/env";
import { SITE_UI_LOCALE } from "@/shared/lib/site";

/**
 * Data Cache TTL for SocialData. The homepage stays dynamic because of the
 * CSP nonce, so `cache: "no-store"` would call this paid API on every visit.
 * An explicit revalidate still caches the response when Authorization is set.
 * Same window as the Contentful pages.
 */
export const X_FEED_REVALIDATE_SECONDS = 60;

type SocialDataTweet = {
	tweet_created_at?: string;
	full_text?: string;
	id_str?: string;
};

const LISBON_TIME_ZONE = "Europe/Lisbon";
const MISSING_DATE_PART = "—";

const lisbonDateTime = new Intl.DateTimeFormat(SITE_UI_LOCALE, {
	timeZone: LISBON_TIME_ZONE,
	hour: "2-digit",
	minute: "2-digit",
	day: "2-digit",
	month: "2-digit",
	hourCycle: "h23",
});

const readPart = (
	parts: Intl.DateTimeFormatPart[],
	type: Intl.DateTimeFormatPartTypes,
) => parts.find((part) => part.type === type)?.value;

/**
 * Clock time in Europe/Lisbon. `Date#getHours()` follows the server zone
 * (UTC on Vercel). Missing or unparseable timestamps stay as em dashes.
 */
export function formatTweetDate(rawDate?: string): {
	hour: string;
	day: string;
} {
	const fallback = { hour: MISSING_DATE_PART, day: MISSING_DATE_PART };
	if (!rawDate?.trim()) return fallback;

	const date = new Date(rawDate);
	if (Number.isNaN(date.getTime())) return fallback;

	const parts = lisbonDateTime.formatToParts(date);
	const hour = readPart(parts, "hour");
	const minute = readPart(parts, "minute");
	const day = readPart(parts, "day");
	const month = readPart(parts, "month");

	if (!hour || !minute || !day || !month) return fallback;
	if ([hour, minute, day, month].some((part) => part.includes("NaN"))) {
		return fallback;
	}

	return {
		hour: `${hour}:${minute}`,
		day: `${day}/${month}`,
	};
}

class SocialDataXService {
	private getConfig() {
		const credentials = getSocialDataCredentials();
		if (!credentials) {
			return null;
		}

		const { account, baseUrl, apiKey } = credentials;
		const twitterRoot = baseUrl.endsWith("/twitter")
			? baseUrl
			: `${baseUrl}/twitter`;

		return {
			user: account,
			twitterRoot,
			headers: {
				Authorization: `Bearer ${apiKey}`,
				Accept: "application/json",
			},
		};
	}

	private async getJson(url: string, headers: { [key: string]: string }) {
		const response = await fetch(url, {
			method: "GET",
			headers,
			next: { revalidate: X_FEED_REVALIDATE_SECONDS },
		});
		const data = await response.json();
		if (!response.ok) {
			console.error("X feed request failed", response.status);
		}
		return data;
	}

	private async getXfeed(
		user: string,
		twitterRoot: string,
		headers: { [key: string]: string },
	) {
		const query = encodeURIComponent(`from:${user}`);
		const search = await this.getJson(
			`${twitterRoot}/search?query=${query}&type=Latest`,
			headers,
		);
		if (Array.isArray(search?.tweets) && search.tweets.length > 0) {
			return search;
		}

		const profile = await this.getJson(`${twitterRoot}/user/${user}`, headers);
		const userId = profile?.id_str ?? profile?.id;
		if (!userId) {
			console.error("X feed: no tweets from search and no user id");
			return { tweets: [] };
		}

		return this.getJson(`${twitterRoot}/user/${userId}/tweets`, headers);
	}

	async getPostprocessedXfeed() {
		const config = this.getConfig();
		if (!config) {
			return [];
		}

		try {
			const results = await this.getXfeed(
				config.user,
				config.twitterRoot,
				config.headers,
			);
			const postprocessedResults =
				results?.tweets
					?.map((tweet: SocialDataTweet) => {
						return {
							date: formatTweetDate(tweet.tweet_created_at),
							text: tweet.full_text,
							id: tweet.id_str,
						};
					})
					.filter(
						(tweet: { text?: string; id?: string }) => tweet.text && tweet.id,
					) ?? [];
			return postprocessedResults;
		} catch (error) {
			console.error("Error postprocessing X feed:", error);
			return [];
		}
	}
}

const socialDataXService = new SocialDataXService();
export default socialDataXService;
