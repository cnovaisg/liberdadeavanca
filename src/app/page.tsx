import type { Metadata } from "next";
import { Landing } from "@/features/landing";
import { pageAlternates } from "@/shared/lib/seo";

export const metadata: Metadata = {
	alternates: pageAlternates("/"),
};

export default function Home() {
	return <Landing />;
}
