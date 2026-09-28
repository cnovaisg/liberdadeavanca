import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/env", () => ({
	getSocialDataCredentials: () => ({
		account: "aLibAvancaPT",
		baseUrl: "https://api.socialdata.tools",
		apiKey: "test-key",
	}),
}));

import socialDataXService, {
	formatTweetDate,
	X_FEED_REVALIDATE_SECONDS,
} from "./x.service";

describe("SocialData X feed cache", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("revalidates SocialData fetches on a TTL instead of opting out of cache", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					tweets: [
						{
							tweet_created_at: "2026-09-28T10:00:00.000Z",
							full_text: "olá",
							id_str: "1",
						},
					],
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const posts = await socialDataXService.getPostprocessedXfeed();

		expect(posts).toEqual([
			{
				date: { hour: "11:00", day: "28/09" },
				text: "olá",
				id: "1",
			},
		]);
		expect(fetchMock).toHaveBeenCalledOnce();

		const [url, init] = fetchMock.mock.calls[0] ?? [];
		expect(String(url)).toBe(
			"https://api.socialdata.tools/twitter/search?query=from%3AaLibAvancaPT&type=Latest",
		);
		expect(init).toMatchObject({
			method: "GET",
			headers: {
				Authorization: "Bearer test-key",
				Accept: "application/json",
			},
			next: { revalidate: X_FEED_REVALIDATE_SECONDS },
		});
		expect(init).not.toHaveProperty("cache");
		expect(X_FEED_REVALIDATE_SECONDS).toBe(60);
	});
});

describe("formatTweetDate", () => {
	it("formata em Europe/Lisbon", () => {
		expect(formatTweetDate("2026-07-15T12:00:00.000Z")).toEqual({
			hour: "13:00",
			day: "15/07",
		});
		expect(formatTweetDate("2026-07-15T23:30:00.000Z")).toEqual({
			hour: "00:30",
			day: "16/07",
		});
		expect(formatTweetDate("2026-01-15T00:30:00.000Z")).toEqual({
			hour: "00:30",
			day: "15/01",
		});
	});

	it("não produz NaN quando a data falta ou é inválida", () => {
		const fallback = { hour: "—", day: "—" };
		expect(formatTweetDate(undefined)).toEqual(fallback);
		expect(formatTweetDate("")).toEqual(fallback);
		expect(formatTweetDate("não é uma data")).toEqual(fallback);
		expect(JSON.stringify(formatTweetDate("não é uma data"))).not.toContain(
			"NaN",
		);
	});
});
