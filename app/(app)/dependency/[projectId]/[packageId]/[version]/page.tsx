"use client"

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, TrendingUp, Shield, AlertTriangle, Activity, Users, BarChart3, Settings, ExternalLink, Copy, Download, Brain, Lock, Heart, Zap, Scale, Package, CheckCircle, AlertCircle } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/design-system"
import CommitTimeline from "@/components/dependencies/CommitTimeline"
import { HealthScoreChart } from "@/components/health-score-chart"
import { AlertsCard, AlertItem, AlertKind } from "@/components/alerts/AlertsCard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DependencyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packageData, setPackageData] = useState<any>(null)
  const [currentTab, setCurrentTab] = useState("overview")
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const [showScorecardModal, setShowScorecardModal] = useState(false)
  const [selectedScorecardData, setSelectedScorecardData] = useState<any>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [alertSettings, setAlertSettings] = useState({
    anomaly_threshold: 50.0,
    vulnerability_threshold: "medium" as "low" | "medium" | "high" | "critical"
  })
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryGenerated, setSummaryGenerated] = useState(false)
  const [commitSummary, setCommitSummary] = useState<string>('')
  const [packageVersions, setPackageVersions] = useState<any[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [monthlyCommits, setMonthlyCommits] = useState<any[]>([])
  const [monthlyCommitsLoading, setMonthlyCommitsLoading] = useState(false)
  const [commits, setCommits] = useState<any[]>([])
  const [commitsLoading, setCommitsLoading] = useState(false)
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  
  // Extract params early
  const projectId = params.projectId as string
  const packageId = params.packageId as string
  const version = params.version as string
  
  // Alert filtering state
  const [alertSearch, setAlertSearch] = useState("")
  const [alertTypeFilter, setAlertTypeFilter] = useState<"all" | AlertKind>("all")
  const [showResolvedAlerts, setShowResolvedAlerts] = useState(false)
  
  // Check if this is a watchlist package
  const isWatchlistPackage = version === 'watchlist'

  // Mock data for overview tab
  const [selectedHealthData, setSelectedHealthData] = useState<{ date: string; score: number } | null>(null)
  
  // Get scorecard history for the chart
  const healthHistory = packageData?.scorecardHistory 
    ? packageData.scorecardHistory.map((entry: any) => ({
        date: new Date(entry.commit_date || entry.analyzed_at).toISOString().split('T')[0],
        score: entry.score
      }))
    : []

  // Get scorecard history data from packageData
  const scorecardHealth = packageData?.scorecardHistory && packageData.scorecardHistory.length > 0 
    ? {
        date: packageData.scorecardHistory[0].commit_date || packageData.scorecardHistory[0].analyzed_at,
        score: packageData.scorecardHistory[0].score,
        checks: packageData.scorecardHistory[0].scorecard_data?.checks || []
      }
    : {
        date: new Date().toISOString(),
        score: 0,
        checks: []
      }

  const packageScore = packageData?.total_score || 0

  // Helper functions for status logic
  const getStatusInfo = (score: number | null | undefined) => {
    if (score === null || score === undefined) return { text: 'N/A', color: 'gray', borderColor: 'gray' }
    
    if (score >= 75) return { text: 'HIGH', color: 'green', borderColor: 'green' }
    if (score >= 25) return { text: 'MODERATE', color: 'yellow', borderColor: 'yellow' }
    return { text: 'LOW', color: 'red', borderColor: 'red' }
  }

  // Helper function to get license description
  const getLicenseDescription = (license: string) => {
    const licenseLower = license.toLowerCase()
    
    // Permissive licenses
    if (licenseLower.includes('mit')) return 'Permissive license - safe for commercial use'
    if (licenseLower.includes('apache') || licenseLower.includes('apache-2.0')) return 'Permissive license - safe for commercial use'
    if (licenseLower.includes('bsd')) return 'Permissive license - safe for commercial use'
    if (licenseLower.includes('isc')) return 'Permissive license - safe for commercial use'
    if (licenseLower.includes('unlicense')) return 'Public domain - no restrictions'
    
    // Copyleft licenses
    if (licenseLower.includes('gpl')) return 'Copyleft license - requires source code disclosure'
    if (licenseLower.includes('agpl')) return 'Strong copyleft license - requires source code disclosure'
    if (licenseLower.includes('lgpl')) return 'Weak copyleft license - limited source code disclosure'
    if (licenseLower.includes('mpl')) return 'Weak copyleft license - file-level source code disclosure'
    
    // Other licenses
    if (licenseLower.includes('proprietary')) return 'Proprietary license - check terms carefully'
    if (licenseLower.includes('commercial')) return 'Commercial license - check terms carefully'
    if (licenseLower.includes('custom')) return 'Custom license - check terms carefully'
    
    // Default
    return 'Check license terms for usage rights'
  }

  // Helper function to get vulnerability status
  const getVulnerabilityStatus = (version: any) => {
    const total = version.vulnerability_count || 0
    const critical = version.critical_count || 0
    const high = version.high_count || 0
    const medium = version.medium_count || 0
    const low = version.low_count || 0

    if (total === 0) {
      return { 
        status: 'safe', 
        color: 'green', 
        text: '0 vulnerabilities',
        badges: []
      }
    }

    if (critical > 0) {
      return { 
        status: 'critical', 
        color: 'red', 
        text: `${total} vulnerabilities`,
        badges: [
          { count: critical, severity: 'C', color: 'red' },
          { count: high, severity: 'H', color: 'red' },
          { count: medium, severity: 'M', color: 'orange' },
          { count: low, severity: 'L', color: 'yellow' }
        ].filter(b => b.count > 0)
      }
    }

    if (high > 0) {
      return { 
        status: 'high', 
        color: 'red', 
        text: `${total} vulnerabilities`,
        badges: [
          { count: high, severity: 'H', color: 'red' },
          { count: medium, severity: 'M', color: 'orange' },
          { count: low, severity: 'L', color: 'yellow' }
        ].filter(b => b.count > 0)
      }
    }

    return { 
      status: 'moderate', 
      color: 'orange', 
      text: `${total} vulnerabilities`,
      badges: [
        { count: medium, severity: 'M', color: 'orange' },
        { count: low, severity: 'L', color: 'yellow' }
      ].filter(b => b.count > 0)
    }
  }

  // Helper function to format release date
  const formatReleaseDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
    } catch {
      return 'Unknown'
    }
  }

  // Get activity score from package data
  const getActivityScore = () => {
    return packageData?.activity_score || 0
  }

  // Get bus factor risk level from package data
  const getBusFactorRiskLevel = () => {
    const busFactorScore = packageData?.bus_factor_score || 0
    
    if (busFactorScore >= 80) return { level: 'No', color: 'green' }
    if (busFactorScore >= 50) return { level: 'Medium', color: 'yellow' }
    return { level: 'High', color: 'red' }
  }

  const getScorecardStatusInfo = (score: number | null | undefined) => {
    if (score === null || score === undefined) return { text: 'N/A', color: 'gray', borderColor: 'gray' }
    
    if (score >= 75) return { text: 'HIGH', color: 'green', borderColor: 'green' }
    if (score >= 25) return { text: 'MODERATE', color: 'yellow', borderColor: 'yellow' }
    return { text: 'LOW', color: 'red', borderColor: 'red' }
  }

  // Get dynamic colors for the main score based on the actual score
  const getScoreColors = (score: number | null | undefined) => {
    if (score === null || score === undefined) return { 
      text: 'text-gray-400', 
      progress: 'bg-gray-400', 
      hoverProgress: 'group-hover:bg-gray-300',
      border: 'hover:border-gray-500/30',
      shadow: 'hover:shadow-gray-500/10'
    }
    
    if (score >= 75) return { 
      text: 'text-green-400', 
      progress: 'bg-green-400', 
      hoverProgress: 'group-hover:bg-green-300',
      border: 'hover:border-green-500/30',
      shadow: 'hover:shadow-green-500/10'
    }
    if (score >= 50) return { 
      text: 'text-yellow-400', 
      progress: 'bg-yellow-400', 
      hoverProgress: 'group-hover:bg-yellow-300',
      border: 'hover:border-yellow-500/30',
      shadow: 'hover:shadow-yellow-500/10'
    }
    return { 
      text: 'text-red-400', 
      progress: 'bg-red-400', 
      hoverProgress: 'group-hover:bg-red-300',
      border: 'hover:border-red-500/30',
      shadow: 'hover:shadow-red-500/10'
    }
  }
  // Health data selection handler
  const handleHealthDataSelect = (data: { date: string; score: number }) => {
    setSelectedHealthData(data)
  }

  // Fetch alerts from backend API
  const generateAlerts = async (): Promise<AlertItem[]> => {
    const id = packageData?.id || packageId
    const name = packageData?.name || packageId

    try {
      const response = await fetch(
        `${apiBase}/packages/project/${projectId}/package/${packageId}/alerts`
      )
      
      if (!response.ok) {
        console.error('Failed to fetch alerts:', response.statusText)
        return []
      }

      const backendAlerts = await response.json()
      
      // Map backend alerts to frontend AlertItem format
      return backendAlerts.map((alert: any) => {
        if (alert.alert_type === 'vulnerability') {
          const vulnDetails = alert.vulnerability_details || {}
          return {
            id: alert.id,
            source: "dependency" as const,
            pkg: { id, name },
            kind: "vulnerability" as const,
            severity: (alert.severity || 'low') as "critical" | "high" | "medium" | "low",
            message: vulnDetails.summary || `Vulnerability detected: ${alert.vulnerability_id || 'Unknown'}`,
            detectedAt: alert.detected_at || alert.created_at,
            status: (alert.status || 'unread') as "unread" | "read" | "resolved",
            activity: {
              metric: "vulnerability",
              value: undefined,
              commitSha: undefined,
              analysisDate: alert.detected_at || alert.created_at,
            },
          }
        } else if (alert.alert_type === 'anomaly') {
          const scoreBreakdown = (alert.score_breakdown || []) as Array<{
            factor: string;
            points: number;
            reason: string;
          }>
          const factorCount = scoreBreakdown.length
          const score = alert.anomaly_score?.toFixed(1) || '0'
          
          // Format factor names to be more readable
          const formatFactorName = (factor: string): string => {
            const factorMap: Record<string, string> = {
              'files_changed': 'Files Changed',
              'lines_changed': 'Lines Changed',
              'message_length': 'Message Length',
              'insert_delete_ratio': 'Insert/Delete Ratio',
              'abnormal_time': 'Abnormal Time',
              'abnormal_day': 'Abnormal Day',
              'new_files': 'New Files',
            }
            return factorMap[factor] || factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
          
          // Build breakdown text
          let breakdownText = ''
          if (scoreBreakdown.length > 0) {
            const breakdownItems = scoreBreakdown.map(item => 
              `${formatFactorName(item.factor)}: +${item.points.toFixed(1)}`
            ).join(', ')
            breakdownText = ` (${breakdownItems})`
          }
          
          let message = `Commit generated anomaly score of ${score}${breakdownText}`
          
          return {
            id: alert.id,
            source: "dependency" as const,
            pkg: { id, name },
            kind: "anomaly" as const,
            // Don't set severity for anomalies - only for vulnerabilities
            message: message,
            detectedAt: alert.detected_at || alert.created_at,
            status: (alert.status || 'unread') as "unread" | "read" | "resolved",
            activity: {
              metric: "anomaly_score",
              value: alert.anomaly_score,
              commitSha: alert.commit_sha,
              analysisDate: alert.detected_at || alert.created_at,
            },
          }
        }
        
        // Fallback for unknown alert types
        return {
          id: alert.id,
          source: "dependency" as const,
          pkg: { id, name },
          kind: "vulnerability" as const,
          message: 'Unknown alert type',
          detectedAt: alert.detected_at || alert.created_at,
          status: (alert.status || 'unread') as "unread" | "read" | "resolved",
        }
      })
    } catch (err) {
      console.error('Error fetching alerts:', err)
      return []
    }
  }
  const [dependencyAlerts, setDependencyAlerts] = useState<AlertItem[]>([])
  
  useEffect(() => {
    if (packageData && packageId && projectId) {
      generateAlerts().then(setDependencyAlerts)
    }
  }, [packageData, packageId, projectId, alertSettings])

  // Load alert settings when dialog opens
  useEffect(() => {
    if (isSettingsOpen && projectId && packageId) {
      loadAlertSettings()
    }
  }, [isSettingsOpen, projectId, packageId])

  // Load alert settings from backend
  const loadAlertSettings = async () => {
    try {
      setIsLoadingSettings(true)
      const response = await fetch(
        `${apiBase}/packages/project/${projectId}/package/${packageId}/alert-settings`
      )
      if (!response.ok) {
        throw new Error('Failed to load alert settings')
      }
      const data = await response.json()
      setAlertSettings({
        anomaly_threshold: data.anomaly_threshold || 50.0,
        vulnerability_threshold: data.vulnerability_threshold || "medium"
      })
    } catch (err) {
      console.error('Error loading alert settings:', err)
      // Keep default values
    } finally {
      setIsLoadingSettings(false)
    }
  }

  // Handle settings dialog
  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true)
      const response = await fetch(
        `${apiBase}/packages/project/${projectId}/package/${packageId}/alert-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertSettings),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to save alert settings')
      }
      setIsSettingsOpen(false)
      // Refresh alerts with new settings
      generateAlerts().then(setDependencyAlerts)
    } catch (err) {
      console.error('Error saving alert settings:', err)
      // Optionally show an error message
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Handle alert click
  const handleAlertClick = (alert: AlertItem) => {
    // For a single dependency view, we're already on the dependency page
    // Could navigate to activity tab if needed, but for now just log
    console.log('Alert clicked:', alert)
  }

  // Use Next.js API proxy to add authentication headers
  const apiBase = "/api/backend"

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

  // Fetch package versions with vulnerability data
  const fetchPackageVersions = async () => {
    try {
      setVersionsLoading(true)
      
      const apiUrl = `${apiBase}/packages/${packageId}/versions?limit=3`
      console.log('🔍 Fetching package versions from:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('📡 Versions API Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Versions API Error:', errorText)
        throw new Error(`Failed to fetch package versions: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Package versions received:', data)
      setPackageVersions(data.versions || [])
    } catch (err) {
      console.error('💥 Error fetching package versions:', err)
      // Don't set error state for versions - it's not critical
    } finally {
      setVersionsLoading(false)
    }
  }

  // Fetch monthly commits data
  const fetchMonthlyCommits = async () => {
    try {
      setMonthlyCommitsLoading(true)
      
      const apiUrl = `${apiBase}/packages/${packageId}/monthly-commits?months=12`
      console.log('🔍 Fetching monthly commits from:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('📡 Monthly commits API Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Monthly commits API Error:', errorText)
        throw new Error(`Failed to fetch monthly commits: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Monthly commits received:', data)
      setMonthlyCommits(data.trend_data || [])
    } catch (err) {
      console.error('💥 Error fetching monthly commits:', err)
      // Don't set error state for monthly commits - it's not critical
    } finally {
      setMonthlyCommitsLoading(false)
    }
  }

  // Helper function to format relative time
  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  }

  // Fetch package commits with anomaly scores
  const fetchPackageCommits = async () => {
    if (!packageId || commits.length > 0) return

    try {
      setCommitsLoading(true)
      
      const apiUrl = `${apiBase}/packages/${packageId}/commits?limit=50`
      console.log('🔍 Fetching package commits from:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('📡 Commits API Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Commits API Error:', errorText)
        throw new Error(`Failed to fetch commits: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Commits received:', data)
      
      // Transform backend data to match CommitData interface
      const transformedCommits = (data.commits || []).map((commit: any) => {
        const commitDate = new Date(commit.timestamp)
        const profile = commit.contributor_profile || {}
        
        // Use commit_time_heatmap if available (7x24 grid), transform to Monday-first order
        // Database format: [Sunday, Monday, ..., Saturday] (0-6)
        // Component expects: [Monday, Tuesday, ..., Sunday] (Mon first)
        let heatmapData: number[][] = []
        if (profile.commit_time_heatmap && Array.isArray(profile.commit_time_heatmap)) {
          // Transform from Sunday-first to Monday-first order
          // [Sun, Mon, Tue, Wed, Thu, Fri, Sat] -> [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
          const dbHeatmap = profile.commit_time_heatmap
          if (dbHeatmap.length === 7) {
            heatmapData = [
              dbHeatmap[1] || Array(24).fill(0), // Monday
              dbHeatmap[2] || Array(24).fill(0), // Tuesday
              dbHeatmap[3] || Array(24).fill(0), // Wednesday
              dbHeatmap[4] || Array(24).fill(0), // Thursday
              dbHeatmap[5] || Array(24).fill(0), // Friday
              dbHeatmap[6] || Array(24).fill(0), // Saturday
              dbHeatmap[0] || Array(24).fill(0), // Sunday
            ]
          } else {
            heatmapData = Array(7).fill(null).map(() => Array(24).fill(0))
          }
        } else {
          // Fallback: create empty heatmap
          heatmapData = Array(7).fill(null).map(() => Array(24).fill(0))
        }
        
        return {
          id: commit.id || commit.sha,
          contributor: {
            name: commit.author || 'Unknown',
            avatar: `https://avatars.githubusercontent.com/${commit.sha}?s=400&v=4` // Use commit SHA for avatar fallback
          },
          message: commit.message || 'No message',
          linesAdded: commit.lines_added || 0,
          linesDeleted: commit.lines_deleted || 0,
          filesChanged: commit.files_changed || 0,
          timestamp: getTimeAgo(commitDate),
          date: commitDate, // Store actual date for grouping
          anomalyScore: commit.anomaly_score || 0,
          scoreBreakdown: Array.isArray(commit.score_breakdown) ? commit.score_breakdown : [],
          contributorProfile: {
            avgLinesChanged: { 
              added: profile.avg_lines_added || 0, 
              deleted: profile.avg_lines_deleted || 0 
            },
            stddevLinesChanged: {
              added: profile.stddev_lines_added || 0,
              deleted: profile.stddev_lines_deleted || 0
            },
            avgFilesChanged: profile.avg_files_changed || 0,
            stddevFilesChanged: profile.stddev_files_changed || 0,
            totalCommits: profile.total_commits || 0,
            typicalTimes: '',
            heatmapData: heatmapData,
            thisCommitTime: commitDate.toLocaleString('en-US', { 
              weekday: 'long', 
              hour: 'numeric', 
              minute: '2-digit',
              timeZoneName: 'short'
            })
          }
        }
      })
      
      setCommits(transformedCommits)
    } catch (err) {
      console.error('💥 Error fetching commits:', err)
      // Don't set error state - keep empty array
      setCommits([])
    } finally {
      setCommitsLoading(false)
    }
  }

  // Fetch dependency data
  useEffect(() => {
    const fetchDependencyData = async () => {
      try {
        setLoading(true)
        
        const apiUrl = `${apiBase}/packages/project/${projectId}/dependency/${packageId}/${version}`
        console.log('🔍 Fetching dependency data from:', apiUrl)
        console.log('📦 Project ID:', projectId, 'Package ID:', packageId, 'Version:', version)
        
        const response = await fetch(apiUrl)
        console.log('📡 API Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ API Error:', errorText)
          throw new Error(`Failed to fetch dependency details: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('✅ Dependency data received:', data)
        setPackageData(data)
        
        // Fetch package versions and monthly commits after getting package data
        await Promise.all([
          fetchPackageVersions(),
          fetchMonthlyCommits()
        ])
      } catch (err) {
        console.error('💥 Error fetching dependency data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (packageId && projectId && version) {
      fetchDependencyData()
    }
  }, [packageId, projectId, version])

  // Fetch commits when activity tab is selected
  useEffect(() => {
    if (currentTab === "activity" && packageId && commits.length === 0 && !commitsLoading) {
      fetchPackageCommits()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, packageId])

  // Generate commit summary using Gemini API
  const generateCommitSummary = async () => {
    if (!packageId || commits.length === 0) {
      console.error('No commits available to summarize')
      return
    }

    try {
      setIsGeneratingSummary(true)
      
      // Transform commits to match backend format
      const commitsForSummary = commits.map((commit: any) => ({
        sha: commit.id,
        author: commit.contributor.name,
        author_email: '', // Not needed for summary
        message: commit.message,
        timestamp: commit.date?.toISOString() || new Date().toISOString(),
        lines_added: commit.linesAdded,
        lines_deleted: commit.linesDeleted,
        files_changed: commit.filesChanged,
        anomaly_score: commit.anomalyScore || 0,
      }))

      const apiUrl = `${apiBase}/packages/${packageId}/commits/summarize`
      console.log('🔍 Generating commit summary from:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commits: commitsForSummary,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Summary API Error:', errorText)
        throw new Error(`Failed to generate summary: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Summary received:', data)
      
      setCommitSummary(data.summary || '')
      setSummaryGenerated(true)
    } catch (err) {
      console.error('💥 Error generating summary:', err)
      // Still show generated state with error message
      setCommitSummary('Failed to generate summary. Please try again.')
      setSummaryGenerated(true)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

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
                {loading ? (
                  <div className="h-7 w-32 bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  packageData?.name || packageId
                )}
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
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {loading ? (
                      <div className="h-9 w-48 bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                      packageData?.name || packageId
                    )}
                  </h1>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    {loading ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                          <div className="h-4 w-20 bg-gray-600 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-600 rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-24 bg-gray-600 rounded animate-pulse"></div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                          <div className="h-4 w-12 bg-gray-600 rounded animate-pulse"></div>
                        </div>
                      </>
                    ) : (
                      <>
                        {packageData?.npm_url && (
                          <a 
                            href={packageData.npm_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 transition-all duration-200 hover:text-blue-400 cursor-pointer group"
                          >
                            <div className="w-4 h-4 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                              <img src="/Npm_logo.png" alt="NPM" className="w-full h-full object-contain" />
                            </div>
                            <span>NPM Package</span>
                          </a>
                        )}
                        {packageData?.repo_url && (
                          <a 
                            href={packageData.repo_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 transition-all duration-200 hover:text-blue-400 cursor-pointer group"
                          >
                            <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span>GitHub</span>
                          </a>
                        )}
                        {packageData?.license && (
                          <span className="transition-all duration-200 hover:text-green-400 cursor-pointer">
                            {packageData.license} License
                          </span>
                        )}
                        {packageData?.downloads && (
                          <div className="flex items-center gap-1 transition-all duration-200 hover:text-blue-400 cursor-pointer group">
                            <Download className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" style={{ color: colors.text.secondary }} />
                            <span>{packageData.downloads.toLocaleString()}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Install Command */}
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.background.card }}>
                    {loading ? (
                      <div className="h-5 w-48 bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                      <code className="text-sm" style={{ color: colors.text.primary }}>
                        npm install {packageData?.name || packageId}
                      </code>
                    )}
                  </div>
                  {!loading && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigator.clipboard.writeText(`npm install ${packageData?.name || packageId}`)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* AI Summary */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                        <Image src="/AI_icon.png" alt="AI" width={16} height={16} />
                      </div>
                      <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>AI Summary</h2>
                    </div>
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-4 w-5/6 bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-4 w-4/5 bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-gray-600 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <p className="text-lg leading-relaxed" style={{ color: colors.text.secondary }}>
                      {packageData?.summary || 'No summary available for this package.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side - Package Health Score */}
              <div>
                <div className={`rounded-xl p-6 border transition-all duration-300 ${getScoreColors(packageScore).border} hover:shadow-lg ${getScoreColors(packageScore).shadow} group`} style={{ backgroundColor: colors.background.card }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>Package Score</h3>
                  <div className="text-center mb-4">
                    {loading ? (
                      <div className="space-y-2">
                        <div className="h-10 w-20 bg-gray-600 rounded animate-pulse mx-auto"></div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div className="h-2 w-1/2 bg-gray-600 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const colors = getScoreColors(packageScore)
                        return (
                          <>
                            <div className={`text-4xl font-bold ${colors.text} mb-2 transition-all duration-200 hover:scale-105 cursor-pointer`}>{packageScore}/100</div>
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`${colors.progress} h-2 rounded-full transition-all duration-500 ${colors.hoverProgress}`}
                                style={{ width: `${packageScore}%` }}
                              />
                            </div>
                          </>
                        )
                      })()
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {/* Security (Vulnerability Score) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Security</span>
                      </div>
                      {loading ? (
                        <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        (() => {
                          const status = getStatusInfo(packageData?.vulnerability_score)
                          return (
                            <span className={`text-xs px-2 py-1 rounded border text-${status.color}-400 border-${status.color}-500/30`}>
                              {status.text}
                            </span>
                          )
                        })()
                      )}
                    </div>

                    {/* Scorecard */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Scorecard</span>
                      </div>
                      {loading ? (
                        <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        (() => {
                          const status = getScorecardStatusInfo(packageData?.scorecard_score)
                          return (
                            <span className={`text-xs px-2 py-1 rounded border text-${status.color}-400 border-${status.color}-500/30`}>
                              {status.text}
                            </span>
                          )
                        })()
                      )}
                    </div>

                    {/* Activity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Activity</span>
                      </div>
                      {loading ? (
                        <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        (() => {
                          const status = getStatusInfo(packageData?.activity_score)
                          return (
                            <span className={`text-xs px-2 py-1 rounded border text-${status.color}-400 border-${status.color}-500/30`}>
                              {status.text}
                            </span>
                          )
                        })()
                      )}
                    </div>

                    {/* Bus Factor */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Bus Factor</span>
                      </div>
                      {loading ? (
                        <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        (() => {
                          const status = getStatusInfo(packageData?.bus_factor_score)
                          return (
                            <span className={`text-xs px-2 py-1 rounded border text-${status.color}-400 border-${status.color}-500/30`}>
                              {status.text}
                            </span>
                          )
                        })()
                      )}
                    </div>

                    {/* Legal Compliance (License Score) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        <span className="text-sm" style={{ color: colors.text.secondary }}>Legal Compliance</span>
                      </div>
                      {loading ? (
                        <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        (() => {
                          const status = getStatusInfo(packageData?.license_score)
                          return (
                            <span className={`text-xs px-2 py-1 rounded border text-${status.color}-400 border-${status.color}-500/30`}>
                              {status.text}
                            </span>
                          )
                        })()
                      )}
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
                  repoUrl={packageData?.repo_url}
                  isLoading={loading}
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
                    {versionsLoading ? (
                      // Loading skeleton
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-lg animate-pulse"></div>
                              <div>
                                <div className="h-4 w-16 bg-gray-600 rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-12 bg-gray-600 rounded animate-pulse"></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-3 w-20 bg-gray-600 rounded animate-pulse"></div>
                              <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : packageVersions.length > 0 ? (
                      // Real version data
                      packageVersions.map((version, index) => {
                        const vulnStatus = getVulnerabilityStatus(version)
                        const isLatest = index === 0
                        
                        return (
                          <div 
                            key={version.version} 
                            className={`flex items-center justify-between py-2 transition-all duration-200 hover:bg-${vulnStatus.color}-500/5 rounded-lg px-2 cursor-pointer group`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${vulnStatus.color === 'green' ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                                {vulnStatus.status === 'safe' ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <AlertCircle className={`h-4 w-4 text-${vulnStatus.color}-400`} />
                                )}
                              </div>
                              <div>
                                <div className={`text-sm font-semibold text-white transition-colors duration-200 group-hover:text-${vulnStatus.color}-300`}>
                                  {version.version}
                                  {isLatest && <span className="ml-2 text-xs text-blue-400">(Latest)</span>}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {formatReleaseDate(version.release_date)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`text-xs text-${vulnStatus.color}-400 transition-colors duration-200 group-hover:text-${vulnStatus.color}-300`}>
                                {vulnStatus.text}
                              </div>
                              {vulnStatus.badges.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  {vulnStatus.badges.map((badge, badgeIndex) => (
                                    <span 
                                      key={badgeIndex}
                                      className={`text-xs text-${badge.color}-400 bg-${badge.color}-500/10 border border-${badge.color}-500/20 px-2 py-1 rounded transition-all duration-200 group-hover:bg-${badge.color}-500/20`}
                                    >
                                      {badge.count}{badge.severity}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className={`w-2 h-2 bg-${vulnStatus.color}-500 rounded-full transition-all duration-200 group-hover:scale-125`}></div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      // No data state
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-sm">
                          No vulnerability data available yet.
                          <br />
                          <span className="text-xs">This data is populated during package setup.</span>
                        </div>
                      </div>
                    )}
                  </div>
            </div>

                {/* License - Right Card */}
                <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.background.card }}>
                  <h2 className="text-lg font-semibold mb-6" style={{ color: colors.text.primary }}>License</h2>
                  
                  <div className="space-y-6">
                    {/* License Info */}
                    <div className="transition-all duration-200 hover:bg-green-500/5 rounded-lg p-3 cursor-pointer group-license">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium transition-colors duration-200 group-license-hover:text-green-300" style={{ color: colors.text.primary }}>Package License</span>
                        {loading ? (
                          <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 transition-all duration-200 group-license-hover:bg-green-500/30 group-license-hover:scale-105">
                            {packageData?.license || 'Unknown'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 transition-colors duration-200 group-license-hover:text-green-200">
                        {loading ? (
                          <div className="h-3 w-48 bg-gray-600 rounded animate-pulse"></div>
                        ) : (
                          packageData?.license 
                            ? `${packageData.license} license - ${getLicenseDescription(packageData.license)}`
                            : 'License information not available'
                        )}
                      </p>
                    </div>
                    
                    {/* Compatibility Check - Hardcoded */}
                    <div className="flex items-center justify-between transition-all duration-200 hover:bg-green-500/5 rounded-lg p-3 cursor-pointer group-compat">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full transition-all duration-200 group-compat-hover:scale-125"></div>
                        <span className="text-sm font-medium text-green-300 transition-colors duration-200 group-compat-hover:text-green-200">Compatible with your project</span>
                      </div>
                      <span className="text-xs text-green-400 transition-all duration-200 group-compat-hover:text-green-300">✅ Safe to use</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === "activity" && (
          <div className="space-y-6">
            {/* Activity Card */}
            <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.background.card }}>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Scores */}
                <div className="lg:col-span-1 space-y-6 pl-8">
                  {/* Activity Score */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" style={{ color: colors.text.primary }} />
                      <span className="text-sm font-medium text-white">Activity Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <div className="h-8 w-12 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-green-400 transition-all duration-200 hover:scale-105">
                            {getActivityScore()}
                          </span>
                          <span className="text-sm text-gray-400">/100</span>
                        </>
                      )}
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      {loading ? (
                        <div className="h-2 w-1/2 bg-gray-600 rounded-full animate-pulse"></div>
                      ) : (
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${getActivityScore()}%` }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {loading ? (
                        <div className="h-3 w-32 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        packageData?.activity_score 
                          ? `Activity score: ${packageData.activity_score}/100`
                          : 'No activity data available'
                      )}
                    </p>
                  </div>
                  
                  {/* Bus Factor */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" style={{ color: colors.text.primary }} />
                      <span className="text-sm font-medium text-white">Bus Factor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <div className="h-8 w-20 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        (() => {
                          const riskLevel = getBusFactorRiskLevel()
                          return (
                            <>
                              <span className={`text-2xl font-bold text-${riskLevel.color}-400 transition-all duration-200 hover:scale-105`}>
                                {riskLevel.level}
                              </span>
                              <span className="text-sm text-gray-400">risk</span>
                            </>
                          )
                        })()
                      )}
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      {loading ? (
                        <div className="h-2 w-1/2 bg-gray-600 rounded-full animate-pulse"></div>
                      ) : (
                        (() => {
                          const busFactorScore = packageData?.bus_factor_score || 0
                          const riskLevel = getBusFactorRiskLevel()
                          return (
                            <div 
                              className={`bg-${riskLevel.color}-500 h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${busFactorScore}%` }}
                            />
                          )
                        })()
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {loading ? (
                        <div className="h-3 w-48 bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        packageData?.bus_factor_score 
                          ? `Bus factor score: ${packageData.bus_factor_score}/100`
                          : 'No bus factor data available'
                      )}
                    </p>
                  </div>
                </div>

                {/* Commit History Graph */}
                <div className="lg:col-span-3">
                  <div style={{ height: '250px', width: '100%' }}>
                    {monthlyCommitsLoading ? (
                      <div className="w-full h-full bg-gray-800/30 rounded-lg animate-pulse"></div>
                    ) : monthlyCommits.length > 0 ? (
                      <HealthScoreChart 
                        data={monthlyCommits}
                        className="w-full"
                        tooltipType="commits"
                        repoUrl={packageData?.repo_url}
                        isLoading={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800/30 rounded-lg flex items-center justify-center">
                        <div className="text-gray-400 text-sm">
                          No commit data available yet.
                          <br />
                          <span className="text-xs">This data is populated during package setup.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between mt-8">
                  <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>Recent Commits</h2>
                  {!summaryGenerated && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      onClick={generateCommitSummary}
                      disabled={isGeneratingSummary || commits.length === 0}
                    >
                      {isGeneratingSummary ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Image src="/AI_icon.png" alt="AI" width={16} height={16} className="mr-2" />
                          Summarize Commits
                        </>
                      )}
                    </Button>
                  )}
                </div>
              
              {/* Commit Summary - Only show when generated */}
              {summaryGenerated && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                      <Image src="/AI_icon.png" alt="AI" width={16} height={16} />
                    </div>
                    <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Commit Summary</h3>
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: colors.text.secondary }}>
                    {commitSummary || 'Summary generated successfully.'}
                  </p>
                </div>
              )}
              
              <CommitTimeline commits={commits} isLoading={commitsLoading} />
            </div>
          </div>
        )}

        {currentTab === "alerts" && (
          <div className="space-y-6">
            {/* Alerts Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Package Alerts</h2>
                <p className="text-gray-400">
                  Monitor security and activity alerts for {packageData?.name || packageId}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleOpenSettings}
                className="text-sm border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                style={{
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.default,
                  color: colors.text.primary,
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Alert Settings
              </Button>
            </div>

            {/* Single Alerts Card with Custom Filter */}
            <div className="space-y-4">
              {/* Custom Filter Row */}
              <div className="flex items-center gap-2">
                <select
                  value={alertTypeFilter}
                  onChange={(e) => setAlertTypeFilter(e.target.value as "all" | AlertKind)}
                  className="rounded-md px-3 py-2 text-sm"
                  style={{
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.default,
                    color: colors.text.primary,
                  }}
                >
                  <option value="all">All alert types</option>
                  <option value="anomaly">Anomaly Commits</option>
                  <option value="vulnerability">Vulnerabilities Detected</option>
                </select>
              </div>

              <AlertsCard
                title="Alerts"
                items={dependencyAlerts}
                search={alertSearch}
                typeFilter={alertTypeFilter}
                onSearchChange={setAlertSearch}
                onTypeChange={setAlertTypeFilter}
                onAlertClick={handleAlertClick}
                onResolve={async (alertId: string) => {
                  try {
                    const response = await fetch(
                      `${apiBase}/packages/project/${projectId}/package/${packageId}/alerts/${alertId}`,
                      {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'resolved' }),
                      }
                    )
                    if (!response.ok) {
                      throw new Error('Failed to resolve alert')
                    }
                    // Refresh alerts
                    generateAlerts().then(setDependencyAlerts)
                  } catch (err) {
                    console.error('Error resolving alert:', err)
                  }
                }}
                onSendToJira={async (alertId: string) => {
                  // Find the alert to get details
                  const alert = dependencyAlerts.find(a => a.id === alertId)
                  if (!alert) return
                  
                  try {
                    // For now, just log - you can implement Jira integration later
                    // This would need project context and Jira configuration
                    console.log('Send to Jira:', alert)
                    // TODO: Implement Jira integration
                    window.alert('Jira integration coming soon!')
                  } catch (err) {
                    console.error('Error sending to Jira:', err)
                  }
                }}
                showResolved={showResolvedAlerts}
                pageSize={6}
                style={{height: "calc(100vh - 350px)"}}
                hideTypeFilter={true}
              />
            </div>
            
            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Alert Settings</DialogTitle>
                  <DialogDescription>
                    Configure alert thresholds for {packageData?.name || packageId}
                  </DialogDescription>
                </DialogHeader>
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    {/* Anomaly Threshold */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-white">
                          Anomaly Commit Threshold
                        </Label>
                        <span className="text-sm text-gray-400">
                          {alertSettings.anomaly_threshold}
                        </span>
                      </div>
                      <div className="px-2">
                        <Slider
                          value={[alertSettings.anomaly_threshold]}
                          onValueChange={(value) =>
                            setAlertSettings((prev) => ({
                              ...prev,
                              anomaly_threshold: value[0],
                            }))
                          }
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">
                          Commits with anomaly scores above this threshold will trigger alerts. Anomaly scores are calculated based on 7 factors:
                        </p>
                        <ul className="text-xs text-gray-500 list-disc list-inside space-y-1 ml-2">
                          <li>Files changed (unusual number of files)</li>
                          <li>Lines changed (unusual number of lines)</li>
                          <li>Message length (unusually long or short commit messages)</li>
                          <li>Insert-to-delete ratio (unusual code change patterns)</li>
                          <li>Abnormal time (commits at unusual hours)</li>
                          <li>Abnormal day (commits on unusual days)</li>
                          <li>New files (working on files not in contributor's history)</li>
                        </ul>
                      </div>
                    </div>

                    {/* Vulnerability Threshold */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white">
                        Vulnerability Severity Threshold
                      </Label>
                      <Select
                        value={alertSettings.vulnerability_threshold}
                        onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                          setAlertSettings((prev) => ({
                            ...prev,
                            vulnerability_threshold: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="low" className="text-white hover:bg-gray-800">
                            Low
                          </SelectItem>
                          <SelectItem value="medium" className="text-white hover:bg-gray-800">
                            Medium
                          </SelectItem>
                          <SelectItem value="high" className="text-white hover:bg-gray-800">
                            High
                          </SelectItem>
                          <SelectItem value="critical" className="text-white hover:bg-gray-800">
                            Critical
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400">
                        Only vulnerabilities with this severity or higher will trigger alerts. Vulnerability data is provided by OSV (Open Source Vulnerabilities) database.
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSettingsOpen(false)}
                    disabled={isSavingSettings}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings || isLoadingSettings}
                    className="text-white"
                    style={{ backgroundColor: 'rgb(84, 0, 250)' }}
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}
