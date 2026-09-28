import { describe, expect, it } from "vitest";
import { buildTagMap, resolveEntryTags } from "./tags";

describe("buildTagMap", () => {
	it("maps tag ids to display names", () => {
		const map = buildTagMap([
			{ id: "economia", name: "Economia" },
			{ id: "imigrao", name: "Imigração" },
		]);
		expect(map.get("economia")).toBe("Economia");
		expect(map.get("imigrao")).toBe("Imigração");
	});
});

describe("resolveEntryTags", () => {
	const names = buildTagMap([{ id: "economia", name: "Economia" }]);

	it("returns empty when there are no links", () => {
		expect(resolveEntryTags(undefined, names)).toEqual([]);
		expect(resolveEntryTags([], names)).toEqual([]);
	});

	it("resolves known ids and falls back to the id for unknowns", () => {
		expect(
			resolveEntryTags(
				[{ sys: { id: "economia" } }, { sys: { id: "outro" } }],
				names,
			),
		).toEqual([
			{ id: "economia", name: "Economia" },
			{ id: "outro", name: "outro" },
		]);
	});

	it("deduplicates repeated links", () => {
		expect(
			resolveEntryTags(
				[{ sys: { id: "economia" } }, { sys: { id: "economia" } }],
				names,
			),
		).toEqual([{ id: "economia", name: "Economia" }]);
	});
});
