import CardFeature from "./CardFeature";
import { Github, Search, Scale, Bell, Network, Microscope } from "lucide-react";

export default function ValueProps() {
  const steps = [
    {
      number: "01",
      title: "Import GitHub Repository",
      description: "Connect your repository in seconds. Deply automatically scans your package.json, requirements.txt, and other dependency files.",
      icon: Github
    },
    {
      number: "02", 
      title: "Gain Insights into Dependencies",
      description: "Get comprehensive health scores for each dependency, including activity levels, bus factor, and supply chain risks.",
      icon: Search
    },
    {
      number: "03",
      title: "Identify License Issues", 
      description: "Automatically detect license conflicts and compliance issues across your entire dependency tree.",
      icon: Scale
    },
    {
      number: "04",
      title: "Get Alerts for Suspicious Activity",
      description: "Receive real-time notifications when dependencies show unusual activity patterns or potential security risks.",
      icon: Bell
    },
    {
      number: "05",
      title: "Research with Interactive Graph",
      description: "Explore dependency relationships and investigate issues using our interactive dependency graph visualization.",
      icon: Network
    },
    {
      number: "06",
      title: "Research New Dependencies",
      description: "Before adding new packages, research their health, vulnerabilities, and compatibility with your existing stack.",
      icon: Microscope
    }
  ];

  return (
    <section id="product" className="w-full py-20" style={{ backgroundColor: 'rgb(12, 12, 12)' }}>
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full border border-gray-800/50 bg-gray-900/50 px-4 py-2 text-sm font-medium text-gray-300 mb-4">
            How it works
          </div>
          <h2 className="text-4xl font-bold leading-tight text-white md:text-5xl">
            Your <span className="text-brand">Deply</span> experience
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            From repository import to dependency insights - see how Deply protects your codebase
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-6">
                {/* Step Number & Line */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-700 bg-gray-900 text-white font-bold text-sm">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-800 mt-4"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <step.icon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
