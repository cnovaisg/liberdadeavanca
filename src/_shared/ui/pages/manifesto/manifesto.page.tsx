import manifestoService from "@/src/features/manifesto/services/manifesto.service"
import { Suspense, use } from "react"


const manifestoPromise = manifestoService.getManifesto()

const ManifestoContent = () => {
    const manifesto = use(manifestoPromise)
    return (
        <div className="flex w-full h-full shrink-0 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(manifesto, null, 2)}
            </pre>
        </div>
    )
}

const Manifesto = ()=> {
    return(
        <Suspense fallback={<div>loading</div>}>
            <ManifestoContent />
        </Suspense>
    )
}

export default Manifesto