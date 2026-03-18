import LabelValue from "../label-value/label-value";

export type AuthorType = {
	name: string;
	role: string;
	contact?: string;
	imageUrl: string;
};

export type AuthorsProps = {
	authors: AuthorType[];
};

const generateParsedAuthorsNames = (authors?: AuthorType[]) => {
  if (!authors || authors.length === 0) return "";
  const numberOfAuthors = authors.length;
  if (numberOfAuthors === 1) return authors[0].name;
  if (numberOfAuthors === 2) return `${authors[0].name} e ${authors[1].name}`;
  if (numberOfAuthors === 3) return `${authors[0].name}, ${authors[1].name} e ${authors[2].name}`;
  return `${authors[0].name}, ${authors[1].name} e ${numberOfAuthors - 2} ${numberOfAuthors === 4 ? "outro" : "outros"}`;
};

const Authors = ({ authors }: AuthorsProps) => {
	const postprocessedAuthors = generateParsedAuthorsNames(authors);

	return (
		<div className="flex items-center space-x-2">
			<LabelValue label="autores:" value={postprocessedAuthors as string} />
		</div>
	);
};

export default Authors;
