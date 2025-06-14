type BlogPageProps = {
  params: { postId?: string[] };
};

const BlogPage = async ({ params }: BlogPageProps) => {
  const postId = params.postId ? params.postId[0] : undefined;

  return <div>{postId ? `Post ID: ${postId}` : "Showing latest post"}</div>;
};

export default BlogPage;
