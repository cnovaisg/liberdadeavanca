import {
	BLOCKS,
	type Document,
	INLINES,
	MARKS,
} from "@contentful/rich-text-types";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RichText from "@/shared/ui/components/rich-text/rich-text";
import { richTextExcerpt, sanitizeRichTextHref } from "./rich-text";

const text = (value: string, mark?: (typeof MARKS)[keyof typeof MARKS]) => ({
	nodeType: "text" as const,
	value,
	marks: mark ? [{ type: mark }] : [],
	data: {},
});

const paragraph = (
	content: Document["content"][number]["content"],
): Document["content"][number] => ({
	nodeType: BLOCKS.PARAGRAPH,
	data: {},
	content,
});

const document = (content: Document["content"]): Document => ({
	nodeType: BLOCKS.DOCUMENT,
	data: {},
	content,
});

const hyperlink = (uri: string, label: string) => ({
	nodeType: INLINES.HYPERLINK,
	data: { uri },
	content: [text(label)],
});

const renderDocument = (content: Document["content"]) =>
	renderToStaticMarkup(
		createElement(RichText, { document: document(content) }) as ReactElement,
	);

const visibleText = (html: string) =>
	html
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();

describe("sanitizeRichTextHref", () => {
	it("aceita http, https e mailto", () => {
		expect(sanitizeRichTextHref("https://exemplo.pt/artigo")).toBe(
			"https://exemplo.pt/artigo",
		);
		expect(sanitizeRichTextHref("http://exemplo.pt")).toBe(
			"http://exemplo.pt/",
		);
		expect(sanitizeRichTextHref("mailto:ola@exemplo.pt")).toBe(
			"mailto:ola@exemplo.pt",
		);
	});

	it("rejeita javascript: e outros protocolos", () => {
		expect(sanitizeRichTextHref("javascript:alert(1)")).toBeNull();
		expect(sanitizeRichTextHref("JaVaScRiPt:alert(1)")).toBeNull();
		expect(sanitizeRichTextHref(" javascript:alert(1)")).toBeNull();
		expect(sanitizeRichTextHref("java\tscript:alert(1)")).toBeNull();
		expect(sanitizeRichTextHref("data:text/html,hi")).toBeNull();
		expect(sanitizeRichTextHref("/blog")).toBeNull();
		expect(sanitizeRichTextHref("//exemplo.pt")).toBeNull();
	});
});

describe("RichText", () => {
	it("preserva o texto das hiperligações", () => {
		const content = [
			paragraph([
				text("Ver "),
				hyperlink("https://exemplo.pt", "ligação"),
				text(" hoje."),
			]),
		];
		const html = renderDocument(content);

		expect(visibleText(html)).toBe("Ver ligação hoje.");
		expect(html).toContain('href="https://exemplo.pt/"');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer"');
		expect(richTextExcerpt(document(content))).toBe("Ver ligação hoje.");
	});

	it("abre mailto sem target _blank", () => {
		const html = renderDocument([
			paragraph([hyperlink("mailto:ola@exemplo.pt", "correio")]),
		]);

		expect(html).toContain('href="mailto:ola@exemplo.pt"');
		expect(html).not.toContain("target=");
		expect(html).not.toContain("noopener");
		expect(visibleText(html)).toBe("correio");
	});

	it("rejeita javascript: e mantém o texto visível", () => {
		const html = renderDocument([
			paragraph([
				text("Ver "),
				hyperlink("javascript:alert(1)", "ligação"),
				text(" hoje."),
			]),
		]);

		expect(visibleText(html)).toBe("Ver ligação hoje.");
		expect(html).not.toMatch(/<a\b/i);
		expect(html).not.toMatch(/javascript:/i);
	});

	it("renderiza listas ordenadas e não ordenadas com os itens", () => {
		const item = (label: string) => ({
			nodeType: BLOCKS.LIST_ITEM,
			data: {},
			content: [paragraph([text(label)])],
		});
		const html = renderDocument([
			{
				nodeType: BLOCKS.UL_LIST,
				data: {},
				content: [item("Primeiro"), item("Segundo")],
			},
			{
				nodeType: BLOCKS.OL_LIST,
				data: {},
				content: [item("Terceiro")],
			},
		]);

		expect(html).toContain("<ul");
		expect(html).toContain("<ol");
		expect(html).toContain("<li");
		expect(html).toContain("Primeiro");
		expect(html).toContain("Segundo");
		expect(html).toContain("Terceiro");
	});

	it.each([
		[BLOCKS.HEADING_1, "h1"],
		[BLOCKS.HEADING_2, "h2"],
		[BLOCKS.HEADING_3, "h3"],
		[BLOCKS.HEADING_4, "h4"],
		[BLOCKS.HEADING_5, "h5"],
		[BLOCKS.HEADING_6, "h6"],
	] as const)("renderiza %s como <%s> e não como parágrafo", (nodeType, tag) => {
		const html = renderDocument([
			{
				nodeType,
				data: {},
				content: [text("Título")],
			},
		]);

		expect(html).toContain(`<${tag}`);
		expect(html).toContain("Título");
		expect(html).not.toContain("<p");
	});

	it("renderiza negrito, itálico, sublinhado e código", () => {
		const html = renderDocument([
			paragraph([
				text("forte", MARKS.BOLD),
				text(" "),
				text("inclinado", MARKS.ITALIC),
				text(" "),
				text("traço", MARKS.UNDERLINE),
				text(" "),
				text("mono", MARKS.CODE),
			]),
		]);

		expect(html).toContain("<strong");
		expect(html).toContain("<em");
		expect(html).toContain("<u");
		expect(html).toContain("<code");
		expect(visibleText(html)).toBe("forte inclinado traço mono");
	});
});
