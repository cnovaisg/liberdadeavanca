import { Suspense } from "react"
import Blog from "@/src/shared/ui/pages/blog/blog.page"
import Spinner from "@/src/shared/ui/components/spinner/spinner"

const BlogPage = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Blog />
    </Suspense>
  )
}

export default BlogPage
