import type { Metadata } from "next"
import { Suspense } from "react"
import blogService from "@/src/features/blog/services/blog.service"
import BlogPost from "@/src/shared/ui/pages/blog/blog-post.page"
import Spinner from "@/src/shared/ui/components/spinner/spinner"

type BlogPageProps = {
  params: Promise<{ postId: string }>
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { postId } = await params
  const post = await blogService.getPostById(postId)

  if (!post) {
    return { title: "Artigo não encontrado" }
  }

  return {
    title: post.title,
    description: post.subtitle,
  }
}

const IndividualBlogPage = async ({ params }: BlogPageProps) => {
  const { postId } = await params

  return (
    <Suspense fallback={<Spinner />}>
      <BlogPost postId={postId} />
    </Suspense>
  )
}

export default IndividualBlogPage
