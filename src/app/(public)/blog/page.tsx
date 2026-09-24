import { Suspense } from "react";
import Blog from "@/features/blog/ui/blog.page";
import Spinner from "@/shared/ui/components/spinner/spinner";

const BlogPage = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<Blog />
		</Suspense>
	);
};

export default BlogPage;
