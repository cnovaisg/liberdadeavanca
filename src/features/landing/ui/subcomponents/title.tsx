"use client";

import { easeOut, motion } from "motion/react";

const containerVariants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.015,
		},
	},
};

const characterVariants = {
	hidden: { opacity: 0, x: -20 },
	show: {
		opacity: 1,
		x: 0,
		transition: {
			duration: 0.1,
			ease: easeOut,
		},
	},
};

const AnimatedText = ({ text }: { text: string }) => (
	<motion.span className="inline-flex" variants={containerVariants}>
		{[...text].map((char, i) => (
			<motion.span
				key={i}
				className="inline-block"
				variants={characterVariants}
			>
				{char}
			</motion.span>
		))}
	</motion.span>
);

const Title = () => {
	const words = ["LIBERDADE", "AVANÇA"];
	const fullText = words.join("\u00A0"); // NBSP keeps spacing in one string

	return (
		<div className="relative inline-block">
			{/* invisible layout keeper */}
			<div className="opacity-0 select-none pointer-events-none">
				<div className="flex flex-col md:hidden">
					<span>{words[0]}</span>
					<span>{words[1]}</span>
				</div>

				<div className="hidden md:block">
					<span>{fullText}</span>
				</div>
			</div>

			{/* animated layer */}
			<motion.div className="absolute inset-0" initial="hidden" animate="show">
				{/* mobile: split words */}
				<div className="flex flex-col md:hidden gap-y-2">
					<AnimatedText text={words[0]} />
					<AnimatedText text={words[1]} />
				</div>

				{/* desktop: single string */}
				<div className="hidden md:block">
					<AnimatedText text={fullText} />
				</div>
			</motion.div>
		</div>
	);
};

export default Title;
