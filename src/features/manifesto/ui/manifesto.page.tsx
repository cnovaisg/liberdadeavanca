import { hasRichText } from "@/shared/lib/contentful/rich-text";
import RichText from "@/shared/ui/components/rich-text/rich-text";
import ArticleInfo from "@/shared/ui/sections/article-info/article-info.section";
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

	const hasIntro = hasRichText(manifesto.intro);

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
			{hasIntro ? (
				<div className="pt-8">
					<RichText document={manifesto.intro} />
				</div>
			) : null}
			<div className={hasIntro ? "flex pt-4 pb-10" : "flex pt-8 pb-10"}>
				<RichText document={manifesto.value} />
			</div>
		</div>
	);
};

export default Manifesto;
