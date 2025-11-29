// app/(marketing)/page.tsx
import NavPrimary from "@/components/landing/NavPrimary";
import Hero from "@/components/landing/Hero";
import TrustRow from "@/components/landing/TrustRow";
import ValueProps from "@/components/landing/ValueProps";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: 'rgb(12, 12, 12)' }}>
      <NavPrimary />
      <div className="pt-16"> {/* offset for fixed nav */}
        <Hero />
        <TrustRow />
        <ValueProps />
        <Footer />
      </div>
    </main>
  );
}
