import Link from "next/link";
import RichText from "@/shared/ui/components/rich-text/rich-text";
import ArticleInfo from "@/shared/ui/sections/article-info/article-info.section";
import type { PrunedBlogPostType } from "../types";
import PostTags from "./subcomponents/post-tags";

type BlogPostPageProps = {
	post: PrunedBlogPostType;
};

const BlogPost = ({ post }: BlogPostPageProps) => {
	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-5 shrink-0">
				<Link
					href="/blog"
					className="font-anton text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-500 ease-in-out w-fit"
				>
					<span className="font-geist">←</span> VOLTAR AO BLOG
				</Link>

				<div className="flex flex-col space-y-1 font-anton">
					<h1 className="text-5xl text-emerald-900 tracking-wider">
						{post.title?.toUpperCase()}
					</h1>

					{post.subtitle ? (
						<h2 className="text-2xl text-emerald-700 tracking-wide">
							{post.subtitle}
						</h2>
					) : null}
				</div>

				<ArticleInfo
					authors={post.authors}
					createdAt={post.createdAt}
					updatedAt={post.updatedAt}
					tags={<PostTags tags={post.tags} />}
				/>
			</div>

			<div className="pt-8 pb-10">
				<RichText document={post.value} />
			</div>
		</div>
	);
};

export default BlogPost;
