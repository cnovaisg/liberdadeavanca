import { Suspense } from "react";
import Spinner from "@/shared/ui/components/spinner/spinner";
import Blog from "@/features/blog/ui/blog.page";

const BlogPage = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<Blog />
		</Suspense>
	);
};

export default BlogPage;
