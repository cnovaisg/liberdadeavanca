import socialDataXService from "@/src/features/x-feed/services/x.service"
import TweetSlider from "./carroussel"

const XFeed = async () => {
const results = await socialDataXService.getPostprocessedXfeed()

return(
<div className="">
<TweetSlider user={process.env.SOCIAL_DATA_X_ACCOUNT as string} items={results} />
</div>)
}

export default XFeed