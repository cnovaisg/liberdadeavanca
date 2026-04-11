import CallToAction from "./Call-to-action";
import XPostsFeed from "./x-posts-feed";
import Title from "./title";

const Banner = () => {
	return (
		<div className="pt-[18%] sm:pt-[12%] ps-[9%] w-full z-50">
			<h1 className="flex flex-col md:flex-row md:items-baseline font-anton md:space-x-1.5">
				<div className="text-2xl tracking-wide text-emerald-700">MOVIMENTO</div>

				<div className="flex flex-col space-y-2 text-6xl tracking-wide text-emerald-900">
					<Title />
					<CallToAction />
					<XPostsFeed />
				</div>
			</h1>
		</div>
	);
};

export default Banner;
