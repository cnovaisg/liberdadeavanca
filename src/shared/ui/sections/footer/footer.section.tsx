import Legal from "./subcomponents/legal";
import Notice from "./subcomponents/notice";

const Footer = () => {
	return (
		<div className="flex flex-col space-y-4 md:flex-row items-baseline w-full bg-emerald-950 px-4 py-2 space-x-4">
			<Notice />
			<Legal />
		</div>
	);
};

export default Footer;
