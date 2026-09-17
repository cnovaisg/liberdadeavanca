import type { AuthorType } from "../../components/authors/authors";
import Authors from "../../components/authors/authors";
import LabelValue from "../../components/label-value/label-value";

type ArticleinfoProps = {
	authors: AuthorType[];
	createdAt: string;
	updatedAt: string;
};
const Articleinfo = ({ authors, createdAt, updatedAt }: ArticleinfoProps) => {
	const parsedPublicationDate = new Date(
		createdAt as string,
	).toLocaleDateString("pt-PT", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const parsedRevisionDate = new Date(updatedAt as string).toLocaleDateString(
		"pt-PT",
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
		</div>
	);
};

export default Articleinfo;
