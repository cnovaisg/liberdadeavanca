type BlogPageProps = {
  params: { postId?: string };
};

const BlogPage = async ({ params }: BlogPageProps) => {
  const { postId } = params;

  return <div>`Post ID: ${postId}`</div>;
};

export default BlogPage;
