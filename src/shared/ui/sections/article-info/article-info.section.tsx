import type { ReactNode } from "react";
import type { Author } from "@/shared/lib/author";
import { formatPtDate } from "@/shared/lib/site";
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
	const parsedPublicationDate = formatPtDate(createdAt);
	const parsedRevisionDate = formatPtDate(updatedAt);

	return (
		<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
			<Authors authors={authors ?? []} />
			{parsedPublicationDate ? (
				<LabelValue
					label="criado:"
					value={parsedPublicationDate}
					dateTime={createdAt}
				/>
			) : null}
			{parsedRevisionDate ? (
				<LabelValue
					label="revisto:"
					value={parsedRevisionDate}
					dateTime={updatedAt}
				/>
			) : null}
			{tags}
		</div>
	);
};

export default ArticleInfo;
