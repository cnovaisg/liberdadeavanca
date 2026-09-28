import {
	documentToReactComponents,
	type Options,
} from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types";
import type { ReactNode } from "react";
import {
	type Document,
	isExternalHttpHref,
	sanitizeRichTextHref,
} from "@/shared/lib/contentful/rich-text";

const paragraphClassName =
	"hyphens-auto font-geist prose prose-sm prose-zinc font-[500]";

const headingClassName: Record<string, string> = {
	[BLOCKS.HEADING_1]: "font-anton text-3xl text-emerald-900 tracking-wide",
	[BLOCKS.HEADING_2]: "font-anton text-2xl text-emerald-800 tracking-wide",
	[BLOCKS.HEADING_3]: "font-anton text-xl text-emerald-800 tracking-wide",
	[BLOCKS.HEADING_4]: "font-anton text-lg text-emerald-700 tracking-wide",
	[BLOCKS.HEADING_5]: "font-anton text-base text-emerald-700 tracking-wide",
	[BLOCKS.HEADING_6]:
		"font-anton text-sm text-emerald-700 tracking-widest uppercase",
};

const listClassName =
	"ps-5 space-y-2 font-geist text-zinc-800 marker:text-emerald-700";

const linkClassName =
	"text-emerald-700 underline decoration-emerald-700/40 underline-offset-2 hover:text-emerald-900 transition-colors duration-500 ease-in-out";

const heading =
	(tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6", className: string) =>
	(_node: unknown, children: ReactNode) => {
		const Tag = tag;
		return <Tag className={className}>{children}</Tag>;
	};

function RichTextAnchor({
	uri,
	children,
}: {
	uri: unknown;
	children: ReactNode;
}) {
	const href = sanitizeRichTextHref(uri);
	if (!href) {
		return <span>{children}</span>;
	}

	if (isExternalHttpHref(href)) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={linkClassName}
			>
				{children}
			</a>
		);
	}

	return (
		<a href={href} className={linkClassName}>
			{children}
		</a>
	);
}

const richTextOptions: Options = {
	renderMark: {
		[MARKS.BOLD]: (text) => <strong className="font-semibold">{text}</strong>,
		[MARKS.ITALIC]: (text) => <em>{text}</em>,
		[MARKS.UNDERLINE]: (text) => <u>{text}</u>,
		[MARKS.CODE]: (text) => (
			<code className="font-mono text-[0.9em] bg-zinc-100 px-1 py-0.5 rounded-sm text-zinc-800">
				{text}
			</code>
		),
	},
	renderNode: {
		[BLOCKS.PARAGRAPH]: (_node, children) => (
			<p lang="pt" className={paragraphClassName}>
				{children}
			</p>
		),
		[BLOCKS.HEADING_1]: heading("h1", headingClassName[BLOCKS.HEADING_1]),
		[BLOCKS.HEADING_2]: heading("h2", headingClassName[BLOCKS.HEADING_2]),
		[BLOCKS.HEADING_3]: heading("h3", headingClassName[BLOCKS.HEADING_3]),
		[BLOCKS.HEADING_4]: heading("h4", headingClassName[BLOCKS.HEADING_4]),
		[BLOCKS.HEADING_5]: heading("h5", headingClassName[BLOCKS.HEADING_5]),
		[BLOCKS.HEADING_6]: heading("h6", headingClassName[BLOCKS.HEADING_6]),
		[BLOCKS.UL_LIST]: (_node, children) => (
			<ul className={`list-disc ${listClassName}`}>{children}</ul>
		),
		[BLOCKS.OL_LIST]: (_node, children) => (
			<ol className={`list-decimal ${listClassName}`}>{children}</ol>
		),
		[BLOCKS.LIST_ITEM]: (_node, children) => (
			<li className="ps-1">{children}</li>
		),
		[BLOCKS.QUOTE]: (_node, children) => (
			<blockquote className="border-s-2 border-emerald-700 ps-4 font-geist italic text-zinc-700">
				{children}
			</blockquote>
		),
		[BLOCKS.HR]: () => <hr className="border-0 border-t border-zinc-200" />,
		[INLINES.HYPERLINK]: (node, children) => (
			<RichTextAnchor uri={(node.data as { uri?: unknown }).uri}>
				{children}
			</RichTextAnchor>
		),
		[INLINES.ENTRY_HYPERLINK]: (_node, children) => <span>{children}</span>,
		[INLINES.ASSET_HYPERLINK]: (_node, children) => <span>{children}</span>,
		[INLINES.RESOURCE_HYPERLINK]: (_node, children) => <span>{children}</span>,
		[INLINES.EMBEDDED_ENTRY]: () => null,
		[INLINES.EMBEDDED_RESOURCE]: () => null,
		[BLOCKS.EMBEDDED_ENTRY]: () => null,
		[BLOCKS.EMBEDDED_ASSET]: () => null,
		[BLOCKS.EMBEDDED_RESOURCE]: () => null,
	},
};

type RichTextProps = {
	document: Document | null | undefined;
};

/** Renders a Contentful document with the article type scale. No raw HTML. */
const RichText = ({ document }: RichTextProps) => {
	if (!document || document.content.length === 0) return null;

	return (
		<div className="flex flex-col space-y-3">
			{documentToReactComponents(document, richTextOptions)}
		</div>
	);
};

export default RichText;
