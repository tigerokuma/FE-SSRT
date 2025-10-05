import Button from "./Button";
import CardFeature from "./CardFeature";

export default function Hero() {
  return (
    <section className="relative w-full bg-[#F2F2F2]">
      <div className="container flex flex-col gap-8 py-10 md:flex-row">
        {/* Left copy */}
        <div className="flex w-full  flex-col gap-4 py-6">
          <h1 className="max-w-[760px] text-4xl font-semibold leading-[56px] text-black md:text-[52px]">
            Secure your dependencies, builds, and downloads.
          </h1>
          <p className="max-w-[460px] text-base leading-6 text-black">
            Weighted project &amp; dependency risk, graph-aware change alerts, and early
            warnings from your OSS supply chain
          </p>
          <div className="flex gap-2">
            <Button as="a" href="/sign-in?redirect=%2Fwatchlist">Start free</Button>
            <Button variant="secondary" as="a" href="#docs">Explore docs</Button>
          </div>
        </div>

        {/* Right metric card */}
        <div className="w-full ">
          <CardFeature eyebrow="Project risk" rightChip="Alerts: 3" title="88" variant="metric">
            <div className="mt-3 grid gap-2">
              <div className="rounded-2xl border border-[#E5E7EB] bg-black/20 px-3 py-0.5 text-xs font-medium text-black">core-lib</div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-black/20 px-3 py-0.5 text-xs font-medium text-black">auth-sdk</div>
              <div className="rounded-2xl border border-[#E5E7EB] bg-black/20 px-3 py-0.5 text-xs font-medium text-black">ui-kit</div>
            </div>
          </CardFeature>
        </div>
      </div>
    </section>
  );
}
