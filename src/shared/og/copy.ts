import { SITE_NAME } from "@/shared/lib/seo";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const OG_IMAGE_CONTENT_TYPE = "image/png";

/** Stable id so the post image URL does not depend on the title. */
export const OG_POST_IMAGE_ID = "card";

export const SHARE_SITE_ALT = "Liberdade Avança. Em defesa da sociedade civil.";

const TITLE_MAX_CODE_POINTS = 110;

export type ShareCardCopy = {
	variant: "site" | "post";
	kicker: string;
	title: string;
	subtitle?: string;
	footer: string;
	alt: string;
	titleSize: number;
};

export function siteHost(siteUrl: string): string {
	return new URL(siteUrl).host;
}

export function normalizeShareText(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

export function clipShareTitle(
	value: string,
	max = TITLE_MAX_CODE_POINTS,
): string {
	const normalized = normalizeShareText(value);
	const chars = [...normalized];
	if (chars.length <= max) return normalized;
	return `${chars
		.slice(0, max - 1)
		.join("")
		.trimEnd()}…`;
}

/** Anton is wide; shorter titles can be larger without leaving the card. */
export function shareTitleSize(title: string): number {
	const length = [...title].length;
	if (length <= 28) return 84;
	if (length <= 52) return 68;
	if (length <= 80) return 54;
	return 44;
}

export function siteShareCard(siteUrl: string): ShareCardCopy {
	return {
		variant: "site",
		kicker: "MOVIMENTO",
		title: "LIBERDADE AVANÇA",
		subtitle: "Em defesa da sociedade civil.",
		footer: siteHost(siteUrl),
		alt: SHARE_SITE_ALT,
		titleSize: 92,
	};
}

/** `null` when the title is blank, so the caller can use the site card. */
export function postShareCard(
	title: string,
	siteUrl: string,
): ShareCardCopy | null {
	const clipped = clipShareTitle(title);
	if (!clipped) return null;

	return {
		variant: "post",
		kicker: "LIBERDADE AVANÇA",
		title: clipped,
		footer: siteHost(siteUrl),
		alt: `${clipped} · ${SITE_NAME}`,
		titleSize: shareTitleSize(clipped),
	};
}
