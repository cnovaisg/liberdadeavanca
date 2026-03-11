"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

type ItemType = {
	date: {
		hour: string;
		day: string;
	};
	text: string;
	id: string;
};

type CarouselProps = {
	user: string;
	items: ItemType[];
};

type PostCardProps = {
	user: string;
	text: string;
	id: string;
	date: {
		hour: string;
		day: string;
	};
};

const ITEM_WIDTH_CLASS = "w-30";
const ITEM_HEIGHT_CLASS = "h-32";
const DISPLAY_TIME = 4500;

const PostSlider = ({ user, items }: CarouselProps) => {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((i) => (i + 1) % items.length);
		}, DISPLAY_TIME);

		return () => clearInterval(interval);
	}, [items.length]);

	const item = items[currentIndex];

	return (
		<div
			className={`pt-3 relative ${ITEM_WIDTH_CLASS} ${ITEM_HEIGHT_CLASS} overflow-hidden`}
		>
			<AnimatePresence mode="wait">
				<PostCard
					key={item.id}
					user={user}
					id={item.id}
					text={item.text}
					date={item.date}
				/>
			</AnimatePresence>
		</div>
	);
};

const PostCard = ({ user, text, id, date }: PostCardProps) => {
	const url = `https://x.com/${user}/status/${id}`;

	return (
		<motion.a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="w-full font-geist"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.7 }}
		>
			<div
				className={`w-full text-emerald-700 flex flex-col space-y-2 ${ITEM_WIDTH_CLASS} ${ITEM_HEIGHT_CLASS}`}
			>
				<div className="text-[10px] font-[900] w-full tracking-wide flex ">
					<div>{date.hour}</div>
					&nbsp;·&nbsp;
					<div>{date.day}</div>
				</div>
				<p
					lang="pt"
					className="leading-5 break-words hyphens-auto line-clamp-5 overflow-hidden text-ellipsis text-xs text-zinc-700 font-[700] tracking-wide"
				>
					{text}
				</p>
			</div>
		</motion.a>
	);
};

export default PostSlider;
