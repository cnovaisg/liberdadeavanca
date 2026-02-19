import Footer from "@/src/shared/ui/sections/footer/footer.section";
import Navbar from "../sections/navbar/navbar.section";


export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col">
            <div className="w-full min-w-full h-dvh min-h-dvh flex flex-col ps-4 py-4 border border-zinc-100 overflow-hidden">
                <Navbar />
                {children}
            </div>
            <Footer />
        </div>
    );
}
