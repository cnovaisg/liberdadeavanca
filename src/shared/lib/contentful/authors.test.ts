import { describe, expect, it } from "vitest";
import { resolveAuthors } from "./authors";

describe("resolveAuthors", () => {
	it("returns an empty list when authors are missing", () => {
		expect(resolveAuthors(undefined)).toEqual([]);
		expect(resolveAuthors([])).toEqual([]);
	});

	it("resolves linked authors from includes", () => {
		const authors = resolveAuthors(
			[{ sys: { id: "author1", type: "Link", linkType: "Entry" } }],
			{
				Entry: [
					{
						sys: { id: "author1" },
						fields: {
							name: "Carlos Novais",
							role: "Editor",
							imageUrl: "https://example.com/a.jpg",
						},
					},
				],
			},
		);

		expect(authors).toEqual([
			{
				name: "Carlos Novais",
				role: "Editor",
				imageUrl: "https://example.com/a.jpg",
			},
		]);
	});

	it("keeps inline author objects", () => {
		expect(
			resolveAuthors([
				{
					name: "Ana",
					role: "Autora",
					imageUrl: "https://example.com/b.jpg",
					contact: "ana@example.com",
				},
			]),
		).toEqual([
			{
				name: "Ana",
				role: "Autora",
				imageUrl: "https://example.com/b.jpg",
			},
		]);
	});
});
