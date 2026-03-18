"use client";
import { motion, type Variants, easeOut } from "motion/react";

type ParagraphType = {
	paragraph: string;
};

type ParagraphsProps = {
	paragraphs: ParagraphType[];
	className?: string;
};

const containerVariants: Variants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.15,
			delayChildren: 0.1,
		},
	},
};

const itemVariants: Variants = {
	hidden: {
		opacity: 0,
	},
	show: {
		opacity: 1,
		transition: {
			duration: 0.4,
			ease: easeOut,
		},
	},
};

const Paragraphs = ({ paragraphs, className }: ParagraphsProps) => {
	return (
		<motion.div
			variants={containerVariants}
			initial="hidden"
			whileInView="show"
			viewport={{ once: true, margin: "-50px" }}
			className="lex flex-col space-y-3"
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
