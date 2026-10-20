import { createHmac } from "node:crypto";
import { escape as qsEscape } from "node:querystring";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	CONTENTFUL_SIGNING_SECRET_PATTERN,
	parseContentfulSigningSecrets,
	verifyContentfulWebhookRequest,
} from "./webhook-signature";

const sign = (
	secret: string,
	method: string,
	path: string,
	headers: Record<string, string>,
	body: string,
	timestampMs: number,
) => {
	const names = new Set(Object.keys(headers));
	names.add("x-contentful-signed-headers");
	names.add("x-contentful-timestamp");
	const signedHeadersList = [...names]
		.sort((a, b) => (a > b ? 1 : -1))
		.join(",");
	const headersForSign = {
		...headers,
		"x-contentful-timestamp": String(timestampMs),
		"x-contentful-signed-headers": signedHeadersList,
	};
	const stringified = Object.entries(headersForSign)
		.sort(([a], [b]) => (a > b ? 1 : -1))
		.map(([k, v]) => `${k}:${v}`)
		.join(";");
	const [pathname, search] = path.split("?");
	const escaped = search ? qsEscape(search) : "";
	const normPath = encodeURI(escaped ? `${pathname}?${escaped}` : pathname);
	const canonical = [method, normPath, stringified, body].join("\n");
	return {
		signature: createHmac("sha256", secret)
			.update(canonical, "utf8")
			.digest("hex"),
		headersForSign,
	};
};

describe("verifyContentfulWebhookRequest", () => {
	const secret = "a".repeat(64);

	it("accepts a well-formed signed request", () => {
		expect(CONTENTFUL_SIGNING_SECRET_PATTERN.test(secret)).toBe(true);
		const method = "POST";
		const path = "/api/revalidate";
		const body = JSON.stringify({ sys: { id: "abc" } });
		const timestamp = Date.now();
		const base = {
			"content-type": "application/vnd.contentful.management.v1+json",
			"x-contentful-timestamp": String(timestamp),
		};
		const { signature, headersForSign } = sign(
			secret,
			method,
			path,
			base,
			body,
			timestamp,
		);
		const headers = new Headers({
			...headersForSign,
			"x-contentful-signature": signature,
		});

		expect(
			verifyContentfulWebhookRequest({
				secrets: [secret],
				method,
				path,
				headers,
				rawBody: body,
			}),
		).toEqual({ ok: true });
	});

	it("rejects a tampered body", () => {
		const method = "POST";
		const path = "/api/revalidate";
		const body = "{}";
		const timestamp = Date.now();
		const base = {
			"content-type": "application/json",
			"x-contentful-timestamp": String(timestamp),
		};
		const { signature, headersForSign } = sign(
			secret,
			method,
			path,
			base,
			body,
			timestamp,
		);
		const headers = new Headers({
			...headersForSign,
			"x-contentful-signature": signature,
		});

		expect(
			verifyContentfulWebhookRequest({
				secrets: [secret],
				method,
				path,
				headers,
				rawBody: `${body} `,
			}).ok,
		).toBe(false);
	});

	describe("timestamp window", () => {
		const now = new Date("2026-06-01T12:00:00.000Z");

		afterEach(() => {
			vi.useRealTimers();
		});

		const signedAt = (timestamp: number) => {
			const method = "POST";
			const path = "/api/revalidate";
			const body = "{}";
			const base = {
				"content-type": "application/json",
				"x-contentful-timestamp": String(timestamp),
			};
			const { signature, headersForSign } = sign(
				secret,
				method,
				path,
				base,
				body,
				timestamp,
			);
			return verifyContentfulWebhookRequest({
				secrets: [secret],
				method,
				path,
				headers: new Headers({
					...headersForSign,
					"x-contentful-signature": signature,
				}),
				rawBody: body,
			});
		};

		it("accepts a timestamp a few seconds in the future", () => {
			vi.useFakeTimers();
			vi.setSystemTime(now);
			expect(signedAt(now.getTime() + 2_000)).toEqual({ ok: true });
		});

		it("rejects a timestamp at or beyond the TTL in the future", () => {
			vi.useFakeTimers();
			vi.setSystemTime(now);
			expect(signedAt(now.getTime() + 60_000)).toEqual({
				ok: false,
				reason: "Contentful signature timestamp outside the allowed window",
			});
		});

		it("rejects a timestamp older than the TTL", () => {
			vi.useFakeTimers();
			vi.setSystemTime(now);
			expect(signedAt(now.getTime() - 60_000)).toEqual({
				ok: false,
				reason: "Contentful signature timestamp outside the allowed window",
			});
		});
	});
});

describe("parseContentfulSigningSecrets", () => {
	it("splits comma-separated secrets for rotation", () => {
		expect(parseContentfulSigningSecrets("  aaa,bbb  ")).toEqual([
			"aaa",
			"bbb",
		]);
		expect(parseContentfulSigningSecrets(undefined)).toEqual([]);
	});
});
