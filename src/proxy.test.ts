import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

const matcher = config.matcher[0];

describe("proxy e imagens de metadados", () => {
	it("mantém img-src e continua a aplicar-se às rotas sem extensão", () => {
		expect(matcher.source).toContain("favicon.ico");
		expect(matcher.source).not.toContain("opengraph-image");

		const matches = getPathMatch(matcher.source, { strict: true });
		expect(matches("/opengraph-image")).not.toBe(false);
		expect(matches("/twitter-image")).not.toBe(false);
		expect(matches("/icon")).not.toBe(false);
		expect(matches("/apple-icon")).not.toBe(false);
		expect(
			matches("/blog/impostos-justos/opengraph-image-abc123/card"),
		).not.toBe(false);
		expect(matches("/favicon.ico")).toBe(false);
		expect(matches("/images/path.png")).toBe(false);

		const csp =
			proxy(
				new NextRequest(
					"https://liberdadeavanca.vercel.app/blog/impostos-justos/opengraph-image",
				),
			).headers.get("content-security-policy") ?? "";
		expect(csp).toContain("img-src 'self' data: blob:");
		expect(csp).not.toContain("ctfassets.net");
	});
});
