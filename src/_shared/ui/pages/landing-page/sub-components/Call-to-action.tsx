import Link from "next/link";

const CallToAction = () => {
    return (
        <div className="flex space-x-2  border-[1.5px] rounded-xs border-emerald-700 text-emerald-700 tracking-widest w-fit whitespace-nowrap px-3 py-1.5 text-[10px]">
            <h2 className="pe-2 border-e-[1.5px] border-emerald-700">Em defesa dos direitos do indivíduo</h2>
            <Link
                href="/manifesto"
                className="text-emerald-900 italic"
            >
                Ver Manifesto
            </Link>
        </div>

    );
}

export default CallToAction;