import { BLOCKS, type Document } from "@contentful/rich-text-types";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PrunedBlogPostType } from "@/features/blog/types";
import BlogPost from "@/features/blog/ui/blog-post.page";
import type { PrunedManifestoEntryType } from "@/features/manifesto/types";
import Manifesto from "@/features/manifesto/ui/manifesto.page";
import type { Author } from "@/shared/lib/author";
import Authors from "./authors";

const emptyDocument = {
	nodeType: BLOCKS.DOCUMENT,
	data: {},
	content: [],
} as Document;

const carlos: Author = { name: "Carlos", role: "Autor" };
const ana: Author = { name: "Ana", role: "Autora" };

function post(authors: Author[]): PrunedBlogPostType {
	return {
		id: "post-1",
		title: "Impostos",
		publishedAt: "2026-05-04T00:00:00.000Z",
		createdAt: "2026-05-04T00:00:00.000Z",
		updatedAt: "2026-05-05T00:00:00.000Z",
		revision: 1,
		authors,
		tags: [],
		value: emptyDocument,
	};
}

function manifesto(authors: Author[]): PrunedManifestoEntryType {
	return {
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-02-01T00:00:00.000Z",
		revision: 1,
		title: "Manifesto",
		subtitle: "Em defesa da sociedade civil",
		intro: null,
		value: emptyDocument,
		authors,
	};
}

const html = (element: Parameters<typeof renderToStaticMarkup>[0]) =>
	renderToStaticMarkup(element);

describe("etiqueta de autores", () => {
	it("usa o singular com um autor e o plural com mais do que um", () => {
		const singular = html(createElement(Authors, { authors: [carlos] }));
		expect(singular).toContain("autor:");
		expect(singular).not.toContain("autores:");

		const plural = html(createElement(Authors, { authors: [carlos, ana] }));
		expect(plural).toContain("autores:");
		expect(plural).toContain("Carlos e Ana");

		expect(html(createElement(Authors, { authors: [] }))).toContain("autores:");
	});

	it("o artigo e o manifesto usam a mesma etiqueta", () => {
		expect(html(createElement(BlogPost, { post: post([carlos]) }))).toContain(
			"autor:",
		);
		expect(
			html(createElement(BlogPost, { post: post([carlos, ana]) })),
		).toContain("autores:");

		expect(
			html(createElement(Manifesto, { manifesto: manifesto([carlos]) })),
		).toContain("autor:");
		expect(
			html(createElement(Manifesto, { manifesto: manifesto([carlos, ana]) })),
		).toContain("autores:");
	});
});
