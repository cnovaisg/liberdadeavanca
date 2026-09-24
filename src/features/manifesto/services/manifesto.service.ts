import { resolveAuthors } from "@/shared/lib/contentful/authors";
import { fetchContentfulEntries } from "@/shared/lib/contentful/client";
import { parseRichTextField } from "@/shared/lib/contentful/rich-text";
import type { ManifestoEntryType, PrunedManifestoEntryType } from "../types";

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
