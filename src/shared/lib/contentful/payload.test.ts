import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	parseContentfulEntriesPayload,
	parseContentfulTagsPayload,
} from "./payload";

describe("parseContentfulEntriesPayload", () => {
	let errorLog: ReturnType<typeof vi.spyOn> | undefined;
	let warnLog: ReturnType<typeof vi.spyOn> | undefined;

	beforeEach(() => {
		errorLog?.mockRestore();
		warnLog?.mockRestore();
		errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
		warnLog = vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	it("keeps well-formed entries and drops the rest", () => {
		const parsed = parseContentfulEntriesPayload<{ sys: { id: string } }>(
			{
				items: [
					{ sys: { id: "post-1" }, fields: { title: "Olá" } },
					{ sys: { id: "" }, fields: {} },
					{ not: "an entry" },
				],
			},
			"blogPost",
		);

		expect(parsed?.items).toEqual([
			{ sys: { id: "post-1" }, fields: { title: "Olá" } },
		]);
		expect(JSON.stringify(warnLog?.mock.calls)).toContain(
			"contentful.response_invalid",
		);
	});

	it("preserva o total da colecção", () => {
		const parsed = parseContentfulEntriesPayload(
			{
				total: 42,
				items: [{ sys: { id: "post-1" }, fields: { title: "Olá" } }],
			},
			"blogPost",
		);

		expect(parsed?.total).toBe(42);
	});

	it("ignora um total que não seja um inteiro", () => {
		const parsed = parseContentfulEntriesPayload(
			{
				total: "42",
				items: [{ sys: { id: "post-1" }, fields: {} }],
			},
			"blogPost",
		);

		expect(parsed?.items).toHaveLength(1);
		expect(parsed?.total).toBeUndefined();
	});

	it("returns null for an unusable envelope", () => {
		expect(parseContentfulEntriesPayload([], "blogPost")).toBeNull();
		expect(JSON.stringify(errorLog?.mock.calls)).toContain(
			"contentful.response_invalid",
		);
	});
});

describe("parseContentfulTagsPayload", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	it("keeps valid tags and skips broken ones", () => {
		expect(
			parseContentfulTagsPayload({
				items: [
					{ sys: { id: "economia" }, name: "Economia" },
					{ sys: { id: "sem-nome" } },
				],
			}),
		).toEqual([{ id: "economia", name: "Economia" }]);
	});

	it("returns null when the catalog envelope is unusable", () => {
		expect(parseContentfulTagsPayload(["economia"])).toBeNull();
	});

	it("returns null when every tag is unusable", () => {
		expect(
			parseContentfulTagsPayload({ items: [{ name: "sem id" }] }),
		).toBeNull();
	});
});
