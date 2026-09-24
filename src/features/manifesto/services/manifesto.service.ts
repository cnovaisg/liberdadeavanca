import { getContentfulConfig } from "@/shared/lib/contentful/config";

export type ManifestoEntryType = {
	sys: {
		id: string;
		createdAt: string;
		updatedAt: string;
		revision: number;
	};
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

		authors?: Array<
			| { sys: { id: string; type?: string; linkType?: string } }
			| { name: string; role: string; imageUrl: string }
		>;
	};

	includes?: {
		Entry?: Array<{
			sys: { id: string };
			fields: { name: string; role: string; imageUrl: string };
		}>;
	};
};

export type PrunedManifestoEntryType = {
	createdAt: string;
	updatedAt: string;
	revision: number;

	title: string;
	subtitle?: string;

	intro: Array<{ paragraph: string }>;
	value: Array<{ paragraph: string }>;

	authors: Array<{ name: string; role: string; imageUrl: string }>;
};

const MANIFESTO_TTL = 0;

class ManifestoService {
	private resolveAuthors(entry: ManifestoEntryType) {
		const linkedEntries = entry.includes?.Entry ?? [];
		if (!entry.fields?.authors) return [];

		const authors = entry.fields.authors
			.map((author) => {
				if (
					"sys" in author &&
					author.sys?.type === "Link" &&
					author.sys.linkType === "Entry"
				) {
					const linked = linkedEntries.find((e) => e.sys.id === author.sys.id);
					return linked?.fields ?? null;
				}

				if ("name" in author && "role" in author && "imageUrl" in author)
					return author;

				return null;
			})
			.filter(Boolean) as Array<{
			name: string;
			role: string;
			imageUrl: string;
		}>;

		return authors;
	}

	private parseRichTextField(field?: {
		content: Array<{ content: Array<{ value: string }> }>;
	}) {
		return (
			field?.content?.flatMap((paragraph) =>
				paragraph.content
					.map((node) => node.value)
					.join("")
					.split(/\n+/)
					.filter(Boolean)
					.map((text) => ({ paragraph: text.trim() })),
			) ?? []
		);
	}

	private pruneManifesto(manifesto: ManifestoEntryType | null) {
		if (!manifesto) return null;

		const { createdAt, updatedAt, revision } = manifesto.sys;
		const {
			title,
			subtitle,
			intro: rawIntro,
			manifestoContent,
		} = manifesto.fields;

		const intro = this.parseRichTextField(rawIntro);
		const value = this.parseRichTextField(manifestoContent);
		const authors = this.resolveAuthors(manifesto);

		return {
			createdAt,
			updatedAt,
			revision,
			title,
			subtitle,
			intro,
			value,
			authors,
		};
	}

	async getManifesto(): Promise<PrunedManifestoEntryType | null> {
		const config = getContentfulConfig();
		if (!config) {
			return null;
		}

		const url = `${config.baseUrl}/entries?content_type=manifesto&limit=1&include=2`;
		const response = await fetch(url, {
			headers: config.headers,
			next: { revalidate: MANIFESTO_TTL },
			cache: "no-store",
		});

		if (!response.ok)
			throw new Error(
				`Contentful API error: ${response.status} ${response.statusText}`,
			);

		const data = await response.json();
		const manifesto = data.items?.[0];
		if (!manifesto) return null;
		const prunedManifesto = this.pruneManifesto({
			...manifesto,
			includes: data.includes,
		});

		return prunedManifesto;
	}
}

const manifestoService = new ManifestoService();
export default manifestoService;
