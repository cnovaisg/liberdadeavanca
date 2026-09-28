import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Página não encontrada",
};

const NotFound = () => {
	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-5">
				<h1 className="text-5xl text-emerald-900 tracking-wider font-anton">
					PÁGINA NÃO ENCONTRADA
				</h1>
				<p className="font-geist text-zinc-700">
					A página que procura não existe ou foi movida.
				</p>
				<Link
					href="/"
					className="font-anton text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-500 ease-in-out w-fit"
				>
					<span className="font-geist">←</span> VOLTAR AO INÍCIO
				</Link>
			</div>
		</div>
	);
};

export default NotFound;
