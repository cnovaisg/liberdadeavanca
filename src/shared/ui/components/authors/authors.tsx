import type { Author } from "@/shared/lib/author";
import LabelValue from "../label-value/label-value";

export type AuthorsProps = {
	authors: Author[];
};

const generateParsedAuthorsNames = (authors?: Author[]) => {
	if (!authors || authors.length === 0) return "";
	const numberOfAuthors = authors.length;
	if (numberOfAuthors === 1) return authors[0].name;
	if (numberOfAuthors === 2) return `${authors[0].name} e ${authors[1].name}`;
	if (numberOfAuthors === 3)
		return `${authors[0].name}, ${authors[1].name} e ${authors[2].name}`;
	return `${authors[0].name}, ${authors[1].name} e ${numberOfAuthors - 2} ${numberOfAuthors === 4 ? "outro" : "outros"}`;
};

const Authors = ({ authors }: AuthorsProps) => {
	const postprocessedAuthors = generateParsedAuthorsNames(authors);

	const label = authors.length === 1 ? "autor:" : "autores:";

	return (
		<div className="flex items-center space-x-2">
			<LabelValue label={label} value={postprocessedAuthors} />
		</div>
	);
};

export default Authors;
