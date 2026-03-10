import { Suspense, use } from "react";
import socialDataXService from "@/src/features/x-feed/services/x.service";
import PostSlider from "./post-slider";

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
		<Suspense fallback={<div>Loading tweets...</div>}>
			<XFeedContent />
		</Suspense>
	);
};

export default XPostsFeed;
