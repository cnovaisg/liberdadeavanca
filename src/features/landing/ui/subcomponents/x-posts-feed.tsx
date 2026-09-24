import { Suspense, use } from "react";
import socialDataXService from "@/features/x-feed/services/x.service";
import Spinner from "@/shared/ui/components/spinner/spinner";
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
		<Suspense fallback={<Spinner />}>
			<XFeedContent />
		</Suspense>
	);
};

export default XPostsFeed;
