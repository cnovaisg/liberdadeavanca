import blogService from "@/src/features/blog/services/blog.service"

const Blog = async () => {
    const blogs = await blogService.getLatestBlogPosts()
    return (
        <div className="flex w-full h-full shrink-0 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(blogs, null, 2)}
            </pre>
        </div>
    )
}

export default Blog