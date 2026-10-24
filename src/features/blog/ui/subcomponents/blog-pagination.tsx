import Link from "next/link";
import { type BlogPaginationLinks, blogPageHref } from "../../pagination";

const linkClassName =
	"font-anton text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-500 ease-in-out w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";

const disabledClassName = "font-anton text-sm text-zinc-400 w-fit";

const BlogPagination = ({
	pagination,
}: {
	pagination: BlogPaginationLinks;
}) => {
	if (pagination.totalPages <= 1) return null;

	const previous =
		pagination.page > 1
			? blogPageHref(pagination.basePath, pagination.page - 1)
			: null;
	const next =
		pagination.page < pagination.totalPages
			? blogPageHref(pagination.basePath, pagination.page + 1)
			: null;

	return (
		<nav
			aria-label="Paginação dos artigos"
			className="flex flex-wrap items-center gap-x-5 gap-y-2"
		>
			{previous ? (
				<Link href={previous} rel="prev" className={linkClassName}>
					<span className="font-geist">←</span> ANTERIOR
				</Link>
			) : (
				<span aria-disabled="true" className={disabledClassName}>
					<span className="font-geist">←</span> ANTERIOR
				</span>
			)}
			<p className="font-geist text-xs font-bold text-zinc-500 tracking-wide">
				Página {pagination.page} de {pagination.totalPages}
			</p>
			{next ? (
				<Link href={next} rel="next" className={linkClassName}>
					SEGUINTE <span className="font-geist">→</span>
				</Link>
			) : (
				<span aria-disabled="true" className={disabledClassName}>
					SEGUINTE <span className="font-geist">→</span>
				</span>
			)}
		</nav>
	);
};

export default BlogPagination;
