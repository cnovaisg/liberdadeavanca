import Authors from "../../components/authors/authors";
import LabelValue from "../../components/label-value/label-value";
import type { AuthorType } from "../../components/authors/authors";

type ArticleinfoProps = {
    authors: AuthorType[],
    createdAt: string;
    updatedAt: string;
}
const Articleinfo = ({ authors, createdAt, updatedAt }: ArticleinfoProps ) => {

    const parsedPublicationDate = new Date(
		createdAt as string,
	).toLocaleDateString("pt-PT", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const parsedRevisionDate = new Date(
		updatedAt as string,
	).toLocaleDateString("pt-PT", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});


	return (
		<div className="flex items-center space-x-5">
			<Authors authors={authors ?? []} />
			<LabelValue label="criado:" value={parsedPublicationDate.toLowerCase()} />
			<LabelValue label="revisto:" value={parsedRevisionDate.toLowerCase()} />
		</div>
	);
};

export default Articleinfo;
