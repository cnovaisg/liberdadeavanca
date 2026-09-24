import { Suspense, use } from "react";
import manifestoService from "../services/manifesto.service";
import LabelValue from "@/src/shared/ui/components/label-value/label-value";
import Authors from "@/src/shared/ui/components/authors/authors";
import Spinner from "@/src/shared/ui/components/spinner/spinner";
import Paragraphs from "@/src/shared/ui/sections/paragraphs/paragraphs";

const MANIFESTO_LEAD =
	"Este movimento de ideias propõe apoiar, dentro do ordenamento jurídico-constitucional português e possíveis alterações, um programa de redução do peso do Estado na economia e sociedade civil em 50% por cortes quer nos impostos quer na despesa incluindo por privatizações com o objectivo de atingir um crescimento económico de 50% numa década e propor uma reforma da segurança social da componente contributiva que assegure equilíbrio financeiro mas também uma alternativa para as novas gerações.";

const manifestoPromise = manifestoService.getManifesto();
const ManifestoContent = () => {
	const manifesto = use(manifestoPromise);
	const authors = manifesto?.authors;
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
			<div className="pt-8 flex flex-col space-y-5 shrink-0">
				<div className="flex flex-col space-y-1 font-anton">
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
			<div className="pt-8">
				<Paragraphs paragraphs={[{ paragraph: MANIFESTO_LEAD }]} />
			</div>
			<div className="flex pt-4 pb-10">
				<Paragraphs paragraphs={mainContent!} initialDelay={1} />
			</div>
		</div>
	);
};

const Manifesto = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<ManifestoContent />
		</Suspense>
	);
};

export default Manifesto;
