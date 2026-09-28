"use client";

import { useEffect } from "react";
import { SITE_UI_LOCALE } from "@/shared/lib/site";
import "./globals.css";

type GlobalErrorProps = {
	error: Error & { digest?: string };
	reset: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang={SITE_UI_LOCALE}>
			<body className="bg-white text-black">
				<div
					role="alert"
					className="flex flex-col w-full min-h-dvh px-4 pt-8 space-y-5"
				>
					<h1 className="text-5xl text-emerald-900 tracking-wider font-anton">
						ALGO CORREU MAL
					</h1>
					<p className="font-geist text-zinc-700">
						Não foi possível carregar o site. Pode tentar de novo dentro de
						momentos.
					</p>
					<button
						type="button"
						onClick={() => reset()}
						className="font-anton text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-500 ease-in-out w-fit text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
					>
						TENTAR DE NOVO
					</button>
				</div>
			</body>
		</html>
	);
};

export default GlobalError;
