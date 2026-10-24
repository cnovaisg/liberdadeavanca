import { BLOCKS, type Document } from "@contentful/rich-text-types";
import { describe, expect, it } from "vitest";
import {
	blogPostDescription,
	blogPostSummaryText,
	canonicalBlogPath,
	normalizeBlogSlug,
	normalizeBlogSummary,
	readWebhookSlug,
	resolvePublishedAt,
} from "./fields";

const paragraph = (value: string): Document =>
	({
		nodeType: BLOCKS.DOCUMENT,
		data: {},
		content: [
			{
				nodeType: BLOCKS.PARAGRAPH,
				data: {},
				content: [{ nodeType: "text", value, marks: [], data: {} }],
			},
		],
	}) as Document;

describe("normalizeBlogSlug", () => {
	it("aceita kebab-case", () => {
		expect(normalizeBlogSlug("impostos-justos")).toBe("impostos-justos");
		expect(normalizeBlogSlug("  a1  ")).toBe("a1");
	});

	it("rejeita valores que não podem ir para o URL", () => {
		expect(normalizeBlogSlug(undefined)).toBeUndefined();
		expect(normalizeBlogSlug("")).toBeUndefined();
		expect(normalizeBlogSlug("Impostos")).toBeUndefined();
		expect(normalizeBlogSlug("foo--bar")).toBeUndefined();
		expect(normalizeBlogSlug("-foo")).toBeUndefined();
		expect(normalizeBlogSlug("foo-")).toBeUndefined();
		expect(normalizeBlogSlug("../etc")).toBeUndefined();
		expect(normalizeBlogSlug("foo bar")).toBeUndefined();
		expect(normalizeBlogSlug("a".repeat(81))).toBeUndefined();
	});
});

describe("canonicalBlogPath", () => {
	it("usa o slug quando existe e o id quando não existe", () => {
		expect(canonicalBlogPath({ id: "abc", slug: "ola-mundo" })).toBe(
			"/blog/ola-mundo",
		);
		expect(canonicalBlogPath({ id: "abc" })).toBe("/blog/abc");
		expect(canonicalBlogPath({ id: "abc", slug: "Não" })).toBe("/blog/abc");
	});
});

describe("resolvePublishedAt", () => {
	it("prefere o campo date e cai para firstPublishedAt e createdAt", () => {
		expect(
			resolvePublishedAt({
				date: "2026-05-04",
				firstPublishedAt: "2026-04-01T00:00:00.000Z",
				createdAt: "2026-01-01T00:00:00.000Z",
			}),
		).toBe("2026-05-04T00:00:00.000Z");

		expect(
			resolvePublishedAt({
				firstPublishedAt: "2026-04-01T08:30:00.000Z",
				createdAt: "2026-01-01T00:00:00.000Z",
			}),
		).toBe("2026-04-01T08:30:00.000Z");

		expect(
			resolvePublishedAt({
				date: "não é data",
				createdAt: "2026-01-01T00:00:00.000Z",
			}),
		).toBe("2026-01-01T00:00:00.000Z");
	});

	it("rejeita dias de calendário impossíveis", () => {
		expect(
			resolvePublishedAt({ date: "2026-02-31", createdAt: "2026-01-02" }),
		).toBe("2026-01-02T00:00:00.000Z");
	});
});

describe("summary", () => {
	it("normaliza espaços e corta a 300 caracteres", () => {
		expect(normalizeBlogSummary("  uma\nlinha  ")).toBe("uma linha");
		expect(normalizeBlogSummary("")).toBeUndefined();
		const long = "á".repeat(301);
		expect(Array.from(normalizeBlogSummary(long) ?? "").length).toBe(300);
	});

	it("na listagem usa o excerto quando não há summary", () => {
		expect(
			blogPostSummaryText({
				value: paragraph("Primeiro parágrafo."),
			}),
		).toBe("Primeiro parágrafo.");
		expect(
			blogPostSummaryText({
				summary: "Resumo curto",
				value: paragraph("Primeiro parágrafo."),
			}),
		).toBe("Resumo curto");
	});

	it("a description prefere o summary ao excerto", () => {
		expect(
			blogPostDescription({
				summary: "Resumo",
				subtitle: "Subtítulo",
				value: paragraph("Excerto"),
			}),
		).toBe("Resumo");
		expect(
			blogPostDescription({
				subtitle: "Subtítulo",
				value: paragraph("Excerto"),
			}),
		).toBe("Excerto");
	});
});

describe("readWebhookSlug", () => {
	it("lê slug simples, localizado e inválido", () => {
		expect(readWebhookSlug({ slug: "ola-mundo" }, "en-US")).toBe("ola-mundo");
		expect(
			readWebhookSlug({ slug: { "en-US": "impostos-justos" } }, "en-US"),
		).toBe("impostos-justos");
		expect(
			readWebhookSlug({ slug: { "pt-PT": "so-um-locale" } }, "en-US"),
		).toBe("so-um-locale");
		expect(
			readWebhookSlug(
				{ slug: { "en-US": "ingles", "pt-PT": "portugues" } },
				"en-US",
			),
		).toBe("ingles");
		expect(readWebhookSlug({ slug: { "en-US": "Não Vale" } }, "en-US")).toBe(
			undefined,
		);
		expect(readWebhookSlug({ slug: "../etc" }, "en-US")).toBeUndefined();
		expect(readWebhookSlug(null, "en-US")).toBeUndefined();
	});
});
