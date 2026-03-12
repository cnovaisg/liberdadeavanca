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

const Title = () => {
	const title = "LIBERDADE AVANÇA";

	return (
		<div className="relative inline-block">
			<div className="opacity-0 select-none pointer-events-none">{title}</div>

			<motion.div
				className="absolute inset-0"
				initial="hidden"
				animate="show"
				variants={containerVariants}
			>
				{title.split("").map((char, index) => (
					<motion.span
						key={index}
						variants={characterVariants}
						className="inline-block"
					>
						{char}
					</motion.span>
				))}
			</motion.div>
		</div>
	);
};

export default Title;
