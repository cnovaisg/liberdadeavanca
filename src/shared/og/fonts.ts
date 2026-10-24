import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type ShareFont = {
	name: string;
	data: ArrayBuffer;
	style: "normal";
	weight: 400;
};

const fontFiles = {
	Anton: "Anton-Regular.ttf",
	Geist: "Geist-Regular.ttf",
} as const;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
	return buffer.buffer.slice(
		buffer.byteOffset,
		buffer.byteOffset + buffer.byteLength,
	) as ArrayBuffer;
}

let fontsPromise: Promise<ShareFont[]> | undefined;

/** Anton (títulos) e Geist (texto), os mesmos tipos do site. Licença OFL em `assets/fonts`. */
export function loadShareFonts(): Promise<ShareFont[]> {
	fontsPromise ??= Promise.all(
		Object.entries(fontFiles).map(async ([name, file]) => {
			const buffer = await readFile(join(process.cwd(), "assets/fonts", file));
			return {
				name,
				data: toArrayBuffer(buffer),
				style: "normal" as const,
				weight: 400 as const,
			};
		}),
	);

	return fontsPromise;
}
