import ArticleInfo from "@/shared/ui/sections/article-info/article-info.section";
import Paragraphs from "@/shared/ui/sections/paragraphs/paragraphs.section";
import type { PrunedManifestoEntryType } from "../types";

type ManifestoProps = {
	manifesto: PrunedManifestoEntryType | null;
};

const Manifesto = ({ manifesto }: ManifestoProps) => {
	if (!manifesto) {
		return (
			<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
				<div className="pt-8 flex flex-col space-y-3">
					<h1 className="text-5xl text-emerald-900 tracking-wider font-anton">
						MANIFESTO
					</h1>
					<p className="font-geist text-zinc-700">
						O manifesto ainda não está disponível.
					</p>
				</div>
			</div>
		);
	}

	const intro = manifesto.intro ?? [];
	const mainContent = manifesto.value ?? [];

	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-5 shrink-0">
				<div className="flex flex-col space-y-1 font-anton">
					<h1 className="text-5xl text-emerald-900 tracking-wider">
						{manifesto.title?.toUpperCase()}
					</h1>
					<h2 className="text-2xl text-emerald-700 tracking-wide">
						{manifesto.subtitle}
					</h2>
				</div>

				<ArticleInfo
					authors={manifesto.authors}
					createdAt={manifesto.createdAt}
					updatedAt={manifesto.updatedAt}
				/>
			</div>
			{intro.length > 0 ? (
				<div className="pt-8">
					<Paragraphs paragraphs={intro} />
				</div>
			) : null}
			<div className="flex pt-4 pb-10">
				<Paragraphs
					paragraphs={mainContent}
					initialDelay={intro.length > 0 ? 1 : 0}
				/>
			</div>
		</div>
	);
};

export default Manifesto;
