import contentfulServices from "@/src/modules/blog/services/contentful.services"

const Blog = async () => {
    const blogs = await contentfulServices.getLatestBlogPosts()
    return (
        <div className="flex w-full h-full shrink-0 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(blogs, null, 2)}
            </pre>
        </div>
    )
}

export default Blog