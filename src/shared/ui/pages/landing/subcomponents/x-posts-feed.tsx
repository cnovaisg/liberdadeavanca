import { Suspense, use } from "react";
import socialDataXService from "@/src/features/x-feed/services/x.service";
import PostSlider from "./post-slider";
import Spinner from "../../../components/spinner/spinner";
const socialDataPromise = socialDataXService.getPostprocessedXfeed();

const XFeedContent = () => {
	const results = use(socialDataPromise);

	return (
		<PostSlider
			user={process.env.SOCIAL_DATA_X_ACCOUNT as string}
			items={results}
		/>
	);
};

const XPostsFeed = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<XFeedContent />
		</Suspense>
	);
};

export default XPostsFeed;
