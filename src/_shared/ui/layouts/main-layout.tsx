import Footer from "@/src/_shared/ui/sections/footer/footer";
import Navbar from "../sections/navbar/navbar";


export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col">
            <div className="w-screen h-screen min-w-screen min-h-screen flex flex-col p-4 border-b-1 border-neutral-300 overflow-clip">
                <Navbar />
                {children}
            </div>
            <Footer />
        </div>
    );
}
