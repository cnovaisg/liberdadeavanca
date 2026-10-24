import type { Metadata } from "next";
import { Landing } from "@/features/landing";

export const metadata: Metadata = {
	alternates: { canonical: "/" },
};

export default function Home() {
	return <Landing />;
}
