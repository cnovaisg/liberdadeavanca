/** BCP 47 locale for the public UI (`<html lang>`, dates, copy). */
export const SITE_UI_LOCALE = "pt-PT";

/** Calendar day in Portugal, lowercase, independent of the server timezone. */
export function formatPtDate(value: string): string {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "";

	return parsed
		.toLocaleDateString(SITE_UI_LOCALE, {
			day: "numeric",
			month: "long",
			year: "numeric",
			timeZone: "Europe/Lisbon",
		})
		.toLowerCase();
}
