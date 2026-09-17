import Link from "next/link";
import { notFound } from "next/navigation";
import blogService from "@/src/features/blog/services/blog.service";
import Articleinfo from "../../sections/article-info/article-info";
import Lines from "../../sections/lines/lines";
import Paragraphs from "../../sections/paragraphs/paragraphs";

type BlogPostPageProps = {
	postId: string;
};

const BlogPost = async ({ postId }: BlogPostPageProps) => {
	const post = await blogService.getPostById(postId);

	if (!post) {
		notFound();
	}

	const content = post.value ?? [];
	const lead = content[0]?.paragraph ?? "";
	const body = content.slice(1);

	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-5 shrink-0">
				<Link
					href="/blog"
					className="font-anton text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-500 ease-in-out w-fit"
				>
					← VOLTAR AO BLOG
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

				<Articleinfo
					authors={post.authors}
					createdAt={post.createdAt}
					updatedAt={post.updatedAt}
				/>
			</div>

			{lead ? (
				<div className="pt-8">
					<Lines paragraph={lead} maxCharsPerLine={45} />
				</div>
			) : null}

			{body.length > 0 ? (
				<div className="flex pt-4 pb-10">
					<Paragraphs paragraphs={body} initialDelay={1} />
				</div>
			) : (
				<div className="pb-10" />
			)}
		</div>
	);
};

export default BlogPost;
