import Button from "./Button";
import CardFeature from "./CardFeature";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: 'rgb(12, 12, 12)' }}>
      <div className="container flex flex-col gap-12 py-20 md:flex-row md:items-center">
        {/* Left copy */}
        <div className="flex w-full flex-col gap-6 py-6 text-center md:text-left">
          <h1 className="max-w-[760px] text-5xl font-bold leading-[1.1] text-white md:text-6xl">
            Secure your dependencies, builds, and downloads
          </h1>
          <p className="max-w-[560px] text-lg leading-7 text-gray-400">
            Get early warnings about vulnerabilities, license issues, and supply chain risks across your entire codebase
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button as="a" href="/sign-in?redirect=%2Fproject" className="px-8 py-4 text-base font-semibold">Start free</Button>
          </div>
        </div>

        {/* Right metric card */}
        <div className="w-full">
          <div className="rounded-2xl border border-gray-800/50 p-8 shadow-2xl transition-all duration-300 hover:border-gray-700/50 hover:shadow-3xl" style={{ backgroundColor: 'rgb(18, 18, 18)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm font-medium text-gray-300">Project Health</div>
              <div className="rounded-full border border-red-500/50 bg-red-900/20 px-3 py-1 text-xs font-medium text-red-400">
                3 Alerts
              </div>
            </div>

            {/* Health Score with Progress Circle */}
            <div className="flex items-center gap-8 mb-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-800"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    style={{ stroke: 'rgb(84, 0, 250)' }}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="72, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">72</div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-300">Vulnerabilities</span>
                  </div>
                  <span className="text-sm font-semibold text-red-400">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span className="text-sm text-gray-300">License Issues</span>
                  </div>
                  <span className="text-sm font-semibold text-white">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span className="text-sm text-gray-300">Dependencies</span>
                  </div>
                  <span className="text-sm font-semibold text-white">127</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="border-t border-gray-800/50 pt-4">
              <div className="text-xs font-medium text-gray-400 mb-2">Recent Activity</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>Updated 2 hours ago</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                  <span>License scan completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
