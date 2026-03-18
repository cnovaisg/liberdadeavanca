import { Suspense, use } from "react";
import manifestoService from "@/src/features/manifesto/services/manifesto.service";
import Articleinfo from "../../sections/article-info/article-info";
import Paragraphs from "../../sections/paragraphs/paragraphs";

const manifestoPromise = manifestoService.getManifesto();
const ManifestoContent = () => {
	const manifesto = use(manifestoPromise);
	const authors = manifesto?.authors;
	const introContent = manifesto?.intro;
	const mainContent = manifesto?.value;

	return (
		<div className="flex flex-col space-y-5 w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 font-anton flex flex-col space-y-2">
				<h1 className="text-5xl text-zinc-900 tracking-wider">
					{manifesto?.title?.toUpperCase()}
				</h1>
				<h2 className="text-2xl text-zinc-700 tracking-wide">
					{manifesto?.subtitle}
				</h2>
				<Articleinfo
					authors={authors ?? []}
					createdAt={manifesto?.createdAt as string}
					updatedAt={manifesto?.updatedAt as string}
				/>
			</div>
			<div className="pt-4">
				<Paragraphs paragraphs={introContent!} className="italic" />
			</div>
			<div className="pt-4">
				<Paragraphs paragraphs={mainContent!} />
			</div>
		</div>
	);
};

const Manifesto = () => {
	return (
		<Suspense fallback={<div>loading</div>}>
			<ManifestoContent />
		</Suspense>
	);
};

export default Manifesto;
