import { describe, expect, it } from "vitest";
import { CONTENTFUL_ID_PATTERN, isContentfulId } from "./ids";

describe("isContentfulId", () => {
	it("accepts typical Contentful entry ids", () => {
		expect(isContentfulId("3S1ZJyfph0EEUqABNWBx9Q")).toBe(true);
		expect(isContentfulId("impostos")).toBe(true);
		expect(isContentfulId("a_b-c1")).toBe(true);
	});

	it("rejects path traversal and empty values", () => {
		expect(isContentfulId("../evil")).toBe(false);
		expect(isContentfulId("")).toBe(false);
		expect(isContentfulId("has space")).toBe(false);
		expect(isContentfulId("a".repeat(65))).toBe(false);
	});

	it("matches the documented pattern", () => {
		expect(CONTENTFUL_ID_PATTERN.test("ok_id-1")).toBe(true);
	});
});
