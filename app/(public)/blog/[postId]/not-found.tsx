import Link from "next/link";

export const metadata = {
	title: "Artigo não encontrado",
};

const BlogPostNotFound = () => {
	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-5">
				<h1 className="text-5xl text-emerald-900 tracking-wider font-anton">
					ARTIGO NÃO ENCONTRADO
				</h1>
				<p className="font-geist text-zinc-700">
					Este artigo não existe ou já não está publicado.
				</p>
				<Link
					href="/blog"
					className="font-anton text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-500 ease-in-out w-fit"
				>
					← VOLTAR AO BLOG
				</Link>
			</div>
		</div>
	);
};

export default BlogPostNotFound;
