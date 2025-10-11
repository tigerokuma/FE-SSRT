import CardFeature from "./CardFeature";

export default function ValueProps() {
  return (
    <section id="product" className="w-full bg-[#F2F2F2]">
      <div className="container">
        <div>
          <div className="mb-2 text-xs font-medium text-black">Product</div>
          <h2 className="mb-6 max-w-[560px] text-[32px] font-semibold leading-10 text-black">
            Why <span className="text-brand">Deply</span>?
          </h2>
        </div>

        {/* 2×2 grid on md+, single column on mobile */}
        <div className="grid grid-cols-1 gap-6 pb-10 md:grid-cols-2">
          <CardFeature
            className="min-h-[168px]"
            title="Project risk (weighted)"
            body="Bias by contribution & reachability for fair contribution."
          />
          <CardFeature
            className="min-h-[168px]"
            title="Dependency risk"
            body="Activity • Bus factor • Supply chain • SBOM • Vulns"
          />
          <CardFeature
            className="min-h-[168px]"
            title="Graph + activity"
            body="File/function diff; suspicious commits."
          />
          <CardFeature
            className="min-h-[168px]"
            title="Alert center"
            body="Dependency activity & early signalling with advanced query."
          />
        </div>
      </div>
    </section>
  );
}
