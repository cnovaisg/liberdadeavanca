import Link from "next/link";
import type { PrunedBlogPostType } from "@/src/features/blog/services/blog.service";
import Articleinfo from "@/src/shared/ui/sections/article-info/article-info";

type PostSummaryProps = {
	post: PrunedBlogPostType;
	featured?: boolean;
};

const PostSummary = ({ post, featured = false }: PostSummaryProps) => {
	const TitleTag = featured ? "h1" : "h2";
	const titleClass = featured
		? "text-5xl text-emerald-900 tracking-wider"
		: "text-3xl text-emerald-900 tracking-wider";
	const subtitleClass = featured
		? "text-2xl text-emerald-700 tracking-wide"
		: "text-xl text-emerald-700 tracking-wide";

	return (
		<Link
			href={`/blog/${post.id}`}
			className="group flex flex-col space-y-5 shrink-0"
		>
			<div className="flex flex-col space-y-1 font-anton">
				<TitleTag
					className={`${titleClass} group-hover:text-emerald-700 transition-colors duration-500 ease-in-out`}
				>
					{post.title?.toUpperCase()}
				</TitleTag>
				{post.subtitle ? (
					<p className={subtitleClass}>{post.subtitle}</p>
				) : null}
			</div>

			<Articleinfo
				authors={post.authors}
				createdAt={post.createdAt}
				updatedAt={post.updatedAt}
			/>

			{featured && post.value?.[0]?.paragraph ? (
				<p
					lang="pt"
					className="hyphens-auto font-geist prose prose-sm prose-zinc font-[500] line-clamp-3"
				>
					{post.value[0].paragraph}
				</p>
			) : null}

			<span className="font-anton text-sm text-emerald-600 group-hover:text-emerald-800 transition-colors duration-500 ease-in-out">
				LER ARTIGO <span className="font-geist">➔</span>
			</span>
		</Link>
	);
};

export default PostSummary;
