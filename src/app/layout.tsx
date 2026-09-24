import type { Metadata } from "next";
import { Anton, Geist } from "next/font/google";
import "./globals.css";
import MainLayout from "@/shared/ui/layouts/main.layout";

const geist = Geist({
	variable: "--font-geist",
	subsets: ["latin"],
	display: "swap",
});

const anton = Anton({
	weight: "400",
	variable: "--font-anton",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Liberdade Avança",
	description:
		"Movimento Liberdade Avança: em defesa dos direitos do indivíduo.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-PT" className={`${geist.variable} ${anton.variable}`}>
			<body className="font-geist">
				<MainLayout>{children}</MainLayout>
			</body>
		</html>
	);
}
