import { ImageResponse } from "next/og";
import { loadShareFonts } from "./fonts";

/** Square «LA» mark in emerald-900, the same green as the site titles. */
export async function brandIcon(size: number) {
	const fontSize = size <= 32 ? 15 : Math.round(size * 0.42);

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#064e3b",
				color: "#ffffff",
				fontFamily: "Anton",
				fontSize,
			}}
		>
			LA
		</div>,
		{
			width: size,
			height: size,
			fonts: await loadShareFonts(),
		},
	);
}
