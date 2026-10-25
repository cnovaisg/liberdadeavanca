import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveBlogPost = vi.fn();

vi.mock("@/shared/lib/env", async () => {
	const actual =
		await vi.importActual<typeof import("@/shared/lib/env")>(
			"@/shared/lib/env",
		);
	return {
		...actual,
		getSocialDataCredentials: () => ({
			account: "aLibAvancaPT",
			baseUrl: "https://api.socialdata.tools",
			apiKey: "test-key",
		}),
	};
});

vi.mock("@/features/blog/services/blog.service", () => ({
	default: {
		resolveBlogPost: (...args: unknown[]) => resolveBlogPost(...args),
	},
}));

import socialDataXService, {
	formatTweetDate,
	X_FEED_REVALIDATE_SECONDS,
} from "./x.service";

const mileiTitle = "Milei e o mercado de arrendamento: menos lei, mais casas";

describe("SocialData X feed cache", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		resolveBlogPost.mockReset();
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
		expect(resolveBlogPost).not.toHaveBeenCalled();
	});

	it("substitui o t.co de um artigo pelo título do Contentful", async () => {
		resolveBlogPost.mockResolvedValue({
			status: "ok",
			post: { title: mileiTitle },
		});
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					tweets: [
						{
							tweet_created_at: "2026-10-25T05:27:19.000Z",
							id_str: "2114227285439967702",
							full_text: "https://t.co/FBPY5ggWcC",
							entities: {
								urls: [
									{
										url: "https://t.co/FBPY5ggWcC",
										expanded_url:
											"https://liberdadeavanca.vercel.app/blog/milei-e-o-mercado-de-arrendamento",
										display_url: "liberdadeavanca.vercel.app/blog/milei-e-o…",
									},
								],
							},
							card: {
								title: mileiTitle,
							},
						},
					],
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const posts = await socialDataXService.getPostprocessedXfeed();

		expect(posts.map((post) => post.text)).toEqual([mileiTitle]);
		expect(resolveBlogPost).toHaveBeenCalledWith(
			"milei-e-o-mercado-de-arrendamento",
		);
		expect(fetch).toHaveBeenCalledOnce();
	});

	it("mostra o título do cartão num link externo e tira o t.co final quando há texto", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					tweets: [
						{
							tweet_created_at: "2026-10-25T05:27:19.000Z",
							id_str: "2",
							full_text: "https://t.co/nyt1mes",
							entities: {
								urls: [
									{
										url: "https://t.co/nyt1mes",
										expanded_url:
											"https://www.nytimes.com/2026/10/25/world.html",
										display_url: "nytimes.com/…",
									},
								],
							},
							card: {
								legacy: {
									binding_values: [
										{
											key: "title",
											value: { string_value: "Argentina ends rent control" },
										},
									],
								},
							},
						},
						{
							tweet_created_at: "2026-10-25T05:27:19.000Z",
							id_str: "3",
							full_text: "A oferta voltou. https://t.co/card00",
							entities: {
								urls: [
									{
										url: "https://t.co/card00",
										expanded_url:
											"https://liberdadeavanca.vercel.app/blog/milei-e-o-mercado-de-arrendamento",
										display_url: "liberdadeavanca.vercel.app/blog/milei-e-o…",
									},
								],
							},
						},
					],
				}),
				{ status: 200, headers: { "content-type": "application/json" } },
			),
		);

		const posts = await socialDataXService.getPostprocessedXfeed();

		expect(posts.map((post) => post.text)).toEqual([
			"Argentina ends rent control",
			"A oferta voltou.",
		]);
		expect(resolveBlogPost).not.toHaveBeenCalled();
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
