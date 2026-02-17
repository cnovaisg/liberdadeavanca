import contentfulServices from "@/src/modules/blog/services/contentful.services"

const Manifesto = async () => {
    const manifesto = await contentfulServices.getManifesto()
    return (
        <div className="flex w-full h-full shrink-0 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(manifesto, null, 2)}
            </pre>
        </div>
    )
}

export default Manifesto