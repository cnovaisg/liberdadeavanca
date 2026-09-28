import { afterEach, describe, expect, it } from "vitest";
import { getContentfulLocale, SITE_UI_LOCALE } from "./locale";

describe("contentful locale helpers", () => {
	const original = process.env.CONTENTFUL_LOCALE;

	afterEach(() => {
		if (original === undefined) {
			delete process.env.CONTENTFUL_LOCALE;
		} else {
			process.env.CONTENTFUL_LOCALE = original;
		}
	});

	it("keeps the site UI locale in Portuguese", () => {
		expect(SITE_UI_LOCALE).toBe("pt-PT");
	});

	it("defaults Contentful queries to en-US", () => {
		delete process.env.CONTENTFUL_LOCALE;
		expect(getContentfulLocale()).toBe("en-US");
	});

	it("honours CONTENTFUL_LOCALE when set", () => {
		process.env.CONTENTFUL_LOCALE = "pt-PT";
		expect(getContentfulLocale()).toBe("pt-PT");
	});
});
