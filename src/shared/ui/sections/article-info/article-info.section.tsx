import type { ReactNode } from "react";
import type { AuthorType } from "../../components/authors/authors";
import Authors from "../../components/authors/authors";
import LabelValue from "../../components/label-value/label-value";

type ArticleInfoProps = {
	authors: AuthorType[];
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
		"pt-PT",
		{
			day: "numeric",
			month: "long",
			year: "numeric",
		},
	);

	const parsedRevisionDate = new Date(updatedAt).toLocaleDateString("pt-PT", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

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
