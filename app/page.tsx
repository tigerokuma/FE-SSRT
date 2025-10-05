// app/page.tsx
import Hero from "@/components/landing/Hero";
import TrustRow from "@/components/landing/TrustRow";
import ValueProps from "@/components/landing/ValueProps";
import PricingTeaser from "@/components/landing/PricingTeaser";
import Footer from "@/components/landing/Footer";
import NavPrimary from "@/components/landing/NavPrimary";

export default function Landing() {
  return (
      <>
          <NavPrimary/>
          <div className="h-[80px] bg-[#F2F2F2]"/>
          <main className="relative w-full overflow-y-auto bg-[#F2F2F2]">
              <Hero/>
              <TrustRow/>
              <ValueProps/>
              <PricingTeaser/>
              <Footer/>
          </main>
      </>
  );
}
