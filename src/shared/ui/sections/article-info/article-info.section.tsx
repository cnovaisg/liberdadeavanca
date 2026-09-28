import type { ReactNode } from "react";
import type { Author } from "@/shared/lib/author";
import { SITE_UI_LOCALE } from "@/shared/lib/contentful/locale";
import Authors from "../../components/authors/authors";
import LabelValue from "../../components/label-value/label-value";

type ArticleInfoProps = {
	authors: Author[];
	createdAt: string;
	updatedAt: string;
	tags?: ReactNode;
};

const ArticleInfo = ({
	authors,
	createdAt,
	updatedAt,
	tags,
}: ArticleInfoProps) => {
	const parsedPublicationDate = new Date(createdAt).toLocaleDateString(
		SITE_UI_LOCALE,
		{
			day: "numeric",
			month: "long",
			year: "numeric",
		},
	);

	const parsedRevisionDate = new Date(updatedAt).toLocaleDateString(
		SITE_UI_LOCALE,
		{
			day: "numeric",
			month: "long",
			year: "numeric",
		},
	);

	return (
		<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
			<Authors authors={authors ?? []} />
			<LabelValue label="criado:" value={parsedPublicationDate.toLowerCase()} />
			<LabelValue label="revisto:" value={parsedRevisionDate.toLowerCase()} />
			{tags}
		</div>
	);
};

export default ArticleInfo;
