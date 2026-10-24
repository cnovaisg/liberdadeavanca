import { describe, expect, it } from "vitest";
import { getSiteUrl } from "@/shared/lib/env";
import robots from "./robots";

describe("robots", () => {
	it("aponta para /sitemap.xml", () => {
		expect(robots().sitemap).toBe(`${getSiteUrl()}/sitemap.xml`);
	});
});
