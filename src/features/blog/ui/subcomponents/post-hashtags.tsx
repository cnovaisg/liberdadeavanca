import type { ContentfulTag } from "@/shared/lib/contentful/tags";

type PostHashtagsProps = {
	hashtags: ContentfulTag[];
};

const PostHashtags = ({ hashtags }: PostHashtagsProps) => {
	if (!hashtags.length) return null;

	return (
		<ul className="flex flex-wrap gap-2 font-anton text-sm tracking-wide text-emerald-700">
			{hashtags.map((tag) => (
				<li key={tag.id}>
					<span className="inline-flex items-center">#{tag.name}</span>
				</li>
			))}
		</ul>
	);
};

export default PostHashtags;
