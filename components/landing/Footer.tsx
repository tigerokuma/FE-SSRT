export default function Footer() {
  const cols = [
    { title: "Product", items: ["Item A", "Item B", "Item C"] },
    { title: "Docs", items: ["Item A", "Item B", "Item C"] },
    { title: "Company", items: ["Item A", "Item B", "Item C"] },
    { title: "Legal", items: ["Item A", "Item B", "Item C"] },
  ];

  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="container py-10">
        <div className="flex flex-wrap gap-10">
          {cols.map((c) => (
            <div key={c.title} className="flex min-w-[140px] flex-col gap-2">
              <h3 className="text-2xl font-semibold leading-8 text-black">{c.title}</h3>
              <div className="text-xs font-medium leading-4 text-black">
                {c.items.join("  ")}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 text-xs font-medium text-black">
          © 2025 Deply • contact@deply.com
        </div>
      </div>
    </footer>
  );
}
