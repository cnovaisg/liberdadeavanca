import Footer from "@/src/shared/ui/sections/footer/footer.section";
import Navbar from "../sections/navbar/navbar.section";

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="grid grid-rows-[100dvh_auto] w-full">
			<div className="grid grid-rows-[auto_1fr] ps-4 pt-4 border border-zinc-100 overflow-hidden">
				<Navbar />
				{children}
			</div>
			<Footer />
		</div>
	);
}
