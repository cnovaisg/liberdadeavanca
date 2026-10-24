import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_URL } from "@/shared/lib/env";
import { postShareCard, siteShareCard } from "./copy";
import { brandIcon } from "./icon-mark";
import { renderShareImage } from "./image";

async function pngSize(response: Response) {
	const bytes = new Uint8Array(await response.arrayBuffer());
	expect(bytes[0]).toBe(0x89);
	expect(bytes[1]).toBe(0x50);
	expect(bytes[2]).toBe(0x4e);
	expect(bytes[3]).toBe(0x47);
	const width = new DataView(bytes.buffer).getUint32(16);
	const height = new DataView(bytes.buffer).getUint32(20);
	return { width, height, bytes };
}

describe("imagens geradas", () => {
	it("o cartão do site e o do artigo são PNG 1200×630", async () => {
		const site = await renderShareImage(siteShareCard(DEFAULT_SITE_URL));
		expect(site.headers.get("content-type")).toContain("image/png");
		await expect(pngSize(site)).resolves.toMatchObject({
			width: 1200,
			height: 630,
		});

		const postCopy = postShareCard("Impostos justos", DEFAULT_SITE_URL);
		expect(postCopy).not.toBeNull();
		if (!postCopy) return;
		const post = await renderShareImage(postCopy);
		await expect(pngSize(post)).resolves.toMatchObject({
			width: 1200,
			height: 630,
		});
	});

	it("o ícone e o apple icon são PNG quadrados", async () => {
		const icon = await brandIcon(32);
		expect(icon.headers.get("content-type")).toContain("image/png");
		await expect(pngSize(icon)).resolves.toMatchObject({
			width: 32,
			height: 32,
		});

		const apple = await brandIcon(180);
		await expect(pngSize(apple)).resolves.toMatchObject({
			width: 180,
			height: 180,
		});
	});
});
