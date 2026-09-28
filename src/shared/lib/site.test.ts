import { describe, expect, it } from "vitest";
import { SITE_UI_LOCALE } from "./site";

describe("SITE_UI_LOCALE", () => {
	it("keeps the site UI locale in Portuguese", () => {
		expect(SITE_UI_LOCALE).toBe("pt-PT");
	});
});
