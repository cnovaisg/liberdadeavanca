import CallToAction from "./call-to-action";
import XPostsFeed from "./x-posts-feed";
import Title from "./title";

const Banner = () => {
	return (
		<div className="pt-[23%] sm:pt-[12%] ps-[9%] w-full z-50">
			<div className="flex flex-col md:flex-row md:items-baseline md:space-x-1.5">
				<div className="font-anton text-2xl tracking-wide text-emerald-700">
					MOVIMENTO
				</div>

				<div className="flex flex-col space-y-2 text-6xl tracking-wide text-emerald-900">
					<h1 className="font-anton">
						<Title />
					</h1>
					<CallToAction />
					<XPostsFeed />
				</div>
			</div>
		</div>
	);
};

export default Banner;
