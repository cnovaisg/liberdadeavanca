import { afterEach, describe, expect, it, vi } from "vitest";
import { log } from "./log";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("log", () => {
	it("emits structured JSON with a stable event name", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		log.error("contentful.fetch_failed", {
			status: 500,
			contentType: "blogPost",
		});
		expect(spy).toHaveBeenCalledTimes(1);
		const line = spy.mock.calls[0]?.[0];
		expect(typeof line).toBe("string");
		const parsed = JSON.parse(line as string);
		expect(parsed).toMatchObject({
			level: "error",
			event: "contentful.fetch_failed",
			status: 500,
			contentType: "blogPost",
		});
		expect(parsed.ts).toEqual(expect.any(String));
	});
});
