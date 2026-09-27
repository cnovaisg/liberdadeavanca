import { Suspense } from "react";
import { env } from "@/shared/lib/env";
import Spinner from "@/shared/ui/components/spinner/spinner";
import socialDataXService from "../services/x.service";
import PostSlider from "./subcomponents/post-slider";

const XFeedContent = async () => {
	const results = await socialDataXService.getPostprocessedXfeed();
	const user = (env.SOCIAL_DATA_X_ACCOUNT ?? "").replace(/^@/, "");

	return <PostSlider user={user} items={results} />;
};

const XPostsFeed = () => {
	return (
		<Suspense fallback={<Spinner />}>
			<XFeedContent />
		</Suspense>
	);
};

export default XPostsFeed;
