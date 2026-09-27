import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Per-request CSP nonce (Next.js 16 Proxy).
 * @see https://nextjs.org/docs/app/guides/content-security-policy
 */
export function proxy(request: NextRequest) {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const isDev = process.env.NODE_ENV === "development";

	// Scripts: nonce + strict-dynamic (no unsafe-inline). unsafe-eval only in dev.
	// Styles: keep unsafe-inline — Motion and style attributes need it; XSS risk is mainly scripts.
	const cspHeader = `
		default-src 'self';
		script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
		style-src 'self' 'unsafe-inline';
		img-src 'self' data: blob: https://res.cloudinary.com;
		font-src 'self' data:;
		connect-src 'self';
		object-src 'none';
		base-uri 'self';
		form-action 'self';
		frame-ancestors 'none';
		upgrade-insecure-requests;
	`;

	const contentSecurityPolicyHeaderValue = cspHeader
		.replace(/\s{2,}/g, " ")
		.trim();

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);
	requestHeaders.set(
		"Content-Security-Policy",
		contentSecurityPolicyHeaderValue,
	);

	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
	response.headers.set(
		"Content-Security-Policy",
		contentSecurityPolicyHeaderValue,
	);

	return response;
}

export const config = {
	matcher: [
		{
			source:
				"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
