import { resolveAuthors } from "@/shared/lib/contentful/authors";
import { fetchContentfulEntries } from "@/shared/lib/contentful/client";
import { getContentfulLocale } from "@/shared/lib/contentful/locale";
import { parseRichTextField } from "@/shared/lib/contentful/rich-text";
import type { ManifestoEntryType, PrunedManifestoEntryType } from "../types";
import {
	MANIFESTO_CACHE_TAG,
	MANIFESTO_REVALIDATE_SECONDS,
} from "./manifesto.cache";

const manifestoCache: NextFetchRequestConfig = {
	revalidate: MANIFESTO_REVALIDATE_SECONDS,
	tags: [MANIFESTO_CACHE_TAG],
};

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
				locale: getContentfulLocale(),
				limit: "1",
				include: "2",
			},
			next: manifestoCache,
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
