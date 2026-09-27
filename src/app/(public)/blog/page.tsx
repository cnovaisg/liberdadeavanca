import { Suspense } from "react";
import { Blog, blogService } from "@/features/blog";
import Spinner from "@/shared/ui/components/spinner/spinner";

const BlogList = async () => {
	const posts = await blogService.getLatestBlogPosts(20);
	return <Blog posts={posts} />;
};

const BlogPage = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<BlogList />
		</Suspense>
	);
};

export default BlogPage;
