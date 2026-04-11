"use client";

import Link from "next/link";
import { motion } from "motion/react";

const CallToAction = () => {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3, ease: "easeOut", delay: 0.35 }}
			className="
				flex flex-col md:flex-row
				md:space-y-0 md:space-x-2

				border-[1.5px] rounded-xs border-emerald-700 text-emerald-700 tracking-widest
				w-fit px-3 py-1.5 text-xs

				max-md:max-w-[100%]
				max-md:overflow-hidden
				max-md:box-border
			"
		>
			<h2 className="flex items-center md:block pb-2 md:pb-0 md:pe-2 md:border-e-[1.5px] border-emerald-700">
				Em defesa dos direitos do indivíduo
			</h2>

			<div className="h-px w-full bg-emerald-700 md:hidden" />

			<Link href="/manifesto" className="text-emerald-900 italic flex items-center">
				<span className="flex group space-x-1">
					<span>Ver Manifesto</span>
					<span>➔</span>
				</span>
			</Link>
		</motion.div>
	);
};

export default CallToAction;