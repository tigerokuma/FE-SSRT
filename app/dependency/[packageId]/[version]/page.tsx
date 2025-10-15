"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, AlertTriangle, Shield, Activity, Settings, Brain, BarChart3, Clock, GitCommit, Users, FileText, ExternalLink, Bell, MessageCircle } from "lucide-react"
import { colors } from "@/lib/design-system"

interface DependencyDetails {
  id: string
  name: string
  version: string
  description?: string
  license?: string
  total_score?: number
  activity_score?: number
  vulnerability_score?: number
  bus_factor_score?: number
  license_score?: number
  health_score?: number
  stars?: number
  contributors?: number
  summary?: string
  vulnerabilities?: Array<{
    id: string
    title: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    description: string
    publishedDate: string
  }>
  commits?: Array<{
    id: string
    message: string
    author: string
    time: string
    linesAdded: number
    linesDeleted: number
    filesChanged: number
  }>
}

export default function DependencyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [dependency, setDependency] = useState<DependencyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("overview")
  const [currentSettingsTab, setCurrentSettingsTab] = useState("alerts")

  const packageId = params.packageId as string
  const version = params.version as string

  // Fetch dependency data
  useEffect(() => {
    const fetchDependencyData = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`http://localhost:3000/packages/id/${packageId}?version=${version}`)
        if (!response.ok) {
          throw new Error('Failed to fetch dependency details')
        }
        
        const data = await response.json()
        setDependency(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (packageId) {
      fetchDependencyData()
    }
  }, [packageId, version])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-400">Loading dependency details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !dependency) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">{error || 'Dependency not found'}</div>
            <Button 
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Dependency Top Bar */}
      <div className="w-full border-b" style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))', borderBottomWidth: '1px' }}>
        <div className="flex items-center justify-between px-6 py-4 w-full max-w-none">
          {/* Left side - Dependency info and Tabs */}
          <div className="flex items-center gap-6">
            {/* Dependency info */}
            <div className="flex items-center gap-3">
              {/* Dependency icon */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
              </div>
              
              {/* Dependency name and version */}
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {dependency.name} v{dependency.version}
                </h1>
                <p className="text-sm text-gray-400">
                  {dependency.description || 'No description available'}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 flex-1">
              <Button
                onClick={() => setCurrentTab("overview")}
                variant="ghost"
                size="sm"
                className={`px-4 py-2 text-sm font-medium transition-colors relative text-gray-400 hover:text-white hover:bg-transparent border-b-2 border-transparent ${
                  currentTab === "overview" ? "text-white" : ""
                }`}
              >
                Overview
              </Button>
              <Button
                onClick={() => setCurrentTab("activity")}
                variant="ghost"
                size="sm"
                className={`px-4 py-2 text-sm font-medium transition-colors relative text-gray-400 hover:text-white hover:bg-transparent border-b-2 border-transparent ${
                  currentTab === "activity" ? "text-white" : ""
                }`}
              >
                Activity
              </Button>
              <Button
                onClick={() => setCurrentTab("settings")}
                variant="ghost"
                size="sm"
                className={`px-4 py-2 text-sm font-medium transition-colors relative text-gray-400 hover:text-white hover:bg-transparent border-b-2 border-transparent ${
                  currentTab === "settings" ? "text-white" : ""
                }`}
              >
                Settings
              </Button>
            </div>
          </div>

          {/* Right side - Back button */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tab Content */}
        {currentTab === "overview" && (
          <div className="space-y-6">
            {/* Risk Score and Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Risk Score Circle */}
              <div className="flex flex-col justify-center items-center lg:col-span-3">
                <div className="relative">
                  <div className="relative w-48 h-48">
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - (dependency.total_score || 0) / 100)}`}
                        style={{ stroke: 'rgb(84, 0, 250)' }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-white">{Math.round(dependency.total_score || 0)}</div>
                        <div className="text-sm text-gray-400">Risk Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Graph */}
              <div className="lg:col-span-9">
                <Card style={{ backgroundColor: colors.background.card }}>
                  <CardHeader>
                    <CardTitle className="text-white">Risk Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 w-full">
                      <svg className="w-full h-full" viewBox="0 0 600 200">
                        {/* Sample risk data - replace with real data */}
                        <defs>
                          <linearGradient id="riskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(84, 0, 250)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="rgb(84, 0, 250)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0,150 Q 100,120 200,100 T 400,80 T 600,60"
                          fill="url(#riskGradient)"
                          stroke="rgb(84, 0, 250)"
                          strokeWidth="3"
                        />
                        <path
                          d="M 0,150 Q 100,120 200,100 T 400,80 T 600,60"
                          fill="none"
                          stroke="rgb(84, 0, 250)"
                          strokeWidth="3"
                        />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* AI Overview and Vulnerabilities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Overview */}
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    This dependency shows moderate risk levels with consistent activity patterns. 
                    The package has {dependency.vulnerabilities?.length || 0} known vulnerabilities 
                    and maintains a {dependency.activity_score || 0}% activity score. 
                    Overall supply chain integrity is {dependency.total_score && dependency.total_score > 70 ? 'strong' : 'moderate'}.
                  </p>
                </CardContent>
              </Card>

              {/* Current Vulnerabilities */}
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Current Vulnerabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dependency.vulnerabilities && dependency.vulnerabilities.length > 0 ? (
                    <div className="space-y-2">
                      {dependency.vulnerabilities.slice(0, 3).map((vuln) => (
                        <div key={vuln.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                          <div>
                            <div className="text-sm font-medium text-white">{vuln.title}</div>
                            <div className="text-xs text-gray-400">{vuln.severity}</div>
                          </div>
                          <Badge variant="outline" className="border-red-500 text-red-500">
                            {vuln.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-green-500 text-sm">No known vulnerabilities</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Risk Score Breakdown */}
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                <CardTitle className="text-white">Risk Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Activity</span>
                      <span className="text-white">{dependency.activity_score || 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${dependency.activity_score || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vulnerabilities</span>
                      <span className="text-white">{dependency.vulnerability_score || 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${dependency.vulnerability_score || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bus Factor</span>
                      <span className="text-white">{dependency.bus_factor_score || 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${dependency.bus_factor_score || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">License</span>
                      <span className="text-white">{dependency.license_score || 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${dependency.license_score || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Health</span>
                      <span className="text-white">{dependency.health_score || 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${dependency.health_score || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === "activity" && (
          <div className="space-y-6">
            {/* Recent Commits Summary */}
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                <CardTitle className="text-white">Recent Commits Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Recent updates include performance improvements and bug fixes. 
                  The development team has been actively maintaining the package with 
                  {dependency.commits?.length || 0} commits in the last 30 days.
                </p>
              </CardContent>
            </Card>

            {/* Commit Timeline */}
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                <CardTitle className="text-white">Recent Commits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dependency.commits?.slice(0, 5).map((commit, index) => (
                    <div key={commit.id} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {commit.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{commit.message}</div>
                        <div className="text-sm text-gray-400">
                          {commit.author} • {commit.time}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="text-green-500">+{commit.linesAdded}</span>
                          <span className="text-red-500">-{commit.linesDeleted}</span>
                          <span>{commit.filesChanged} files</span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-400">
                      No recent commits available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === "settings" && (
          <div className="space-y-6">
            {/* Alert Settings */}
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                <CardTitle className="text-white">Alert Settings</CardTitle>
                <p className="text-gray-400 text-sm">Configure monitoring alerts for this dependency</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">Vulnerability Alerts</div>
                      <div className="text-sm text-gray-400">Get notified when new vulnerabilities are discovered</div>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">Activity Monitoring</div>
                      <div className="text-sm text-gray-400">Monitor for unusual activity patterns</div>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">Security Updates</div>
                      <div className="text-sm text-gray-400">Alert when security patches are available</div>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                <CardTitle className="text-white">Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">Email Notifications</div>
                      <div className="text-sm text-gray-400">Receive alerts via email</div>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">In-App Notifications</div>
                      <div className="text-sm text-gray-400">Show notifications in the dashboard</div>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
