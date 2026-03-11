import manifestoService from "@/src/features/manifesto/services/manifesto.service";
import { Suspense, use } from "react";

const manifestoPromise = manifestoService.getManifesto();
const ManifestoContent = () => {
	const manifesto = use(manifestoPromise);
	const content = manifesto?.value;

	const parsedPublicationDate = new Date(
		manifesto?.createdAt as string,
	).toLocaleDateString("pt-PT", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const parsedRevisionDate = new Date(
		manifesto?.updatedAt as string,
	).toLocaleDateString("pt-PT", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-5 font-anton shrink-0">
				<div className="flex flex-col space-y-1">
					<h1 className="text-5xl text-emerald-900 tracking-wider">
						{manifesto?.title?.toUpperCase()}
					</h1>
					<h2 className="text-2xl text-emerald-700 tracking-wide">
						{manifesto?.subtitle}
					</h2>
				</div>

				<div className="flex flex-col">
					<div className="flex flex-col space-x-2">
						<div>Autores</div>
						<div className="flex space-x-5">
							<div className="flex space-x-1 text-zinc-700 font-geist font-bold text-xs">
								<div className="small-caps tracking-widest text-zinc-500">
									criado:
								</div>
								<div>{parsedPublicationDate.toLowerCase()}</div>
							</div>
							<div className="flex space-x-1 text-zinc-700 font-geist font-bold text-xs">
								<div className="small-caps text-zinc-500 tracking-widest">
									revisto:
								</div>
								<div>{parsedRevisionDate.toLowerCase()}</div>
							</div>
							<div className="flex space-x-1 text-zinc-700 font-geist font-bold text-xs">
								<div className="small-caps text-zinc-500 tracking-widest">
									revisão:
								</div>
								<div>{manifesto?.revision}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="pt-4 flex flex-col space-y-4 ">
				{content?.map((currentParagraph, index) => (
					<p
						lang="pt"
						className="hyphens-auto font-geist prose prose-sm prose-zinc font-[500]"
						key={index.toString()}
					>
						{currentParagraph.paragraph}
					</p>
				))}
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
