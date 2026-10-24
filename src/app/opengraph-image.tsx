import { getSiteUrl } from "@/shared/lib/env";
import {
	OG_IMAGE_CONTENT_TYPE,
	OG_IMAGE_SIZE,
	SHARE_SITE_ALT,
	siteShareCard,
} from "@/shared/og/copy";
import { renderShareImage } from "@/shared/og/image";

export const alt = SHARE_SITE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

/** Inherited by home, /blog, /manifesto and tag pages. */
export default function Image() {
	return renderShareImage(siteShareCard(getSiteUrl()));
}
