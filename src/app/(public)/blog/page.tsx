import { Suspense } from "react";
import blogService from "@/features/blog/services/blog.service";
import Blog from "@/features/blog/ui/blog.page";
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
