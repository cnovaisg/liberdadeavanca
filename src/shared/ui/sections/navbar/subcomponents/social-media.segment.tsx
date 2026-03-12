import FacebookIcon from "../../../icons/facebook/facebook.icon";
import MailCIon from "../../../icons/mail/mail.icon";
import Xicon from "../../../icons/x/x.icon";
import type { ReactNode } from "react";

type LinkType = {
	url: string;
	icon: ReactNode;
};

const LINKS: LinkType[] = [
	{ url: "", icon: <Xicon scale={0.75} /> },
	{ url: "", icon: <FacebookIcon scale={0.75} /> },
	{ url: "", icon: <MailCIon scale={0.75} /> },
];

const SocialMediaSegment = () => {
	return (
		<div className="pe-4 flex space-x-2 text-emerald-700">
			{LINKS.map((link: LinkType, index: number) => {
				const Icon = link.icon;

				return (
					<a
						className="flex justify-center items-center rounded p-0.5 hover:bg-emerald-100 duration-200 ease-out transition-colours"
						key={`icon_${index}`}
						href={link.url}
					>
						{Icon}
					</a>
				);
			})}
		</div>
	);
};

export default SocialMediaSegment;
