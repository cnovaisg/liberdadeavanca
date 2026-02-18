type BlogPageProps = {
  params: Promise<{ postId: string }>;
};

const IndividualBlogPage = async ({ params }: BlogPageProps) => {
  const { postId } = await params;
  return <div>Post ID: {postId}</div>;
};

export default IndividualBlogPage;
