import Image from "next/image";
import CallToAction from "./Call-to-action";
import XPostsFeed from "./x-posts-feed";
import Title from "./title";

const Banner = () => {
	return (
		<div className="pt-[12%] ps-[9%] w-full z-50">
			<div>
				<h1 className="flex items-baseline font-anton space-x-1.5">
					<div className="text-2xl tracking-wide text-emerald-700">
						MOVIMENTO
					</div>
					<div className="flex flex-col space-y-2 text-6xl tracking-wide text-emerald-900">
						<div className="flex flex-col sm:hidden">
							<div>LIBERDADE</div>
							<div>AVANÇA</div>
						</div>
						<div className="hidden sm:flex">
							<Title />
						</div>
						<CallToAction />
						<XPostsFeed />
					</div>
				</h1>
			</div>
		</div>
	);
};

export default Banner;
