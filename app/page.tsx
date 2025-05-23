import Footer from "@/src/ui/sections/footer/footer";
import ABoveTheFoldSection from "@/src/ui/sections/homepage/above-the-fold/above-the-fold";
export default function Home() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col border-b-1 border-green-300 ">
        <ABoveTheFoldSection />
      </div>
      <Footer />
    </div>
  );
}
