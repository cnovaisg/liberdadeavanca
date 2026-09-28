import { env } from "@/shared/lib/env";

/**
 * Contentful Delivery locale used in API queries.
 *
 * The space currently stores content under the default locale `en-US`
 * (even though the site UI is Portuguese — see `SITE_UI_LOCALE` in
 * `@/shared/lib/site`). Override with `CONTENTFUL_LOCALE` if you add /
 * switch locales in Contentful.
 */
const DEFAULT_CONTENTFUL_LOCALE = "en-US";

export function getContentfulLocale(): string {
	const fromEnv = env.CONTENTFUL_LOCALE?.trim();
	return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_CONTENTFUL_LOCALE;
}
