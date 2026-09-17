import { Suspense } from "react";
import Spinner from "@/src/shared/ui/components/spinner/spinner";
import Blog from "@/src/shared/ui/pages/blog/blog.page";

const BlogPage = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<Blog />
		</Suspense>
	);
};

export default BlogPage;
