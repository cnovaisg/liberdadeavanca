import Image from "next/image";
import CallToAction from "./Call-to-action";
const Banner = () => {
    return (
        <div className="pt-36 ps-27 w-full z-50">
            <h1 className="flex items-baseline font-anton space-x-1.5">
                <div className="text-2xl tracking-wide text-emerald-700">
                    MOVIMENTO
                </div>
                <div className="flex flex-col space-y-2 text-6xl tracking-wide text-emerald-900">
                    <div>LIBERDADE AVANÇA</div>
                    <CallToAction />
                </div>
            </h1>
        </div>
    );
};

export default Banner;
