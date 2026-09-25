import Link from "next/link";
import ArticleInfo from "@/shared/ui/sections/article-info/article-info.section";
import type { PrunedBlogPostType } from "../../types";
import PostTags from "./post-tags";

type PostSummaryProps = {
	post: PrunedBlogPostType;
	featured?: boolean;
};

const PostSummary = ({ post, featured = false }: PostSummaryProps) => {
	const TitleTag = featured ? "h1" : "h2";
	const titleId = `post-title-${post.id}`;
	const titleClass = featured
		? "text-5xl text-emerald-900 tracking-wider"
		: "text-3xl text-emerald-900 tracking-wider";
	const subtitleClass = featured
		? "text-2xl text-emerald-700 tracking-wide"
		: "text-xl text-emerald-700 tracking-wide";

	return (
		<article className="group relative flex flex-col space-y-5 shrink-0">
			<Link
				href={`/blog/${post.id}`}
				aria-labelledby={titleId}
				className="absolute inset-0 z-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
			/>

			<div className="relative z-10 flex flex-col space-y-5 pointer-events-none">
				<div className="flex flex-col space-y-1 font-anton">
					<TitleTag
						id={titleId}
						className={`${titleClass} group-hover:text-emerald-700 transition-colors duration-500 ease-in-out`}
					>
						{post.title?.toUpperCase()}
					</TitleTag>
					{post.subtitle ? (
						<p className={subtitleClass}>{post.subtitle}</p>
					) : null}
				</div>

				<ArticleInfo
					authors={post.authors}
					createdAt={post.createdAt}
					updatedAt={post.updatedAt}
					tags={<PostTags tags={post.tags} />}
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
			</div>
		</article>
	);
};

export default PostSummary;
