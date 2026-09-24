import { Suspense, use } from "react";
import socialDataXService from "@/features/x-feed/services/x.service";
import { env } from "@/shared/lib/env";
import Spinner from "@/shared/ui/components/spinner/spinner";
import PostSlider from "./post-slider";

const socialDataPromise = socialDataXService.getPostprocessedXfeed();

const XFeedContent = () => {
	const results = use(socialDataPromise);

	return <PostSlider user={env.SOCIAL_DATA_X_ACCOUNT ?? ""} items={results} />;
};

const XPostsFeed = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<XFeedContent />
		</Suspense>
	);
};

export default XPostsFeed;
