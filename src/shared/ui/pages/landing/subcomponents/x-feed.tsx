import socialDataXService from "@/src/features/x-feed/services/x.service"

const XFeed = async () => {

    const results = await socialDataXService.getPostprocessedXfeed()

return(<div className="bg-yellow-300 w-20">
    <pre>
        {JSON.stringify(results, null, 2)}
    </pre>
</div>)
}

export default XFeed