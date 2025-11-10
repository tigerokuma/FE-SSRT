"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, TrendingUp, Shield, AlertTriangle, Activity, Users, BarChart3, Settings, ExternalLink, Copy, Download, Brain, Lock, Heart, Zap, Scale } from "lucide-react"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/design-system"
import CommitTimeline from "@/components/dependencies/CommitTimeline"
import { HealthScoreChart } from "@/components/health-score-chart"
import { DependencyAlertCard } from "@/components/dependencies/DependencyAlertCard"
import { DependencyAlertSettings } from "@/components/dependencies/DependencyAlertSettings"
import DependencyRelationshipGraph from "@/components/dependencies/DependencyRelationshipGraph"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function DependencyDetailsPage() {
  const apiBase = "/api/backend";
  const params = useParams() as { packageId: string; version?: string[] }
  const packageId = params.packageId
  const version = Array.isArray(params.version) && params.version.length > 0
    ? params.version[0]
    : undefined
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("overview")
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const [showScorecardModal, setShowScorecardModal] = useState(false)
  const [selectedScorecardData, setSelectedScorecardData] = useState<any>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Check if this is a watchlist package
  const isWatchlistPackage = version === "watchlist"

  // Mock data for overview tab
  const [selectedHealthData, setSelectedHealthData] = useState<{ date: string; score: number } | null>(null)

  const healthHistory = [
    { date: "2024-04-01", score: 3.2 },
    { date: "2024-05-01", score: 3.8 },
    { date: "2024-06-01", score: 2.1 },
    { date: "2024-07-01", score: 3.0 },
    { date: "2024-08-01", score: 2.3 },
    { date: "2024-09-01", score: 6.1 }
  ]

  const scorecardHealth = {
    date: "2024-09-01",
    score: 6.1,
    checks: [
      { name: "Activity", score: 9.5, reason: "High activity level", details: null, documentation: { short: "Activity", url: "" } },
      { name: "Bus Factor", score: 9.5, reason: "Good contributor diversity", details: null, documentation: { short: "Bus Factor", url: "" } },
      { name: "Supply Chain", score: 8.5, reason: "Strong supply chain integrity", details: null, documentation: { short: "Supply Chain", url: "" } },
      { name: "Legal Compliance", score: 10.0, reason: "Full compliance", details: null, documentation: { short: "Legal Compliance", url: "" } },
      { name: "Health", score: 6.7, reason: "Moderate health score", details: null, documentation: { short: "Health", url: "" } },
      { name: "Vulnerability", score: 1.0, reason: "Critical vulnerabilities present", details: null, documentation: { short: "Vulnerability", url: "" } }
    ]
  }

  const packageScore = 20
  const scoreBreakdown = {
    activity: 95,
    busFactor: 95,
    supplyChain: 85,
    legalCompliance: 100,
    health: 67,
    vulnerability: 10
  }

  const vulnerabilities = [
    {
      id: "CVE-2025-4567",
      title: "Improper neutralization of input during web page generate",
      severity: "MODERATE" as const,
      description: "Improper neutralization of input during web page generate"
    }
  ]

  // Mock alerts data
  const dependencyAlerts = [
    {
      id: "alert-1",
      type: "suspicious_commit_behavior",
      title: "Suspicious Commit Behavior Detected",
      description: "Unusual commit pattern detected with 2,500 lines changed in a single commit, significantly above normal contributor patterns.",
      severity: "high" as const,
      status: "open" as const,
      createdAt: "2024-01-15T10:30:00Z",
      timeAgo: "2 hours ago",
      value: 2500,
      thresholdValue: 1000,
      commitSha: "a1b2c3d4e5f6",
      contributor: "dev-user-123"
    },
    {
      id: "alert-2",
      type: "health_score_drop",
      title: "Package Health Score Dropped",
      description: "Package health score decreased by 2.3 points from 6.1 to 3.8, indicating potential maintenance issues.",
      severity: "medium" as const,
      status: "open" as const,
      createdAt: "2024-01-14T15:45:00Z",
      timeAgo: "1 day ago",
      value: 3.8,
      thresholdValue: 5.0
    },
    {
      id: "alert-3",
      type: "vulnerability_detected",
      title: "New Vulnerability Reported",
      description: "CVE-2025-4567 detected in current version with MODERATE severity. Improper neutralization of input during web page generation.",
      severity: "medium" as const,
      status: "open" as const,
      createdAt: "2024-01-13T09:15:00Z",
      timeAgo: "2 days ago"
    },
    {
      id: "alert-4",
      type: "package_score_drop",
      title: "Package Score Decreased",
      description: "Overall package score dropped by 8 points from 28 to 20, indicating declining project health.",
      severity: "high" as const,
      status: "open" as const,
      createdAt: "2024-01-12T14:20:00Z",
      timeAgo: "3 days ago",
      value: 20,
      thresholdValue: 25
    },
    {
      id: "alert-5",
      type: "files_changed",
      title: "Unusual File Change Pattern",
      description: "Commit modified 45 files, which is 3.2x above the contributor's normal pattern and 2.8x above repository average.",
      severity: "low" as const,
      status: "resolved" as const,
      createdAt: "2024-01-10T11:30:00Z",
      timeAgo: "5 days ago",
      value: 45,
      thresholdValue: 20,
      commitSha: "f7e8d9c0b1a2",
      contributor: "maintainer-456"
    }
  ]

  // Health data selection handler
  const handleHealthDataSelect = (data: { date: string; score: number }) => {
    setSelectedHealthData(data)
  }

  // Alert handlers
  const handleResolveAlert = async (alertId: string) => {
    console.log('Resolving alert:', alertId)
    // In a real implementation, this would call an API
    // For now, just log the action
  }

  const handleSendToJira = async (alertId: string) => {
    console.log('Sending alert to Jira:', alertId)
    // In a real implementation, this would call an API to create a Jira ticket
    // For now, just log the action
  }

  const handleSaveSettings = async (settings: any) => {
    console.log('Saving alert settings:', settings)
    // In a real implementation, this would save the settings
    setIsSettingsOpen(false)
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "alerts", label: "Alerts" },
  ]

  // Update tab indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabRefs.current[currentTab]
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth,
        })
      }
    }

    updateIndicator() // Initial position
    window.addEventListener('resize', updateIndicator) // Update on resize
    return () => window.removeEventListener('resize', updateIndicator) // Cleanup
  }, [currentTab]) // Recalculate when currentTab changes

  // Fetch dependency data
  useEffect(() => {
    const fetchDependencyData = async () => {
      try {
        setError(null)
        setLoading(true)
        const url = version
        ? `${apiBase}/packages/id/${packageId}?version=${encodeURIComponent(version)}`
        : `${apiBase}/packages/id/${packageId}`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          console.log('Dependency data:', data)
        } else {
          console.warn('Dependency request failed, falling back to mock data:', response.status)
        }
      } catch (err) {
        console.error('Failed to fetch dependency details, using mock data instead:', err)
      } finally {
        setLoading(false)
      }
    }

    if (packageId) {
      fetchDependencyData()
    }
  }, [packageId, version])

  // Remove loading state - show tabs immediately like projects screen

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">{error}</div>
            <Button
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
        </div>
      </div>

      {/* Scorecard Assessment Modal */}
      <Dialog open={showScorecardModal} onOpenChange={setShowScorecardModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Scorecard Health Assessment</DialogTitle>
            <DialogDescription>
              {selectedScorecardData && `OpenSSF Scorecard from ${new Date(selectedScorecardData.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`}
            </DialogDescription>
          </DialogHeader>

          {selectedScorecardData && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="p-6 bg-gray-900/30 border border-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-4xl font-bold text-white">
                      {selectedScorecardData.score}
                    </div>
                    <div className="text-lg text-gray-400">out of 10</div>
                  </div>
                  <div className="w-48 bg-gray-700 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        selectedScorecardData.score >= 8 ? 'bg-green-500' :
                        selectedScorecardData.score >= 6 ? 'bg-yellow-500' :
                        selectedScorecardData.score >= 4 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, selectedScorecardData.score) * 10}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* All Scorecard Checks */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">All Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedScorecardData.checks.map((check: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">{check.name}</span>
                        <div className={`text-lg font-bold ${
                          check.score >= 8 ? 'text-green-400' :
                          check.score >= 6 ? 'text-yellow-400' :
                          check.score >= 4 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          {check.score}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {check.reason}
                      </p>
                      {check.details && check.details.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-gray-300">Details:</h4>
                          <ul className="text-xs text-gray-400 space-y-1">
                            {check.details.map((detail: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

  return (
    <div className="min-h-screen">
      {/* Dependency Top Bar - Fixed header */}
      <div className="fixed top-0 z-50 w-full border-b" style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))', borderBottomWidth: '1px' }}>
        <div className="px-6 py-3 w-full max-w-none">
          {/* First line - Dependency info */}
          <div className="flex items-center gap-3 mb-2">
            {/* NPM logo */}
            <div className="flex items-center justify-center w-6 h-6">
              <img src="/Npm_logo.png" alt="NPM Package" className="w-full h-full object-contain" />
            </div>

            {/* Dependency name */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-white">
                {packageId}
              </h1>
              {isWatchlistPackage && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  Watchlist
                </Badge>
              )}
            </div>
          </div>

          {/* Second line - Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              return (
                <Button
                  key={tab.id}
                  ref={(el) => {
                    if (el) tabRefs.current[tab.id] = el
                  }}
                  onClick={() => setCurrentTab(tab.id)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors relative",
                    "text-gray-400 hover:text-white hover:bg-transparent",
                    "border-b-2 border-transparent",
                    currentTab === tab.id && "text-white"
                  )}
                >
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Active tab indicator bar */}
        <div className="relative">
          <div className="absolute bottom-0 left-0 right-0 h-0.5"></div> {/* Base line */}
          <div
            className="absolute bottom-0 h-0.5 transition-all duration-200"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              backgroundColor: colors.primary,
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl" style={{ paddingTop: '140px' }}>
        {/* Tab Content */}
        {currentTab === "overview" && (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
              {/* Left Side - Package Info, Install Command, and AI Summary */}
              <div className="xl:col-span-3 space-y-6">
                {/* Package Info */}
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{packageId}</h1>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        <img src="/Npm_logo.png" alt="NPM" className="w-full h-full object-contain" />
                      </div>
                      <span>NPM Package</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span>GitHub</span>
                    </div>
                    <span>MIT License</span>
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" style={{ color: colors.text.secondary }} />
                      <span>2.4M</span>
                    </div>
                  </div>
                </div>

                {/* Install Command */}
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.background.card }}>
                    <code className="text-sm" style={{ color: colors.text.primary }}>npm install {packageId}</code>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(`npm install ${packageId}`)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* AI Summary */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                      <Brain className="h-4 w-4"/>
                    </div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>AI Summary</h2>
                  </div>
                  <p className="text-lg leading-relaxed" style={{ color: colors.text.secondary }}>
                    This dependency shows an increasing trend in new vulnerabilities over the past six months.
                    However, the current version v19.2.0 has one critical vulnerability CVE-2025-4567.
                    The activity score remains high, but the bus factor is a potential risk.
                    Overall supply chain integrity is strong.
                  </p>
                </div>
              </div>

              {/* Right Side - Package Health Score */}
              <div>
                <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.background.card }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Package Score</h3>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-red-400 mb-2">{packageScore}/100</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{ width: `${packageScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Security</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 bg-red-500/10">HIGH</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Scorecard</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/10">MODERATE</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Activity</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded border border-green-500/30 text-green-400 bg-green-500/10">HIGH</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Bus Factor</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/10">GOOD</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Legal Compliance</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded border border-green-500/30 text-green-400 bg-green-500/10">COMPLIANT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Full Width */}
            <div className="space-y-6">
              {/* Scorecard Health */}
              <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.background.card }}>

                <HealthScoreChart
                  data={healthHistory}
                  onDataPointSelect={handleHealthDataSelect}
                  scorecardData={scorecardHealth}
                  layout="side-by-side"
                  onViewFullAssessment={(scorecardData) => {
                    setSelectedScorecardData(scorecardData)
                    setShowScorecardModal(true)
                  }}
                />
              </div>

              {/* Security & Legal Compliance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Security - Left Card */}
                <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.background.card }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img src="/osv_logo.svg" alt="OSV" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Security</h2>
                  </div>

                  <div className="space-y-3">
                    {/* Version 4.17.21 - Latest */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="text-sm font-semibold text-white">4.17.21</div>
                          <div className="text-xs text-gray-400">Feb 2021</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-gray-500">0 vulnerabilities</div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>

                    {/* Version 4.16.6 */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <div className="text-sm font-semibold text-white">4.16.6</div>
                          <div className="text-xs text-gray-400">Oct 2016</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-red-400">9 vulnerabilities</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">6H</span>
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">3M</span>
                        </div>
                      </div>
                    </div>

                    {/* Version 3.10.1 */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <div className="text-sm font-semibold text-white">3.10.1</div>
                          <div className="text-xs text-gray-400">Aug 2015</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-red-400">7 vulnerabilities</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">5H</span>
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">2M</span>
                        </div>
                      </div>
                    </div>

                    {/* Version 2.4.2 */}
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <div className="text-sm font-semibold text-white">2.4.2</div>
                          <div className="text-xs text-gray-400">Apr 2015</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-red-400">5 vulnerabilities</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">4H</span>
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">1M</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* License - Right Card */}
                <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.background.card }}>
                  <h2 className="text-lg font-semibold mb-6" style={{ color: colors.text.primary }}>License</h2>

                  <div className="space-y-6">
                    {/* License Info */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>Package License</span>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">MIT</Badge>
                      </div>
                      <p className="text-xs text-gray-400">Permissive license - safe for commercial use</p>
                    </div>

                    {/* Compatibility Check */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-300">Compatible with your project</span>
                      </div>
                      <span className="text-xs text-green-400">✅ Safe to use</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Dependency Graph */}
              <DependencyRelationshipGraph packageId={packageId} />
            </div>
          </div>
        )}

        {currentTab === "activity" && (
          <div className="space-y-6">
            {/* Activity and Bus Factor Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Card */}
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                    <Activity className="h-5 w-5" />
                    Activity Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      {scoreBreakdown.activity}/100
                    </div>
                    <div className="text-sm" style={{ color: colors.text.secondary }}>High Activity Level</div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${scoreBreakdown.activity}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>Commits (30 days):</span>
                      <span style={{ color: colors.text.primary }}>47</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>Releases (30 days):</span>
                      <span style={{ color: colors.text.primary }}>3</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>Issues closed:</span>
                      <span style={{ color: colors.text.primary }}>12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>PRs merged:</span>
                      <span style={{ color: colors.text.primary }}>8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bus Factor Card */}
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
                    <Users className="h-5 w-5" />
                    Bus Factor Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-yellow-400 mb-2">
                      {scoreBreakdown.busFactor}/100
                    </div>
                    <div className="text-sm" style={{ color: colors.text.secondary }}>Good Contributor Diversity</div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${scoreBreakdown.busFactor}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>Active contributors:</span>
                      <span style={{ color: colors.text.primary }}>15</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>Top contributor %:</span>
                      <span style={{ color: colors.text.primary }}>35%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>New contributors:</span>
                      <span style={{ color: colors.text.primary }}>3</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>Maintainers:</span>
                      <span style={{ color: colors.text.primary }}>4</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Commit Timeline */}
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                <CardTitle style={{ color: colors.text.primary }}>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <CommitTimeline />
              </CardContent>
            </Card>
          </div>
        )}

        {currentTab === "alerts" && (
          <div className="space-y-6">
            {/* Alerts Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Dependency Alerts</h2>
                <p className="text-gray-400">
                  Monitor security and activity alerts for {packageId} v{version}
                </p>
              </div>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Alert Settings</DialogTitle>
                    <DialogDescription>
                      Configure notification preferences for dependency alerts
                    </DialogDescription>
                  </DialogHeader>
                  <DependencyAlertSettings
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={handleSaveSettings}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Alerts Grid */}
            {dependencyAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8" style={{ backgroundColor: colors.background.card }}>
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium" style={{ color: colors.text.primary }}>No Alerts Found</h3>
                <p className="mt-2 text-sm text-muted-foreground text-center" style={{ color: colors.text.secondary }}>
                  No alerts have been triggered for this dependency yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dependencyAlerts.map((alert) => (
                  <DependencyAlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={handleResolveAlert}
                    onSendToJira={handleSendToJira}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
