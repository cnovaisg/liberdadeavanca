import { afterEach, describe, expect, it, vi } from "vitest";
import { X_FEED_CACHE_TAG, X_FEED_REVALIDATE_SECONDS } from "./x.cache";
import { formatTweetDate } from "./x.service";

describe("formatTweetDate", () => {
	it("formata em Europe/Lisbon, não em UTC", () => {
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

describe("SocialDataXService", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	const loadService = async () => {
		vi.stubEnv("SOCIAL_DATA_X_ACCOUNT", "liberdadeavanca");
		vi.stubEnv("SOCIAL_DATA_BASE_URL", "https://api.socialdata.tools");
		vi.stubEnv("SOCIAL_DATA_API_KEY", "test-key");
		vi.resetModules();
		const mod = await import("./x.service");
		return mod.default;
	};

	it("revalida o feed e degrada quando a API falha", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 503,
			json: async () => {
				throw new Error("não devia ler o corpo");
			},
		});
		vi.stubGlobal("fetch", fetchMock);

		const service = await loadService();
		await expect(service.getPostprocessedXfeed()).resolves.toEqual([]);
		expect(fetchMock).toHaveBeenCalled();

		const init = fetchMock.mock.calls[0]?.[1] as RequestInit & {
			next?: { revalidate?: number; tags?: string[] };
		};
		expect(init.cache).not.toBe("no-store");
		expect(init.next).toEqual({
			revalidate: X_FEED_REVALIDATE_SECONDS,
			tags: [X_FEED_CACHE_TAG],
		});
	});

	it("devolve o post com hora de Lisboa quando a pesquisa tem tweets", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				tweets: [
					{
						full_text: "olá",
						id_str: "1",
						tweet_created_at: "2026-07-15T12:00:00.000Z",
					},
				],
			}),
		});
		vi.stubGlobal("fetch", fetchMock);

		const service = await loadService();
		await expect(service.getPostprocessedXfeed()).resolves.toEqual([
			{
				date: { hour: "13:00", day: "15/07" },
				text: "olá",
				id: "1",
			},
		]);
		expect(fetchMock).toHaveBeenCalledOnce();
	});
});
