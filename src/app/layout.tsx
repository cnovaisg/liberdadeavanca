import type { Metadata } from "next";
import { Anton, Geist } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { SITE_UI_LOCALE } from "@/shared/lib/site";
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
	description: "Movimento Liberdade Avança: em defesa da sociedade civil.",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Nonce CSP (src/proxy.ts) only works on a per-request render. Next.js
	// reads the CSP header and stamps that nonce onto framework scripts.
	// A static shell is built without a request, so it cannot carry a fresh
	// nonce. `headers()` opts this layout — and every page under it — into
	// dynamic rendering. Dropping it, or relaxing script-src to
	// 'unsafe-inline', would either block those scripts or weaken the policy.
	// Cached fetches (`next.revalidate`) still avoid repeat upstream calls.
	await headers();

	return (
		<html
			lang={SITE_UI_LOCALE}
			className={`${geist.variable} ${anton.variable}`}
		>
			<body className="font-geist">
				<MainLayout>{children}</MainLayout>
			</body>
		</html>
	);
}
