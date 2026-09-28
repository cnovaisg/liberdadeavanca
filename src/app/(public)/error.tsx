"use client";

import Link from "next/link";
import { useEffect } from "react";

type PublicErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

const actionClassName =
	"font-anton text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-500 ease-in-out w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";

const PublicError = ({ error, reset }: PublicErrorProps) => {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div
			role="alert"
			className="flex flex-col w-full h-full shrink-0 overflow-y-auto"
		>
			<div className="pt-8 flex flex-col space-y-5">
				<h1 className="text-5xl text-emerald-900 tracking-wider font-anton">
					ALGO CORREU MAL
				</h1>
				<p className="font-geist text-zinc-700">
					Não foi possível carregar esta página. Pode tentar de novo dentro de
					momentos.
				</p>
				<button
					type="button"
					onClick={() => reset()}
					className={actionClassName}
				>
					TENTAR DE NOVO
				</button>
				<Link href="/" className={actionClassName}>
					<span className="font-geist">←</span> VOLTAR AO INÍCIO
				</Link>
			</div>
		</div>
	);
};

export default PublicError;
