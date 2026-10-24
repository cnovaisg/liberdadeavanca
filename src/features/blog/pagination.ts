/** Twelve keeps the listing short without dropping below the requested range. */
export const BLOG_PAGE_SIZE = 12;

/** Stops a huge `?page=` from turning into an unbounded Contentful `skip`. */
export const BLOG_MAX_PAGE = 10_000;

export type BlogPageInfo = {
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
};

export type BlogPaginationLinks = {
	page: number;
	totalPages: number;
	/** Path without a `page` query: `/blog` or `/blog/tag/<id>`. */
	basePath: string;
};

/**
 * `undefined`, a blank value and a missing key are page 1.
 * Anything that is not a canonical positive integer (`2`, not `02` or `2.0`)
 * is rejected so the page can answer 404.
 */
export function parseBlogPageParam(
	value: string | string[] | undefined,
): number | null {
	if (value === undefined) return 1;
	const raw = Array.isArray(value) ? value[0] : value;
	if (raw === undefined) return 1;

	const trimmed = raw.trim();
	if (trimmed === "") return 1;
	if (!/^[1-9]\d*$/.test(trimmed)) return null;

	const page = Number(trimmed);
	if (!Number.isSafeInteger(page) || page < 1 || page > BLOG_MAX_PAGE) {
		return null;
	}
	return page;
}

export function totalPagesFor(
	total: number,
	pageSize = BLOG_PAGE_SIZE,
): number {
	if (!Number.isFinite(total) || total <= 0) return 1;
	return Math.ceil(total / pageSize);
}

export function listingPageState(
	total: number,
	page: number,
	pageSize = BLOG_PAGE_SIZE,
):
	| { status: "ok"; totalPages: number; skip: number }
	| { status: "out_of_range"; totalPages: number } {
	const totalPages = totalPagesFor(total, pageSize);
	if (page < 1 || page > totalPages) {
		return { status: "out_of_range", totalPages };
	}
	return { status: "ok", totalPages, skip: (page - 1) * pageSize };
}

/** Page 1 stays on the clean path so it does not duplicate `?page=1`. */
export function blogPageHref(basePath: string, page: number): string {
	if (page <= 1) return basePath;
	const separator = basePath.includes("?") ? "&" : "?";
	return `${basePath}${separator}page=${page}`;
}
