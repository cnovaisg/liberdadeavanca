import { Suspense, use } from "react";
import manifestoService from "@/src/features/manifesto/services/manifesto.service";
import LabelValue from "../../components/label-value/label-value";
import Authors from "../../components/authors/authors";

const manifestoPromise = manifestoService.getManifesto();
const ManifestoContent = () => {
	const manifesto = use(manifestoPromise);
	const authors = manifesto?.authors;
	const introContent = manifesto?.intro;
	const mainContent = manifesto?.value;

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
						<div className="flex items-center space-x-5">
							<Authors authors={authors ?? []} />
							<LabelValue
								label="criado:"
								value={parsedPublicationDate.toLowerCase()}
							/>
							<LabelValue
								label="revisto:"
								value={parsedRevisionDate.toLowerCase()}
							/>
						</div>
					</div>
				</div>
			</div>
			<div className="pt-4 flex flex-col space-y-3 ">
				{introContent?.map((currentParagraph, index) => (
					<p
						lang="pt"
						className="hyphens-auto font-geist prose prose-sm prose-zinc font-[500]"
						key={index.toString()}
					>
						{currentParagraph.paragraph}
					</p>
				))}
			</div>
			<div className="pt-4 flex flex-col space-y-3 ">
				{mainContent?.map((currentParagraph, index) => (
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
