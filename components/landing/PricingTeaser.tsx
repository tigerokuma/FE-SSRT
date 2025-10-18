import Button from "./Button";

function Card({ title, price, description, features, popular = false }: { 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  popular?: boolean 
}) {
  return (
    <div className={`relative w-full max-w-[300px] rounded-xl border transition-all duration-300 hover:shadow-lg ${popular ? 'border-purple-500/50 bg-purple-500/5' : 'border-gray-800/50'}`} style={{ backgroundColor: 'rgb(18, 18, 18)' }}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="rounded-full bg-purple-500 px-3 py-1 text-xs font-medium text-white">
            Most Popular
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <div className="text-3xl font-bold text-white mb-2">{price}</div>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0"></div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button className={`w-full ${popular ? 'bg-purple-500 hover:bg-purple-600' : ''}`}>
          {popular ? 'Get Started' : 'Choose plan'}
        </Button>
      </div>
    </div>
  );
}

export default function PricingTeaser() {
  return (
    <section id="pricing" className="w-full py-20" style={{ backgroundColor: 'rgb(12, 12, 12)' }}>
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">Pricing</h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Simple, transparent pricing for teams of all sizes
          </p>
        </div>
        <div className="flex flex-wrap items-start justify-center gap-6">
          <Card 
            title="Free" 
            price="Free" 
            description="Perfect for getting started with dependency security"
            features={[
              "Up to 3 repositories",
              "Basic vulnerability scanning", 
              "License compliance checks",
              "Email notifications",
              "Community support"
            ]}
          />
          <Card 
            title="Team" 
            price="$29/mo" 
            description="For growing teams that need advanced security insights"
            features={[
              "Unlimited repositories",
              "Advanced vulnerability scanning",
              "Real-time alerts & Slack integration",
              "Dependency graph visualization", 
              "Priority support",
              "Team collaboration features"
            ]}
            popular={true}
          />
          <Card 
            title="Enterprise" 
            price="Custom" 
            description="For large organizations with complex security needs"
            features={[
              "Everything in Team",
              "Custom integrations",
              "Advanced analytics & reporting",
              "Dedicated account manager",
              "SLA guarantees",
              "Custom deployment options"
            ]}
          />
        </div>
      </div>
    </section>
  );
}
