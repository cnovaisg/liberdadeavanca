import type { Metadata } from "next";
import { getSiteUrl } from "@/shared/lib/env";

export const SITE_NAME = "Liberdade Avança";

export const SITE_DESCRIPTION =
	"Movimento Liberdade Avança: em defesa da sociedade civil.";

/** Child titles render as «Página · Liberdade Avança». */
export const SITE_TITLE_TEMPLATE = `%s · ${SITE_NAME}`;

/** Open Graph locale uses an underscore (`pt_PT`), not the BCP 47 tag. */
export const SITE_OG_LOCALE = "pt_PT";

export const RSS_PATH = "/rss.xml";

export function rootMetadata(): Metadata {
	const siteUrl = getSiteUrl();

	return {
		metadataBase: new URL(siteUrl),
		title: {
			default: SITE_NAME,
			template: SITE_TITLE_TEMPLATE,
		},
		description: SITE_DESCRIPTION,
		alternates: {
			types: {
				"application/rss+xml": [
					{
						title: SITE_NAME,
						url: `${siteUrl}${RSS_PATH}`,
					},
				],
			},
		},
		openGraph: {
			type: "website",
			locale: SITE_OG_LOCALE,
			siteName: SITE_NAME,
			title: SITE_NAME,
			description: SITE_DESCRIPTION,
			url: siteUrl,
		},
		twitter: {
			card: "summary",
			title: SITE_NAME,
			description: SITE_DESCRIPTION,
		},
	};
}

type PageMetadataInput = {
	title: string;
	description: string;
	canonicalPath: string;
	openGraphType?: "website" | "article";
	publishedTime?: string;
	modifiedTime?: string;
	previous?: string;
	next?: string;
};

export function pageMetadata(input: PageMetadataInput): Metadata {
	const { title, description, canonicalPath } = input;
	const pagination =
		input.previous || input.next
			? {
					...(input.previous ? { previous: input.previous } : {}),
					...(input.next ? { next: input.next } : {}),
				}
			: undefined;

	const shared = {
		title,
		description,
		url: canonicalPath,
		siteName: SITE_NAME,
		locale: SITE_OG_LOCALE,
	};

	const openGraph =
		input.openGraphType === "article"
			? {
					...shared,
					type: "article" as const,
					...(input.publishedTime
						? { publishedTime: input.publishedTime }
						: {}),
					...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
				}
			: {
					...shared,
					type: "website" as const,
				};

	return {
		title,
		description,
		alternates: { canonical: canonicalPath },
		openGraph,
		twitter: {
			card: "summary",
			title,
			description,
		},
		...(pagination ? { pagination } : {}),
	};
}
