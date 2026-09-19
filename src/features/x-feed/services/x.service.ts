class SocialDataXService {
	private readonly user: string;
	private readonly twitterRoot: string;
	private readonly headers: { [key: string]: string };

	constructor() {
		const USER = process.env.SOCIAL_DATA_X_ACCOUNT?.replace(/^@/, "");
		const API_BASE_URL = process.env.SOCIAL_DATA_BASE_URL?.replace(/\/$/, "");
		const TOKEN = process.env.SOCIAL_DATA_API_KEY;

		if (!USER || !API_BASE_URL || !TOKEN) {
			throw new Error("Missing SocialData X environment variables");
		}

		this.user = USER;
		this.twitterRoot = API_BASE_URL.endsWith("/twitter")
			? API_BASE_URL
			: `${API_BASE_URL}/twitter`;
		this.headers = {
			Authorization: `Bearer ${TOKEN}`,
			Accept: "application/json",
		};
	}

	private async getJson(url: string) {
		const response = await fetch(url, {
			method: "GET",
			headers: this.headers,
			cache: "no-store",
		});
		const data = await response.json();
		if (!response.ok) {
			console.error("X feed request failed", response.status);
		}
		return data;
	}

	private async getXfeed() {
		const query = encodeURIComponent(`from:${this.user}`);
		const search = await this.getJson(
			`${this.twitterRoot}/search?query=${query}&type=Latest`,
		);
		if (Array.isArray(search?.tweets) && search.tweets.length > 0) {
			return search;
		}

		const profile = await this.getJson(
			`${this.twitterRoot}/user/${this.user}`,
		);
		const userId = profile?.id_str ?? profile?.id;
		if (!userId) {
			console.error("X feed: no tweets from search and no user id");
			return { tweets: [] };
		}

		return this.getJson(`${this.twitterRoot}/user/${userId}/tweets`);
	}

	async getPostprocessedXfeed() {
		try {
			const results = await this.getXfeed();
			const postprocessedResults =
				results?.tweets
					?.map((tweet: any) => {
						const rawDate = tweet?.tweet_created_at;
						const date = new Date(rawDate);
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
							text: tweet?.full_text,
							id: tweet?.id_str,
						};
					})
					.filter((tweet: { text?: string; id?: string }) => tweet.text && tweet.id) ??
				[];
			return postprocessedResults;
		} catch (error) {
			console.error("Error postprocessing X feed:", error);
			throw error;
		}
	}
}

const socialDataXService = new SocialDataXService();
export default socialDataXService;
