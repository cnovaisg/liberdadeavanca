import Notice from "./subcomponents/notice";
import Legal from "./subcomponents/legal";

const Footer = () => {
	return (
		<div className="flex-col space-y-4 md:flex items-baseline w-full bg-emerald-950 px-4 py-2 space-x-4">
			<Notice />
			<Legal />
		</div>
	);
};

export default Footer;
