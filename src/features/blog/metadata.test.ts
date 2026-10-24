import { BLOCKS, type Document } from "@contentful/rich-text-types";
import { describe, expect, it } from "vitest";
import {
	articleMetadata,
	blogIndexMetadata,
	blogTagMetadata,
} from "./metadata";

const document = {
	nodeType: BLOCKS.DOCUMENT,
	data: {},
	content: [
		{
			nodeType: BLOCKS.PARAGRAPH,
			data: {},
			content: [
				{
					nodeType: "text",
					value: "Excerto do artigo.",
					marks: [],
					data: {},
				},
			],
		},
	],
} as Document;

describe("metadados do blog", () => {
	it("marca o artigo como article com canonical no slug", () => {
		const metadata = articleMetadata({
			id: "abc123",
			slug: "impostos-justos",
			title: "Impostos",
			summary: "Um resumo",
			publishedAt: "2026-05-04T00:00:00.000Z",
			updatedAt: "2026-05-05T00:00:00.000Z",
			value: document,
		});

		expect(metadata.title).toBe("Impostos");
		expect(metadata.description).toBe("Um resumo");
		expect(metadata.alternates?.canonical).toBe("/blog/impostos-justos");
		expect(metadata.openGraph).toMatchObject({
			type: "article",
			publishedTime: "2026-05-04T00:00:00.000Z",
			url: "/blog/impostos-justos",
		});
		expect(metadata.twitter).toMatchObject({
			card: "summary_large_image",
			title: "Impostos",
			description: "Um resumo",
		});
		expect(
			metadata.openGraph && "images" in metadata.openGraph
				? metadata.openGraph.images
				: undefined,
		).toBeUndefined();
	});

	it("usa o excerto quando o artigo antigo não tem summary", () => {
		const metadata = articleMetadata({
			id: "abc123",
			title: "Sem resumo",
			publishedAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-02T00:00:00.000Z",
			value: document,
		});

		expect(metadata.description).toBe("Excerto do artigo.");
		expect(metadata.alternates?.canonical).toBe("/blog/abc123");
	});

	it("põe a página da listagem e da etiqueta no canonical", () => {
		expect(blogIndexMetadata({ page: 1, totalPages: 3 })).toMatchObject({
			title: "Blog",
			alternates: { canonical: "/blog" },
			pagination: { next: "/blog?page=2" },
		});
		expect(blogIndexMetadata({ page: 2, totalPages: 3 })).toMatchObject({
			title: "Blog — página 2",
			alternates: { canonical: "/blog?page=2" },
			pagination: { previous: "/blog", next: "/blog?page=3" },
		});
		expect(
			blogTagMetadata({
				tagId: "economia",
				tagName: "Economia",
				page: 2,
				totalPages: 2,
			}),
		).toMatchObject({
			title: "Economia — página 2",
			alternates: { canonical: "/blog/tag/economia?page=2" },
			pagination: { previous: "/blog/tag/economia" },
		});
	});
});
