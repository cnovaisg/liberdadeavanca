export type TweetUrlEntity = {
	/** Short link as it appears in `full_text` (`https://t.co/…`). */
	url: string;
	expandedUrl?: string;
	displayUrl?: string;
};

export type TweetCard = {
	title?: unknown;
	binding_values?: unknown;
	legacy?: { binding_values?: unknown };
};

const TITLE_KEYS = new Set(["title"]);

function readBindingTitle(bindings: unknown): string | undefined {
	if (!Array.isArray(bindings)) return undefined;

	for (const item of bindings) {
		if (!item || typeof item !== "object") continue;
		const record = item as {
			key?: unknown;
			value?: { string_value?: unknown } | unknown;
		};
		if (typeof record.key !== "string" || !TITLE_KEYS.has(record.key)) {
			continue;
		}
		const value = record.value;
		const title =
			value && typeof value === "object" && "string_value" in value
				? value.string_value
				: value;
		if (typeof title === "string" && title.trim()) return title.trim();
	}

	return undefined;
}

/** Card headline, when SocialData includes one. Missing cards stay undefined. */
export function readTweetCardTitle(
	card: TweetCard | undefined,
): string | undefined {
	if (!card) return undefined;
	if (typeof card.title === "string" && card.title.trim()) {
		return card.title.trim();
	}
	return (
		readBindingTitle(card.binding_values) ??
		readBindingTitle(card.legacy?.binding_values)
	);
}

/**
 * `/blog/<slug>` on this site. Other paths, including external links, return
 * undefined so the caller can fall back to the card title or `display_url`.
 */
export function blogParamFromExpandedUrl(
	expandedUrl: string | undefined,
	siteHosts: ReadonlySet<string>,
): string | undefined {
	if (!expandedUrl) return undefined;

	let url: URL;
	try {
		url = new URL(expandedUrl);
	} catch {
		return undefined;
	}

	if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;

	const host = url.hostname.toLowerCase().replace(/^www\./, "");
	if (!siteHosts.has(host)) return undefined;

	const path = url.pathname.replace(/\/+$/, "");
	const match = /^\/blog\/([^/]+)$/.exec(path);
	if (!match) return undefined;

	try {
		const segment = decodeURIComponent(match[1]).trim();
		return segment || undefined;
	} catch {
		return undefined;
	}
}

export function siteHostsFromOrigins(origins: string[]): Set<string> {
	const hosts = new Set<string>();
	for (const origin of origins) {
		try {
			hosts.add(new URL(origin).hostname.toLowerCase().replace(/^www\./, ""));
		} catch {
			// Ignore a malformed origin. The default site URL still matches.
		}
	}
	return hosts;
}

function collapse(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function withoutUrl(text: string, url: string): string {
	const at = text.lastIndexOf(url);
	if (at === -1) return text;
	return text.slice(0, at) + text.slice(at + url.length);
}

/** URLs that remain visible. The trailing t.co is a card when other text exists. */
export function urlsKeptInTweet<T extends TweetUrlEntity>(
	fullText: string,
	urls: T[],
): T[] {
	const present = urls.filter(
		(item) => item.url && fullText.includes(item.url),
	);
	const prose = collapse(
		present.reduce((text, item) => text.split(item.url).join(" "), fullText),
	);
	return prose ? present.slice(0, -1) : present;
}

/**
 * Link-only tweets become the post title, the card title, or `display_url`.
 * When the tweet also has prose, the trailing t.co is the card and is dropped.
 */
export function renderTweetText(
	fullText: string,
	urls: Array<TweetUrlEntity & { label: string }>,
): string {
	const present = urls.filter(
		(item) => item.url && fullText.includes(item.url),
	);
	if (present.length === 0) return fullText.trim();

	const prose = collapse(
		present.reduce((text, item) => text.split(item.url).join(" "), fullText),
	);

	if (prose) {
		const last = present[present.length - 1];
		let text = withoutUrl(fullText, last.url);
		for (const item of present.slice(0, -1)) {
			text = text.split(item.url).join(item.label);
		}
		return collapse(text);
	}

	let text = fullText;
	for (const item of present) {
		text = text.split(item.url).join(item.label);
	}
	return collapse(text);
}
