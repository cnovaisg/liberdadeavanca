"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

type ItemType = {
  date: string;
  text: string;
  id: string;
};

type CarouselProps = {
  user: string;
  items: ItemType[];
  displaySeconds?: number;
};

const ITEM_WIDTH_CLASS = "w-24";
const ITEM_HEIGHT_CLASS = "h-24";

const TweetSlider = ({ user, items, displaySeconds = 5 }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % items.length);
    }, displaySeconds * 1000);

    return () => clearInterval(interval);
  }, [items.length, displaySeconds]);

  const item = items[currentIndex];

  return (
    <div className={`relative ${ITEM_WIDTH_CLASS} ${ITEM_HEIGHT_CLASS} overflow-hidden`}>
      <AnimatePresence mode="wait">
        <TweetCard key={item.id} user={user} {...item} />
      </AnimatePresence>
    </div>
  );
};

type TweetCardProps = {
  user: string;
  text: string;
  id: string;
  date: string;
};

const TweetCard = ({ user, text, id, date }: TweetCardProps) => {
  const url = `https://x.com/${user}/status/${id}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className={`p-2 bg-zinc-50 rounded text-emerald-900 flex flex-col
        ${ITEM_WIDTH_CLASS} ${ITEM_HEIGHT_CLASS}`}
      >
        <div className="text-[10px] font-extrabold tracking-wide">{date}</div>
        <p
          lang="pt"
          className="leading-4 break-words hyphens-auto line-clamp-4 overflow-hidden text-ellipsis text-[10px] font-semibold tracking-wide"
        >
          {text}
        </p>
      </div>
    </motion.a>
  );
};

export default TweetSlider;