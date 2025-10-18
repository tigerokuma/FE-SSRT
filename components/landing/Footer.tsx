export default function Footer() {
  const cols = [
    { 
      title: "Product", 
      items: [
        { name: "Features", href: "#product" },
        { name: "Pricing", href: "#pricing" },
        { name: "Integrations", href: "#integrations" },
        { name: "API", href: "/docs/api" }
      ] 
    },
    { 
      title: "Resources", 
      items: [
        { name: "Documentation", href: "/docs" },
        { name: "Guides", href: "/docs/guides" },
        { name: "Blog", href: "/blog" },
        { name: "Support", href: "/support" }
      ] 
    },
    { 
      title: "Company", 
      items: [
        { name: "About", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Contact", href: "/contact" },
        { name: "Status", href: "/status" }
      ] 
    },
    { 
      title: "Legal", 
      items: [
        { name: "Privacy", href: "/privacy" },
        { name: "Terms", href: "/terms" },
        { name: "Security", href: "/security" },
        { name: "Compliance", href: "/compliance" }
      ] 
    },
  ];

  return (
    <footer className="border-t border-gray-800/50" style={{ backgroundColor: 'rgb(12, 12, 12)' }}>
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-white">{c.title}</h3>
              <div className="space-y-2">
                {c.items.map((item, index) => (
                  <a 
                    key={index} 
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200 cursor-pointer block"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            © 2025 Deply. All rights reserved.
          </div>
          <div className="text-sm text-gray-400">
            contact@deply.com
          </div>
        </div>
      </div>
    </footer>
  );
}
