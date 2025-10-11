// app/(marketing)/page.tsx
import NavPrimary from "@/components/landing/NavPrimary";
import Hero from "@/components/landing/Hero";
import TrustRow from "@/components/landing/TrustRow";
import ValueProps from "@/components/landing/ValueProps";
import PricingTeaser from "@/components/landing/PricingTeaser";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F2F2F2]">
      <NavPrimary />
      <div className="pt-[80px]"> {/* offset for fixed nav */}
        <Hero />
        <TrustRow />
        <ValueProps />
        <PricingTeaser />
        <Footer />
      </div>
    </main>
  );
}
