import Button from "./Button";

function Card({ title }: { title: string }) {
  return (
    <div className="flex h-[308px] w-full max-w-[320px] flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-6">
      <h3 className="text-2xl font-semibold leading-8 text-black">{title}</h3>
      <div className="text-[32px] font-semibold leading-10 text-black">$--</div>
      <ul className="mb-2 space-y-2 text-base leading-6 text-black">
        <li>Feature 1</li>
        <li>Feature 2</li>
        <li>Feature 3</li>
      </ul>
      <Button className="mt-auto w-[140px]">Choose plan</Button>
    </div>
  );
}

export default function PricingTeaser() {
  return (
    <section id="pricing" className="w-full bg-[#F2F2F2]">
      <div className="container py-10">
        <h2 className="text-[32px] font-semibold leading-10 text-black">Pricing</h2>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <Card title="Free" />
          <Card title="Team" />
          <Card title="Enterprise" />
        </div>
      </div>
    </section>
  );
}
