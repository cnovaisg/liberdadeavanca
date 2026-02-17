type BlogPageProps = {
  params: Promise<{ postId: string }>;
};

const BlogPage = async ({ params }: BlogPageProps) => {
  const { postId } = await params;

  return <div>Post ID: {postId}</div>;
};

export default BlogPage;
