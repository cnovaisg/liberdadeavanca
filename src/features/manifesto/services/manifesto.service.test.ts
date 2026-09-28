import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/contentful/client", () => ({
	fetchContentfulEntries: vi.fn(),
}));

import { fetchContentfulEntries } from "@/shared/lib/contentful/client";
import manifestoService from "./manifesto.service";

const entry = {
	sys: {
		id: "manifesto-1",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-02T00:00:00.000Z",
		revision: 1,
	},
	fields: {
		title: "Manifesto",
		subtitle: "Em defesa da sociedade civil",
		intro: {
			nodeType: "document",
			data: {},
			content: [
				{
					nodeType: "paragraph",
					data: {},
					content: [
						{ nodeType: "text", value: "Introdução.", marks: [], data: {} },
					],
				},
			],
		},
		manifestoContent: {
			nodeType: "document",
			data: {},
			content: [
				{
					nodeType: "paragraph",
					data: {},
					content: [{ nodeType: "text", value: "Corpo.", marks: [], data: {} }],
				},
			],
		},
		authors: [{ name: "Carlos", role: "Autor", imageUrl: "/a.png" }],
	},
};

describe("ManifestoService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("devolve null quando não há entradas", async () => {
		vi.mocked(fetchContentfulEntries).mockResolvedValue({ items: [] });
		await expect(manifestoService.getManifesto()).resolves.toBeNull();
	});

	it("poda o manifesto e normaliza rich text", async () => {
		vi.mocked(fetchContentfulEntries).mockResolvedValue({
			items: [entry],
		});

		const manifesto = await manifestoService.getManifesto();

		expect(manifesto).toMatchObject({
			title: "Manifesto",
			subtitle: "Em defesa da sociedade civil",
			authors: [{ name: "Carlos", role: "Autor", imageUrl: "/a.png" }],
		});
		expect(manifesto?.intro?.nodeType).toBe("document");
		expect(manifesto?.value?.nodeType).toBe("document");
	});

	it("propaga falhas da API", async () => {
		vi.mocked(fetchContentfulEntries).mockRejectedValue(
			new Error("Contentful API error: 500"),
		);
		await expect(manifestoService.getManifesto()).rejects.toThrow(
			"Contentful API error: 500",
		);
	});
});
