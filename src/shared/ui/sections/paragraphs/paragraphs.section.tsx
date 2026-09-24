"use client";
import { motion, type Variants, easeOut } from "motion/react";

type ParagraphType = {
	paragraph: string;
};

type ParagraphsProps = {
	paragraphs: ParagraphType[];
	className?: string;
	initialDelay?: number; // in seconds, default 0
};

const Paragraphs = ({
	paragraphs,
	className,
	initialDelay = 0,
}: ParagraphsProps) => {
	const containerVariants: Variants = {
		hidden: {},
		show: {
			transition: {
				staggerChildren: 0.15,
				delayChildren: initialDelay,
			},
		},
	};

	const itemVariants: Variants = {
		hidden: { opacity: 0 },
		show: { opacity: 1, transition: { duration: 0.3, ease: easeOut } },
	};

	return (
		<motion.div
			variants={containerVariants}
			initial="hidden"
			animate="show"
			className="flex flex-col space-y-3"
		>
			{paragraphs?.map((currentParagraph, index) => (
				<motion.p
					key={index}
					variants={itemVariants}
					lang="pt"
					className={`hyphens-auto font-geist prose prose-sm prose-zinc font-[500] ${className}`}
				>
					{currentParagraph.paragraph}
				</motion.p>
			))}
		</motion.div>
	);
};

export default Paragraphs;
