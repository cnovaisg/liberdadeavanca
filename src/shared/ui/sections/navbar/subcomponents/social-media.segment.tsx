import type { ReactNode } from "react";
import { env } from "@/shared/lib/env";
import MailIcon from "../../../icons/mail/mail.icon";
import XIcon from "../../../icons/x/x.icon";

type LinkType = {
	url: string;
	icon: ReactNode;
};

const xHandle = env.SOCIAL_DATA_X_ACCOUNT?.replace(/^@/, "");
const mail = env.ACCOUNT_MAIL;

const LINKS: LinkType[] = [
	...(xHandle
		? [
				{
					url: `https://x.com/${xHandle}`,
					icon: <XIcon scale={0.75} />,
				},
			]
		: []),
	...(mail
		? [
				{
					url: `mailto:${mail}`,
					icon: <MailIcon scale={0.75} />,
				},
			]
		: []),
];

const SocialMediaSegment = () => {
	if (LINKS.length === 0) return null;

	return (
		<div className="pe-4 flex space-x-2 text-emerald-700">
			{LINKS.map((link: LinkType, index: number) => {
				const Icon = link.icon;

				return (
					<a
						className="flex justify-center items-center rounded p-0.5 hover:bg-emerald-100 duration-200 ease-out transition-colors"
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
