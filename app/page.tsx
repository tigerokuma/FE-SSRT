import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Eye, Star, Download, Shield, Users, Calendar, Globe } from "lucide-react"
import { WatchlistSearchDialog } from "@/components/watchlist/WatchlistSearchDialog"

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Open Source Insight Tracker
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Monitor, analyze, and manage your project dependencies with comprehensive insights and risk assessments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WatchlistSearchDialog
              trigger={
                <Button size="lg" className="bg-white text-black hover:bg-gray-100 font-medium">
                  <Search className="mr-2 h-5 w-5" />
                  Search Packages
                </Button>
              }
              defaultType="production"
            />
            <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-900">
              <Eye className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Amazing Search & Analysis Features
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-800/50">
                    <Search className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Advanced Search</CardTitle>
                    <CardDescription className="text-gray-400">
                      Search millions of NPM packages with intelligent filtering
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Real-time search with debounced queries, exact match detection, and comprehensive results from the NPM registry.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-900/30 rounded-lg border border-green-800/50">
                    <Eye className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Detailed Preview</CardTitle>
                    <CardDescription className="text-gray-400">
                      Comprehensive package information at a glance
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  View detailed metrics, risk assessments, maintainer info, and external links in a beautiful side panel.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-900/30 rounded-lg border border-red-800/50">
                    <Shield className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Risk Assessment</CardTitle>
                    <CardDescription className="text-gray-400">
                      Intelligent risk scoring and security analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Automated risk analysis with visual indicators and recommendations for package security and maintenance.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-900/30 rounded-lg border border-yellow-800/50">
                    <Star className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">GitHub Integration</CardTitle>
                    <CardDescription className="text-gray-400">
                      Stars, forks, contributors, and repository health
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Direct links to GitHub repositories with comprehensive statistics and community metrics.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-800/50">
                    <Download className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Usage Analytics</CardTitle>
                    <CardDescription className="text-gray-400">
                      Download counts and popularity metrics
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Track package adoption with weekly download statistics and trend analysis.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-900/30 rounded-lg border border-cyan-800/50">
                    <Users className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Team Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Maintainer insights and community health
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  View maintainer profiles, contributor counts, and project governance information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Try the New Search Experience
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience the power of our enhanced search dialog with detailed package previews, risk assessments, and one-click additions to your watchlist.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WatchlistSearchDialog
              trigger={
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium">
                  <Plus className="mr-2 h-5 w-5" />
                  Open Advanced Search
                </Button>
              }
              defaultType="production"
            />
            <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-900">
              <Calendar className="mr-2 h-5 w-5" />
              View Dependencies
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">2M+</div>
            <div className="text-sm text-gray-400">NPM Packages</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">Real-time</div>
            <div className="text-sm text-gray-400">API Data</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">600+</div>
            <div className="text-sm text-gray-400">Data Points</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">Instant</div>
            <div className="text-sm text-gray-400">Search Results</div>
          </div>
        </div>
      </div>
    </div>
  )
}
