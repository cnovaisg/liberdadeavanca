import Link from "next/link";
import blogService from "../services/blog.service";
import type { BlogTag } from "../types";
import PostSummary from "./subcomponents/post-summary";

type BlogProps = {
	tagId?: string;
};

const clearFilterClassName =
	"font-anton text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-500 ease-in-out w-fit";

const TagFilterNotice = ({ tag }: { tag: BlogTag | null }) => {
	return (
		<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
			<div className="flex space-x-1 font-geist font-bold text-xs">
				<div className="small-caps text-zinc-500 tracking-widest">
					etiqueta:
				</div>
				<div className="text-zinc-700">{tag?.name ?? "desconhecida"}</div>
			</div>
			<Link href="/blog" className={clearFilterClassName}>
				<span className="font-geist">←</span> LIMPAR FILTRO
			</Link>
		</div>
	);
};

const emptyFilterMessage = (tag: BlogTag | null) => {
	if (tag?.name) {
		return `Nenhum artigo com a etiqueta «${tag.name}».`;
	}
	return "Nenhum artigo com esta etiqueta.";
};

const Blog = async ({ tagId }: BlogProps) => {
	const filtered = await (tagId
		? blogService.getPostsByTag(tagId)
		: Promise.resolve(null));
	const posts = filtered
		? filtered.posts
		: await blogService.getLatestBlogPosts(20);
	const [featured, ...rest] = posts;

	if (!featured) {
		return (
			<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
				<div className="pt-8 flex flex-col space-y-3">
					<h1 className="text-5xl text-emerald-900 tracking-wider font-anton">
						BLOG
					</h1>
					{tagId ? <TagFilterNotice tag={filtered?.tag ?? null} /> : null}
					<p className="font-geist text-zinc-700">
						{tagId
							? emptyFilterMessage(filtered?.tag ?? null)
							: "Ainda não há artigos publicados."}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-10 pb-10">
				{tagId ? <TagFilterNotice tag={filtered?.tag ?? null} /> : null}

				<PostSummary post={featured} featured />

				{rest.length > 0 ? (
					<div className="flex flex-col space-y-8">
						<h2 className="font-anton text-sm text-emerald-600 tracking-widest">
							MAIS ARTIGOS
						</h2>
						<ul className="flex flex-col divide-y divide-zinc-100">
							{rest.map((post) => (
								<li key={post.id} className="py-8 first:pt-0">
									<PostSummary post={post} />
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default Blog;
