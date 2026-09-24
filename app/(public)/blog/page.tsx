import { Suspense } from "react";
import Spinner from "@/src/shared/ui/components/spinner/spinner";
import Blog from "@/src/features/blog/ui/blog.page";

const BlogPage = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<Blog />
		</Suspense>
	);
};

export default BlogPage;
