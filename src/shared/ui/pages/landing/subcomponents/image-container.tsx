"use client"

import Image from "next/image";
import { motion } from "motion/react";

const FADE_IN = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: "easeOut" },
} as const; 

const ImageContainer = () => {
    return (
        <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
            <motion.div className="relative w-[750px] aspect-video" {...FADE_IN}>
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