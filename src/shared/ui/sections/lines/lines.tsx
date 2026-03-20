"use client";
import { motion, type Variants, easeOut } from "motion/react";

type LinesProps = {
	paragraph: string;
	maxCharsPerLine?: number;
};

const containerVariants: Variants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0.05,
		},
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 10 },
	show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

const Lines = ({ paragraph, maxCharsPerLine = 40 }: LinesProps) => {
	const words = paragraph.split(" ");
	const lines: string[] = [];
	let line: string[] = [];
	let charCount = 0;

	words.forEach((word) => {
		charCount += word.length + 1;
		line.push(word);
		if (charCount >= maxCharsPerLine) {
			lines.push(line.join(" "));
			line = [];
			charCount = 0;
		}
	});

	if (line.length) lines.push(line.join(" "));

	return (
		<p className="hyphens-auto font-geist prose prose-sm prose-zinc font-[500]">
			<motion.span
				variants={containerVariants}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, margin: "-30px" }}
				className="inline-block"
				lang="pt"
			>
				{lines.map((lineText, i) => (
					<motion.span
						key={i}
						variants={itemVariants}
						className="prose prose-2xl font-[600] "
					>
						{lineText}
					</motion.span>
				))}
			</motion.span>
		</p>
	);
};

export default Lines;
