import { resolveAuthors } from "@/shared/lib/contentful/authors";
import { fetchContentfulEntries } from "@/shared/lib/contentful/client";
import { parseRichTextField } from "@/shared/lib/contentful/rich-text";
import type {
	ContentfulAuthorField,
	ContentfulIncludes,
	ContentfulParagraph,
	ContentfulSys,
} from "@/shared/lib/contentful/types";

export type ManifestoEntryType = {
	sys: ContentfulSys;
	fields: {
		title: string;
		subtitle?: string;
		intro?: {
			content: Array<{
				content: Array<{ value: string }>;
			}>;
		};
		manifestoContent: {
			content: Array<{
				content: Array<{ value: string }>;
			}>;
		};
		authors?: ContentfulAuthorField[];
	};
	includes?: ContentfulIncludes;
};

export type PrunedManifestoEntryType = {
	createdAt: string;
	updatedAt: string;
	revision: number;
	title: string;
	subtitle?: string;
	intro: ContentfulParagraph[];
	value: ContentfulParagraph[];
	authors: Array<{ name: string; role: string; imageUrl: string }>;
};

const MANIFESTO_TTL = 0;

class ManifestoService {
	private pruneManifesto(
		manifesto: ManifestoEntryType | null,
	): PrunedManifestoEntryType | null {
		if (!manifesto) return null;

		const { createdAt, updatedAt, revision } = manifesto.sys;
		const { title, subtitle, intro, manifestoContent, authors } =
			manifesto.fields;

		return {
			createdAt,
			updatedAt,
			revision,
			title,
			subtitle,
			intro: parseRichTextField(intro),
			value: parseRichTextField(manifestoContent),
			authors: resolveAuthors(authors, manifesto.includes),
		};
	}

	async getManifesto(): Promise<PrunedManifestoEntryType | null> {
		const data = await fetchContentfulEntries<ManifestoEntryType>({
			contentType: "manifesto",
			searchParams: {
				limit: "1",
				include: "2",
			},
			next: { revalidate: MANIFESTO_TTL },
			cache: "no-store",
		});

		if (!data) return null;

		const manifesto = data.items[0];
		if (!manifesto) return null;

		return this.pruneManifesto({
			...manifesto,
			includes: data.includes,
		});
	}
}

const manifestoService = new ManifestoService();
export default manifestoService;
