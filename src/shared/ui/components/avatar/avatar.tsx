import Image from "next/image";

type AvatarProps = {
	name: string;
	imageUrl?: string;
};

const AVATAR_SIZE_CLASSES = "w-7 aspect-square rounded-full overflow-hidden";

const Avatar = ({ name, imageUrl: url }: AvatarProps) => {
	const fallbackLetter = name ? name[0].toUpperCase() : "?";

	return url ? (
		<div className={`relative ${AVATAR_SIZE_CLASSES} border border-zinc-400 `}>
			<Image
				src={url}
				alt={name}
				fill
				className="object-cover filter grayscale contrast-125 "
			/>
		</div>
	) : (
		<div
			className={`flex items-center justify-center bg-zinc-500 text-zinc-100 font-bold ${AVATAR_SIZE_CLASSES}`}
		>
			{fallbackLetter}
		</div>
	);
};

export default Avatar;
