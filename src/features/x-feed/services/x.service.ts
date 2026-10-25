import { unstable_rethrow } from "next/navigation";
import blogService from "@/features/blog/services/blog.service";
import {
	DEFAULT_SITE_URL,
	getSiteUrl,
	getSocialDataCredentials,
} from "@/shared/lib/env";
import { log } from "@/shared/lib/log";
import { SITE_UI_LOCALE } from "@/shared/lib/site";
import {
	blogParamFromExpandedUrl,
	readTweetCardTitle,
	renderTweetText,
	siteHostsFromOrigins,
	type TweetCard,
	type TweetUrlEntity,
	urlsKeptInTweet,
} from "../tweet-text";

/**
 * Data Cache TTL for SocialData. The homepage stays dynamic because of the
 * CSP nonce, so `cache: "no-store"` would call this paid API on every visit.
 * An explicit revalidate still caches the response when Authorization is set.
 * Same window as the Contentful pages.
 */
export const X_FEED_REVALIDATE_SECONDS = 60;

type SocialDataUrl = {
	url?: string;
	expanded_url?: string;
	display_url?: string;
};

type SocialDataTweet = {
	tweet_created_at?: string;
	full_text?: string;
	id_str?: string;
	entities?: { urls?: SocialDataUrl[] };
	card?: TweetCard;
};

type LabeledTweetUrl = TweetUrlEntity & { label: string };

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

function plainLabel(url: TweetUrlEntity): string {
	return url.displayUrl?.trim() || url.expandedUrl?.trim() || url.url;
}

/**
 * Own-site articles use the Contentful title (same slug cache as the blog).
 * The last external link uses the tweet card title when SocialData sends one.
 */
export async function labelTweetUrls(
	fullText: string,
	urls: SocialDataUrl[] | undefined,
	cardTitle: string | undefined,
): Promise<LabeledTweetUrl[]> {
	const entities = (urls ?? [])
		.map((url) => ({
			url: url.url?.trim() ?? "",
			expandedUrl: url.expanded_url?.trim(),
			displayUrl: url.display_url?.trim(),
		}))
		.filter((url) => url.url && fullText.includes(url.url));

	const hosts = siteHostsFromOrigins([getSiteUrl(), DEFAULT_SITE_URL]);
	const titles = new Map<string, string>();
	const visible = new Set(urlsKeptInTweet(fullText, entities));
	const params = [
		...new Set(
			entities
				.filter((url) => visible.has(url))
				.map((url) => blogParamFromExpandedUrl(url.expandedUrl, hosts))
				.filter((param): param is string => Boolean(param)),
		),
	];

	await Promise.all(
		params.map(async (param) => {
			try {
				const resolved = await blogService.resolveBlogPost(param);
				if (resolved.status === "not_found") return;
				const title = resolved.post.title.trim();
				if (title) titles.set(param, title);
			} catch (error) {
				unstable_rethrow(error);
				log.error("socialdata.post_title_failed", {
					message: error instanceof Error ? error.message : "unknown",
				});
			}
		}),
	);

	return entities.map((url, index) => {
		const param = blogParamFromExpandedUrl(url.expandedUrl, hosts);
		const postTitle = param ? titles.get(param) : undefined;
		const isLast = index === entities.length - 1;
		const label =
			postTitle ||
			(!param && isLast ? cardTitle : undefined) ||
			plainLabel(url);
		return { ...url, label };
	});
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
			log.error("socialdata.fetch_failed", { status: response.status });
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
			log.warn("socialdata.user_missing", { user });
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
			const tweets: SocialDataTweet[] = Array.isArray(results?.tweets)
				? results.tweets
				: [];
			const postprocessedResults = (
				await Promise.all(
					tweets.map(async (tweet) => {
						const fullText = tweet.full_text ?? "";
						const urls = await labelTweetUrls(
							fullText,
							tweet.entities?.urls,
							readTweetCardTitle(tweet.card),
						);
						return {
							date: formatTweetDate(tweet.tweet_created_at),
							text: renderTweetText(fullText, urls),
							id: tweet.id_str,
						};
					}),
				)
			).filter(
				(
					tweet,
				): tweet is {
					date: { hour: string; day: string };
					text: string;
					id: string;
				} => Boolean(tweet.text && tweet.id),
			);
			return postprocessedResults;
		} catch (error) {
			log.error("socialdata.postprocess_failed", {
				message: error instanceof Error ? error.message : "unknown",
			});
			return [];
		}
	}
}

const socialDataXService = new SocialDataXService();
export default socialDataXService;
