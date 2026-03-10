class SocialDataXService {

  private readonly baseUrl: string;
  private readonly headers: { [key: string]: string };
  private readonly EIGHT_HOUR_CACHE_TTL = 60 * 60 * 8;

  constructor() {
    const USER = process.env.SOCIAL_DATA_X_ACCOUNT;
    const API_BASE_URL = process.env.SOCIAL_DATA_BASE_URL;
    const TOKEN = process.env.SOCIAL_DATA_API_KEY;

    if (!USER || !API_BASE_URL || !TOKEN) {
      throw new Error("Missing SocialData X environment variables");
    }

    this.baseUrl = `${API_BASE_URL}/search?query=from:${USER}&type=Latest&limit=3`;
    this.headers = {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    };
  }

  private async getXfeed() {
    try {
      const response = await fetch(this.baseUrl, {
        method: "GET",
        headers: this.headers,
        next: { revalidate: this.EIGHT_HOUR_CACHE_TTL }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching X feed:", error);
      throw error;
    }
  }

  async getPostprocessedXfeed() {

    try {
      const results = await this.getXfeed();
      const postprocessedResults = results?.tweets?.map((tweet: any) => {
        const rawDate = tweet?.tweet_created_at;
        const postprocessedDate = new Date(rawDate).toLocaleString("pt-PT", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        return {
          date: postprocessedDate,
          text: tweet?.full_text
        };
      });
      return postprocessedResults;
    } catch (error) {
      console.error("Error postprocessing X feed:", error);
      throw error;
    }
  }
}

const socialDataXService = new SocialDataXService();
export default socialDataXService;