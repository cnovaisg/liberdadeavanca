import { ImageResponse } from "next/og";
import { ShareCard } from "./card";
import { OG_IMAGE_SIZE, type ShareCardCopy } from "./copy";
import { loadShareFonts } from "./fonts";

export async function renderShareImage(copy: ShareCardCopy) {
	return new ImageResponse(<ShareCard copy={copy} />, {
		...OG_IMAGE_SIZE,
		fonts: await loadShareFonts(),
	});
}
