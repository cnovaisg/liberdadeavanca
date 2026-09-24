type SocialDataTweet = {
	tweet_created_at?: string;
	full_text?: string;
	id_str?: string;
};

class SocialDataXService {
	private getConfig() {
		const user = process.env.SOCIAL_DATA_X_ACCOUNT?.replace(/^@/, "");
		const apiBaseUrl = process.env.SOCIAL_DATA_BASE_URL?.replace(/\/$/, "");
		const token = process.env.SOCIAL_DATA_API_KEY;

		if (!user || !apiBaseUrl || !token) {
			return null;
		}

		const twitterRoot = apiBaseUrl.endsWith("/twitter")
			? apiBaseUrl
			: `${apiBaseUrl}/twitter`;

		return {
			user,
			twitterRoot,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		};
	}

	private async getJson(url: string, headers: { [key: string]: string }) {
		const response = await fetch(url, {
			method: "GET",
			headers,
			cache: "no-store",
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
						const rawDate = tweet.tweet_created_at;
						const date = rawDate ? new Date(rawDate) : new Date(Number.NaN);
						const hours = date.getHours().toString().padStart(2, "0");
						const minutes = date.getMinutes().toString().padStart(2, "0");
						const day = date.getDate().toString().padStart(2, "0");
						const month = (date.getMonth() + 1).toString().padStart(2, "0");
						const parsedDate = {
							hour: `${hours}:${minutes}`,
							day: `${day}/${month}`,
						};

						return {
							date: parsedDate,
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
