"use client";

import Image from "next/image";
import { motion } from "motion/react";

const FADE_IN = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	transition: { duration: 0.6, ease: "easeOut" },
} as const;

const ImageContainer = () => {
	return (
		<div
			className="
				absolute bottom-0 right-0 z-10 pointer-events-none
				w-[70vw] max-w-[1000px]

				max-md:w-[140vw]
				max-md:right-1/2
				max-md:translate-x-1/2
				max-md:bottom-[-20%]
			"
		>
			<motion.div
				className="
					relative w-full aspect-video

					max-md:aspect-[3/2]
					max-md:scale-150
				"
				{...FADE_IN}
			>
				<Image
					src="/images/path.png"
					alt="Landscape"
					fill
					priority
					loading="eager"
					className="object-cover"
				/>
			</motion.div>
		</div>
	);
};

export default ImageContainer;