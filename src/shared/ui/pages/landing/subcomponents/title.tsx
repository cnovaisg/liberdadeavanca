"use client";
import { easeOut, motion } from "motion/react";

const containerVariants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.018,
		},
	},
};

const characterVariants = {
	hidden: { opacity: 0, x: -20 },
	show: {
		opacity: 1,
		x: 0,
		transition: {
			duration: 0.18,
			ease: easeOut,
		},
	},
};

const AnimatedWord = ({ word }: { word: string }) => (
	<motion.span
		className="inline-flex"
		variants={{ show: { transition: { staggerChildren: 0.05 } } }}
	>
		{[...word].map((char, i) => (
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
	const title = ["LIBERDADE", "AVANÇA"];

	return (
		<div className="relative inline-block">
			<div className="opacity-0 select-none pointer-events-none">
				<div className="flex flex-col md:hidden">
					<span>{title[0]}</span>
					<span>{title[1]}</span>
				</div>
				<div className="hidden md:flex">
					<AnimatedWord word={`${title[0]}\u00A0${title[1]}`} />
				</div>
			</div>

			<motion.div
				className="absolute inset-0"
				initial="hidden"
				animate="show"
				variants={containerVariants}
			>
				<div className="flex flex-col md:hidden">
					<AnimatedWord word={title[0]} />
					<AnimatedWord word={title[1]} />
				</div>
				<div className="hidden md:flex">
					<AnimatedWord word={`${title[0]} ${title[1]}`} />
				</div>
			</motion.div>
		</div>
	);
};

export default Title;
