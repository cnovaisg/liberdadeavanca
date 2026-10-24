import { describe, expect, it } from "vitest";
import { formatPtDate, SITE_UI_LOCALE } from "./site";

describe("SITE_UI_LOCALE", () => {
	it("keeps the site UI locale in Portuguese", () => {
		expect(SITE_UI_LOCALE).toBe("pt-PT");
	});

	it("formata a data do artigo em pt-PT", () => {
		expect(formatPtDate("2026-03-15T12:00:00.000Z").replace(/\s+/g, " ")).toBe(
			"15 de março de 2026",
		);
		expect(formatPtDate("não é data")).toBe("");
	});
});
