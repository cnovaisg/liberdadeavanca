import {
	OG_IMAGE_CONTENT_TYPE,
	OG_IMAGE_SIZE,
	OG_POST_IMAGE_ID,
} from "@/shared/og/copy";
import { renderShareImage } from "@/shared/og/image";
import {
	readPostId,
	resolvePostShareCard,
} from "@/shared/og/resolve-post-card";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type ImageParams = { postId?: string };

export async function generateImageMetadata({
	params,
}: {
	params: ImageParams | Promise<ImageParams>;
}) {
	const copy = await resolvePostShareCard(await readPostId(params));

	return [
		{
			id: OG_POST_IMAGE_ID,
			alt: copy.alt,
			size,
			contentType,
		},
	];
}

export default async function Image({
	params,
}: {
	params: Promise<ImageParams>;
}) {
	const copy = await resolvePostShareCard(await readPostId(params));
	return renderShareImage(copy);
}
