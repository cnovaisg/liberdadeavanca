import { Suspense, use } from "react";
import blogService from "@/src/features/blog/services/blog.service";
import LabelValue from "../../components/label-value/label-value";
import Authors from "../../components/authors/authors";
import Spinner from "../../components/spinner/spinner";
import Paragraphs from "../../sections/paragraphs/paragraphs";
import Lines from "../../sections/lines/lines";

const blogPromise = blogService.getLatestBlogPosts();

const BlogContent = () => {
	const blogs = use(blogPromise);

	const post = blogs?.[0];
	const authors = post?.authors;
	const content = post?.value ?? [];

	const lead = content?.[0]?.paragraph ?? "";
	const body = content?.slice(1);

	const parsedPublicationDate = new Date(
		post?.createdAt as string,
	).toLocaleDateString("pt-PT", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const parsedRevisionDate = new Date(
		post?.updatedAt as string,
	).toLocaleDateString("pt-PT", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-5 font-anton shrink-0">
				<div className="flex flex-col space-y-1">
					<h1 className="text-5xl text-emerald-900 tracking-wider">
						{post?.title?.toUpperCase()}
					</h1>

					<h2 className="text-2xl text-emerald-700 tracking-wide">
						{post?.subtitle}
					</h2>
				</div>

				<div className="flex items-center space-x-5">
					<Authors authors={authors ?? []} />

					<LabelValue
						label="criado:"
						value={parsedPublicationDate.toLowerCase()}
					/>

					<LabelValue
						label="revisto:"
						value={parsedRevisionDate.toLowerCase()}
					/>
				</div>
			</div>

			<div className="pt-8">
				<Lines paragraph={lead} maxCharsPerLine={45} />
			</div>

			<div className="flex pt-4 pb-10">
				<Paragraphs paragraphs={body} initialDelay={1} />
			</div>
		</div>
	);
};

const Blog = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<BlogContent />
		</Suspense>
	);
};

export default Blog;
