import LabelValue from "../label-value/label-value";
import Avatar from "../avatar/avatar";

type AuthorType = {
	name: string;
	role: string;
	contact?: string;
	imageUrl: string;
};

type AuthorsProps = {
	authors: AuthorType[];
};

const generateParsedAuthorsNames = (authors?: AuthorType[]) => {
	if (!authors || authors.length === 0) return "";
	const numberofAuthors = authors.length;
	if (numberofAuthors === 1) {
		return authors[0].name;
	}
	if (numberofAuthors === 2) {
		return `${authors[0].name} e ${authors[1].name} `;
	}
	if (numberofAuthors > 2) {
		return `${authors[0].name}, ${authors[1].name} e ${numberofAuthors - 2} ${numberofAuthors === 3 ? "outro" : "outros"} `;
	}
};

const Authors = ({ authors }: AuthorsProps) => {
	const postprocessedAuthors = generateParsedAuthorsNames(authors);

	return (
		<div className="flex items-center space-x-1">
			<Avatar name={authors[0]?.name} imageUrl={authors[0]?.imageUrl} />
			<LabelValue label="autores:" value={postprocessedAuthors as string} />
		</div>
	);
};

export default Authors;
