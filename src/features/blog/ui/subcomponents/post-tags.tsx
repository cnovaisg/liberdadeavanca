import Link from "next/link";
import type { BlogTag } from "../../types";

type PostTagsProps = {
	tags: BlogTag[];
};

const PostTags = ({ tags }: PostTagsProps) => {
	if (tags.length === 0) return null;

	return (
		<div className="pointer-events-auto relative z-10 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-geist font-bold text-xs">
			<span className="small-caps text-zinc-500 tracking-widest">
				etiquetas:
			</span>
			<span className="flex flex-wrap gap-x-2 gap-y-1">
				{tags.map((tag) => (
					<Link
						key={tag.id}
						href={`/blog/tag/${encodeURIComponent(tag.id)}`}
						className="text-zinc-700 hover:text-emerald-800 transition-colors duration-500 ease-in-out"
					>
						{tag.name}
					</Link>
				))}
			</span>
		</div>
	);
};

export default PostTags;
