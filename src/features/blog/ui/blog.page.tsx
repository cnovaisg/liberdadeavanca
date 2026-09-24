import blogService from "../services/blog.service";
import PostSummary from "./subcomponents/post-summary";

const Blog = async () => {
	const posts = await blogService.getLatestBlogPosts(20);
	const [featured, ...rest] = posts;

	if (!featured) {
		return (
			<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
				<div className="pt-8 flex flex-col space-y-3">
					<h1 className="text-5xl text-emerald-900 tracking-wider font-anton">
						BLOG
					</h1>
					<p className="font-geist text-zinc-700">
						Ainda não há artigos publicados.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-full shrink-0 overflow-y-auto">
			<div className="pt-8 flex flex-col space-y-10 pb-10">
				<PostSummary post={featured} featured />

				{rest.length > 0 ? (
					<div className="flex flex-col space-y-8">
						<h2 className="font-anton text-sm text-emerald-600 tracking-widest">
							MAIS ARTIGOS
						</h2>
						<ul className="flex flex-col divide-y divide-zinc-100">
							{rest.map((post) => (
								<li key={post.id} className="py-8 first:pt-0">
									<PostSummary post={post} />
								</li>
							))}
						</ul>
					</div>
				) : null}
			</div>
		</div>
	);
};

export default Blog;
