"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { 
  AlertTriangle, 
  Calendar, 
  Code, 
  ExternalLink, 
  GitCommit, 
  GitFork, 
  GithubIcon, 
  GitPullRequest, 
  Star, 
  TrendingUp,
  Activity,
  Users,
  Brain,
  BarChart3,
  ArrowLeft,
  Loader2,
  Clock,
  GitBranch,
  FileText,
  Plus,
  Minus,
  Eye,
  Package
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader } from "@/components/page-header"
import { FullWidthContainer, FullWidthPage } from "@/components/full-width-container"
import { HealthScoreChart } from "@/components/health-score-chart"
import { useRouter } from "next/navigation"

interface PackageDetails {
  name: string
  description: string
  version: string
  stars: number
  forks: number
  lastUpdated: string
  language: string
  healthScore: number
  activityScore: number
  busFactor: number
  repoUrl?: string
  npmUrl?: string
  aiOverview: string
  aiSummary?: string
  aiConfidence?: number
  aiModelUsed?: string
  aiCreatedAt?: string
  maintainers: Array<{
    name: string
    avatar?: string
    initials: string
  }>
  commits: Array<{
    id: string
    message: string
    author: string
    time: string
    avatar?: string
    initials: string
    linesAdded: number
    linesDeleted: number
    filesChanged: number
    isSuspicious: boolean
    suspiciousReason: string
  }>
  healthHistory: Array<{
    date: string
    score: number
    commitSha?: string
  }>
  alerts: Array<{
    id: number
    type: string
    severity: string
    message: string
    description: string
    time: string
    isResolved: boolean
    commitHash: string
  }>
  // New fields for activity score breakdown
  activityBreakdown: {
    commitFrequency: number
    contributorDiversity: number
    codeChurn: number
    developmentConsistency: number
  }
  // New fields for bus factor details
  busFactorDetails: {
    level: number
    risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'MILD' | 'NONE'
    description: string
    topContributors: Array<{
      name: string
      commits: number
      linesChanged: number
      filesChanged: number
      percentage: number
      avatar?: string
      initials: string
    }>
  }
  // New fields for activity data
  activityData: {
    commitsPerWeek: number
    activeDays: Array<{
      day: string
      hour: number
      intensity: number
    }>
  }
  // New fields for scorecard health data
  scorecardHealth: {
    date: string
    score: number
    checks: Array<{
      name: string
      score: number
      reason: string
      details: string[] | null
      documentation: {
        short: string
        url: string
      }
    }>
  } | Array<{
    date: string
    score: number
    commitSha?: string
    checks: Array<{
      name: string
      score: number
      reason: string
      details: string[] | null
      documentation: {
        short: string
        url: string
      }
    }>
  }>
  // New field for activity heatmap
  activity_heatmap?: {
    dayOfWeek: {
      [key: string]: number; // e.g., "0": 10, "1": 8, "2": 12
    };
  };
}

export default function PackageDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userWatchlistId = searchParams.get("id")
  const [packageData, setPackageData] = useState<PackageDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [commitSummary, setCommitSummary] = useState<string | null>(null)
  const [selectedHealthData, setSelectedHealthData] = useState<{ date: string; score: number } | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [alertFilter, setAlertFilter] = useState<"all" | "open" | "resolved">("all")

  // Fetch package details from API
  useEffect(() => {
    const fetchPackageDetails = async () => {
      setIsLoading(true)
      try {
        // Fetch data from the new API endpoint
        const response = await fetch(`http://localhost:3000/watchlist/${userWatchlistId}/details`)
        if (!response.ok) {
          throw new Error('Failed to fetch package details')
        }
        const data = await response.json()
        
        // Transform the API data to match our PackageDetails interface
        // Use real data where available, fallback to mock data for now
        const transformedData: PackageDetails = {
          name: data.name || "Unknown Package",
          description: data.description || "No description available",
          version: data.version || "Unknown",
          stars: data.stars || 0,
          forks: data.forks || 0,
          lastUpdated: data.last_updated || "Unknown",
          language: "JavaScript", // This would come from the package data
          healthScore: data.health_score || 0,
          activityScore: data.activity_score || 0,
          busFactor: data.bus_factor || 0,
          // Store the URLs for the buttons
          repoUrl: data.repo_url,
          npmUrl: data.npm_url,
          // Store AI summary data
          aiSummary: data.ai_summary,
          aiConfidence: data.ai_confidence,
          aiModelUsed: data.ai_model_used,
          aiCreatedAt: data.ai_created_at,
          aiOverview: "This package shows excellent maintainability with consistent commit activity and a healthy contributor base. The bus factor indicates good distribution of responsibility among maintainers. Recent activity suggests active development with regular updates and bug fixes.",
          maintainers: [
            { name: "John Dalton", avatar: "/placeholder-user.jpg", initials: "JD" },
            { name: "Mathias Bynens", avatar: "/placeholder-user.jpg", initials: "MB" },
          ],
          commits: [
            {
              id: "abc123",
              message: "Fix: Resolve issue with _.debounce when used with React hooks and ensure proper cleanup of event listeners to prevent memory leaks in long-running applications",
              author: "John Smith",
              time: "2 hours ago",
              avatar: "/placeholder-user.jpg",
              initials: "JS",
              linesAdded: 45,
              linesDeleted: 12,
              filesChanged: 3,
              isSuspicious: false,
              suspiciousReason: "",
            },
            {
              id: "def456",
              message: "Refactor: Improve performance of _.map for large arrays by implementing optimized iteration patterns and reducing memory allocation overhead",
              author: "Alex Turner",
              time: "2 days ago",
              avatar: "/placeholder-user.jpg",
              initials: "AT",
              linesAdded: 234,
              linesDeleted: 89,
              filesChanged: 8,
              isSuspicious: true,
              suspiciousReason: "Large code changes (234 lines added, 89 deleted) across 8 files detected. This commit shows unusually high churn which could indicate rushed development, potential bugs, or incomplete refactoring. The AI detected patterns consistent with risky changes that may introduce instability.",
            },
            {
              id: "ghi789",
              message: "Docs: Update comprehensive documentation for _.throttle including usage examples, edge cases, and performance considerations for production environments",
              author: "Emma Wilson",
              time: "3 days ago",
              avatar: "/placeholder-user.jpg",
              initials: "EW",
              linesAdded: 156,
              linesDeleted: 23,
              filesChanged: 5,
              isSuspicious: false,
              suspiciousReason: "",
            },
            {
              id: "jkl012",
              message: "Test: Add comprehensive test suite for _.memoize edge cases including cache invalidation, memory management, and concurrent access scenarios",
              author: "Sarah Johnson",
              time: "4 days ago",
              avatar: "/placeholder-user.jpg",
              initials: "SJ",
              linesAdded: 89,
              linesDeleted: 5,
              filesChanged: 4,
              isSuspicious: false,
              suspiciousReason: "",
            },
          ],
          healthHistory: data.health_history || [
            { date: "2024-01-15", score: 7.8 },
            { date: "2024-02-15", score: 8.2 },
            { date: "2024-03-15", score: 8.5 },
            { date: "2024-04-15", score: 8.3 },
            { date: "2024-05-15", score: 8.7 },
            { date: "2024-06-15", score: 8.9 },
            { date: "2024-07-15", score: 9.1 },
            { date: "2024-08-15", score: 8.8 },
            { date: "2024-09-15", score: 9.2 },
            { date: "2024-10-15", score: 9.0 },
            { date: "2024-11-15", score: 9.3 },
            { date: "2024-12-15", score: 9.5 },
          ],
          alerts: [
            {
              id: 1,
              type: "high_loc",
              severity: "medium",
              message: "High LOC PR Detected",
              description: "PR #1234 contains over 500 lines of code which exceeds our recommended limit of 300 lines per pull request. Large changes like this can be difficult to review thoroughly and may introduce bugs or security vulnerabilities. Consider breaking this into smaller, more manageable pull requests to improve code quality and review efficiency.",
              time: "2 days ago",
              isResolved: false,
              commitHash: "abc123",
            },
            {
              id: 2,
              type: "security_scan",
              severity: "high",
              message: "Security Vulnerability Detected",
              description: "Dependency scan revealed a critical security vulnerability in lodash@4.17.15. The vulnerability (CVE-2021-23337) allows for prototype pollution attacks. This package is used in production and should be updated immediately to version 4.17.21 or later to patch this security issue.",
              time: "1 day ago",
              isResolved: true,
              commitHash: "def456",
            },
            {
              id: 3,
              type: "performance",
              severity: "low",
              message: "Performance Regression Detected",
              description: "Recent changes in the debounce implementation have shown a 15% performance regression in high-frequency event handling scenarios. While not critical, this may impact user experience in applications with frequent user interactions. Consider optimizing the debounce logic or reverting to the previous implementation.",
              time: "3 days ago",
              isResolved: false,
              commitHash: "ghi789",
            },
          ],
          // New activity breakdown data
          activityBreakdown: data.activity_factors ? {
            commitFrequency: data.activity_factors.commitFrequency || 0,
            contributorDiversity: data.activity_factors.contributorDiversity || 0,
            codeChurn: data.activity_factors.codeChurn || 0,
            developmentConsistency: data.activity_factors.developmentConsistency || 0
          } : {
            commitFrequency: 23,
            contributorDiversity: 25,
            codeChurn: 22,
            developmentConsistency: 22
          },
          // New bus factor details
          busFactorDetails: {
            level: 2,
            risk: 'CRITICAL',
            description: 'High risk: Bus factor of 2. Top contributor has 48% of commits.',
            topContributors: [
              {
                name: "John Dalton",
                commits: 1247,
                linesChanged: 45678,
                filesChanged: 234,
                percentage: 48,
                avatar: "/placeholder-user.jpg",
                initials: "JD"
              },
              {
                name: "Mathias Bynens",
                commits: 892,
                linesChanged: 23456,
                filesChanged: 156,
                percentage: 34,
                avatar: "/placeholder-user.jpg",
                initials: "MB"
              },
              {
                name: "Sarah Johnson",
                commits: 456,
                linesChanged: 12345,
                filesChanged: 89,
                percentage: 18,
                avatar: "/placeholder-user.jpg",
                initials: "SJ"
              }
            ]
          },
          // New activity data
          activityData: {
            commitsPerWeek: data.weekly_commit_rate ? Number(data.weekly_commit_rate) : 12,
            activeDays: [
              { day: "Sunday", hour: 14, intensity: 15 },
              { day: "Monday", hour: 14, intensity: 42 },
              { day: "Tuesday", hour: 16, intensity: 38 },
              { day: "Wednesday", hour: 10, intensity: 55 },
              { day: "Thursday", hour: 18, intensity: 48 },
              { day: "Friday", hour: 12, intensity: 32 },
              { day: "Saturday", hour: 10, intensity: 12 }
            ]
          },
          // New scorecard health data
          scorecardHealth: data.scorecard_health || {
            date: "2025-07-21",
            score: 4.2,
            checks: [
              {
                name: "Maintained",
                score: 10,
                reason: "30 commit(s) and 9 issue activity found in the last 90 days -- score normalized to 10",
                details: null,
                documentation: {
                  short: "Determines if the project is \"actively maintained\".",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#maintained"
                }
              },
              {
                name: "Code-Review",
                score: 6,
                reason: "Found 19/28 approved changesets -- score normalized to 6",
                details: null,
                documentation: {
                  short: "Determines if the project requires human code review before pull requests (aka merge requests) are merged.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#code-review"
                }
              },
              {
                name: "CII-Best-Practices",
                score: 0,
                reason: "no effort to earn an OpenSSF best practices badge detected",
                details: null,
                documentation: {
                  short: "Determines if the project has an OpenSSF (formerly CII) Best Practices Badge.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#cii-best-practices"
                }
              },
              {
                name: "Security-Policy",
                score: 10,
                reason: "security policy file detected",
                details: [
                  "Info: security policy file detected: SECURITY.md:1",
                  "Info: Found linked content: SECURITY.md:1",
                  "Info: Found disclosure, vulnerability, and/or timelines in security policy: SECURITY.md:1",
                  "Info: Found text in security policy: SECURITY.md:1"
                ],
                documentation: {
                  short: "Determines if the project has published a security policy.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#security-policy"
                }
              },
              {
                name: "License",
                score: 10,
                reason: "license file detected",
                details: [
                  "Info: project has a license file: LICENSE:0",
                  "Info: FSF or OSI recognized license: MIT License: LICENSE:0"
                ],
                documentation: {
                  short: "Determines if the project has defined a license.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#license"
                }
              },
              {
                name: "Packaging",
                score: -1,
                reason: "packaging workflow not detected",
                details: [
                  "Warn: no GitHub/GitLab publishing workflow detected."
                ],
                documentation: {
                  short: "Determines if the project is published as a package that others can easily download, install, easily update, and uninstall.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#packaging"
                }
              },
              {
                name: "Dangerous-Workflow",
                score: 10,
                reason: "no dangerous workflow patterns detected",
                details: null,
                documentation: {
                  short: "Determines if the project's GitHub Action workflows avoid dangerous patterns.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#dangerous-workflow"
                }
              },
              {
                name: "Token-Permissions",
                score: 0,
                reason: "detected GitHub workflow tokens with excessive permissions",
                details: [
                  "Info: jobLevel 'contents' permission set to 'read': .github/workflows/codemention.yaml:10",
                  "Warn: jobLevel 'actions' permission set to 'write': .github/workflows/pr-labeler.yml:37",
                  "Warn: no topLevel permission defined: .github/workflows/android-instrumentation-tests.yml:1"
                ],
                documentation: {
                  short: "Determines if the project's workflows follow the principle of least privilege.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#token-permissions"
                }
              },
              {
                name: "Branch-Protection",
                score: 6,
                reason: "branch protection is not maximal on development and all release branches",
                details: [
                  "Info: 'allow deletion' disabled on branch 'main'",
                  "Info: 'force pushes' disabled on branch 'main'",
                  "Info: 'branch protection settings apply to administrators' is required to merge on branch 'main'",
                  "Warn: required approving review count is 1 on branch 'main'",
                  "Warn: codeowners review is not required on branch 'main'",
                  "Warn: no status checks found to merge onto branch 'main'",
                  "Info: PRs are required in order to make changes on branch 'main'"
                ],
                documentation: {
                  short: "Determines if the default and release branches are protected with GitHub's branch protection settings.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#branch-protection"
                }
              },
              {
                name: "Signed-Releases",
                score: -1,
                reason: "no releases found",
                details: null,
                documentation: {
                  short: "Determines if the project cryptographically signs release artifacts.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#signed-releases"
                }
              },
              {
                name: "Binary-Artifacts",
                score: 0,
                reason: "binaries present in source code",
                details: [
                  "Warn: binary detected: apps/bare-expo/android/gradle/wrapper/gradle-wrapper.jar:1",
                  "Warn: binary detected: apps/expo-go/android/app/src/main/assets/kernel.android.bundle:1",
                  "Warn: binary detected: apps/expo-go/android/gradle/wrapper/gradle-wrapper.jar:1"
                ],
                documentation: {
                  short: "Determines if the project has generated executable (binary) artifacts in the source repository.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#binary-artifacts"
                }
              },
              {
                name: "Pinned-Dependencies",
                score: 0,
                reason: "dependency not pinned by hash detected -- score normalized to 0",
                details: [
                  "Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/android-instrumentation-tests.yml:53",
                  "Warn: GitHub-owned GitHubAction not pinned by hash: .github/workflows/android-instrumentation-tests.yml:57",
                  "Warn: third-party GitHubAction not pinned by hash: .github/workflows/bare-diffs.yml:33"
                ],
                documentation: {
                  short: "Determines if the project has declared and pinned the dependencies of its build process.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#pinned-dependencies"
                }
              },
              {
                name: "Fuzzing",
                score: 0,
                reason: "project is not fuzzed",
                details: [
                  "Warn: no fuzzer integrations found"
                ],
                documentation: {
                  short: "Determines if the project uses fuzzing.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#fuzzing"
                }
              },
              {
                name: "SAST",
                score: 0,
                reason: "SAST tool is not run on all commits -- score normalized to 0",
                details: [
                  "Warn: 0 commits out of 25 are checked with a SAST tool"
                ],
                documentation: {
                  short: "Determines if the project uses static code analysis.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#sast"
                }
              },
              {
                name: "Vulnerabilities",
                score: 0,
                reason: "40 existing vulnerabilities detected",
                details: [
                  "Warn: Project is vulnerable to: GHSA-7v5v-9h63-cj86",
                  "Warn: Project is vulnerable to: GHSA-pxg6-pf52-xh8x",
                  "Warn: Project is vulnerable to: GHSA-fjxv-7rqg-78g4",
                  "Warn: Project is vulnerable to: GHSA-rhx6-c78j-4q9w",
                  "Warn: Project is vulnerable to: GHSA-8cj5-5rvv-wf4v"
                ],
                documentation: {
                  short: "Determines if the project has open, known unfixed vulnerabilities.",
                  url: "https://github.com/ossf/scorecard/blob/c29a04d46d1570393e94662bc34e9906398e1bfa/docs/checks.md#vulnerabilities"
                }
              }
            ]
          },
                     // New activity heatmap data
           activity_heatmap: data.activity_heatmap || {
             dayOfWeek: {
               "0": 15,  // Sunday
               "1": 42,  // Monday
               "2": 38,  // Tuesday
               "3": 55,  // Wednesday
               "4": 48,  // Thursday
               "5": 32,  // Friday
               "6": 12   // Saturday
             }
           }
        }
        
        setPackageData(transformedData)
      } catch (error) {
        console.error("Error fetching package details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userWatchlistId) {
      fetchPackageDetails()
    }
  }, [userWatchlistId])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
    }
  }

  const getScoreColor = (score: number) => {
    // Note: Backend returns health scores on 0-10 scale, not 0-100
    if (score >= 8) return "text-green-400"
    if (score >= 6) return "text-yellow-400"
    return "text-red-400"
  }

  const getBusFactorRiskColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "text-red-400"
      case "HIGH":
        return "text-orange-400"
      case "MEDIUM":
        return "text-yellow-400"
      case "MILD":
        return "text-blue-400"
      case "NONE":
        return "text-green-400"
      default:
        return "text-gray-400"
    }
  }

  const getBusFactorRiskBgColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-red-900/20 border-red-800"
      case "HIGH":
        return "bg-orange-900/20 border-orange-800"
      case "MEDIUM":
        return "bg-yellow-900/20 border-yellow-800"
      case "MILD":
        return "bg-blue-900/20 border-blue-800"
      case "NONE":
        return "bg-green-900/20 border-green-800"
      default:
        return "bg-gray-900/20 border-gray-800"
    }
  }

  const getScorecardScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400"
    if (score >= 6) return "text-yellow-400"
    if (score >= 4) return "text-orange-400"
    if (score >= 0) return "text-red-400"
    return "text-gray-400" // -1 or below
  }

  const getScorecardScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-500"
    if (score >= 6) return "bg-yellow-500"
    if (score >= 4) return "bg-orange-500"
    if (score >= 0) return "bg-red-500"
    return "bg-gray-500" // -1 or below
  }

  const handleSummarizeCommits = async () => {
    setIsSummarizing(true)
    try {
      // TODO: Implement AI commit summarization
      await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
      
      // Mock summary result - replace with actual API call
      const mockSummary = `Recent commit activity shows a healthy development pattern with 4 commits over the past 4 days. The commits focus on bug fixes, performance improvements, and documentation updates. Key contributors include John Smith, Alex Turner, Emma Wilson, and Sarah Johnson. The most recent commit addresses a React hooks compatibility issue with the _.debounce function, indicating active maintenance and community responsiveness. Overall, the commit pattern suggests a well-maintained package with regular updates and good code quality practices.`
      
      setCommitSummary(mockSummary)
      console.log("Summarizing commits...")
    } catch (error) {
      console.error("Error summarizing commits:", error)
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleHealthDataSelect = (data: { date: string; score: number; commitSha?: string }) => {
    setSelectedHealthData(data)
  }

  const handleViewFullGraph = () => {
    // Navigate to graph tab
    const graphTab = document.querySelector('[data-value="graph"]') as HTMLElement
    if (graphTab) {
      graphTab.click()
    }
  }

  if (!userWatchlistId) {
    return (
      <FullWidthPage>
        <FullWidthContainer>
          <div className="text-center py-12">
            <p className="text-gray-400">No package ID provided</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mt-4 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </FullWidthContainer>
      </FullWidthPage>
    )
  }

  if (isLoading) {
    return (
      <FullWidthPage>
        <FullWidthContainer>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-400">Loading package details...</p>
            </div>
          </div>
        </FullWidthContainer>
      </FullWidthPage>
    )
  }

  if (!packageData) {
    return (
      <FullWidthPage>
        <FullWidthContainer>
          <div className="text-center py-12">
            <p className="text-gray-400">Package not found</p>
          </div>
        </FullWidthContainer>
      </FullWidthPage>
    )
  }

  return (
    <FullWidthPage>
      <FullWidthContainer>
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dependencies
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{packageData.name}</h1>
              <p className="text-gray-400 mb-4">{packageData.description}</p>
            </div>
            <div className="flex gap-2">
              {packageData.repoUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(packageData.repoUrl, '_blank')}
                >
                  <GithubIcon className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
              )}
              {packageData.npmUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(packageData.npmUrl, '_blank')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  NPM
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">
                {/* AI Overview - Full Width */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Brain className="h-5 w-5" />
                      AI Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {packageData.aiSummary ? (
                      <p className="text-gray-300 leading-relaxed">
                        {packageData.aiSummary}
                      </p>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-400 mb-2">No AI analysis available</p>
                        <p className="text-sm text-gray-500">
                          AI analysis will be generated automatically as the repository is processed.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Enhanced Alerts Display */}
                {packageData.alerts.length > 0 && (
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          Active Alerts ({packageData.alerts.length})
                        </CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveTab("alerts")}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {packageData.alerts.slice(0, 2).map((alert) => (
                          <div 
                            key={alert.id} 
                            className={`p-4 rounded-lg border ${
                              alert.severity === 'high' 
                                ? 'bg-red-900/20 border-red-800' 
                                : alert.severity === 'medium'
                                ? 'bg-yellow-900/20 border-yellow-800'
                                : 'bg-blue-900/20 border-blue-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTriangle className={`h-4 w-4 ${
                                    alert.severity === 'high' 
                                      ? 'text-red-400' 
                                      : alert.severity === 'medium'
                                      ? 'text-yellow-400'
                                      : 'text-blue-400'
                                  }`} />
                                  <span className="font-medium text-white">{alert.message}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      alert.severity === 'high' 
                                        ? 'border-red-600 text-red-400' 
                                        : alert.severity === 'medium'
                                        ? 'border-yellow-600 text-yellow-400'
                                        : 'border-blue-600 text-blue-400'
                                    }`}
                                  >
                                    {alert.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-300">{alert.description}</p>
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{alert.time}</span>
                            </div>
                          </div>
                        ))}
                        {packageData.alerts.length > 2 && (
                          <div className="text-center py-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setActiveTab("alerts")}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              +{packageData.alerts.length - 2} more alerts
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Scorecard Stats - Full Width */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="h-5 w-5" />
                      Scorecard Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HealthScoreChart 
                      data={packageData.healthHistory.map(item => ({
                        date: item.date,
                        score: item.score,
                        commitSha: (item as any).commitSha
                      }))} 
                      onDataPointSelect={handleHealthDataSelect}
                      scorecardData={packageData.scorecardHealth}
                    />
                  </CardContent>
                </Card>

                {/* Activity Score - Full Width */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="h-5 w-5" />
                      Activity Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Activity Score */}
                      <div className="text-center mb-6">
                        <div className={`text-6xl font-bold mb-2 ${
                          packageData.activityScore >= 65 ? 'text-green-400' :
                          packageData.activityScore >= 30 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {packageData.activityScore}
                        </div>
                        <div className="text-gray-400">out of 100</div>
                      </div>

                      {/* Activity Breakdown */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center p-4 bg-gray-800/50 rounded-lg cursor-help">
                                <div className={`text-2xl font-bold mb-1 ${
                                  packageData.activityBreakdown.commitFrequency >= 20 ? 'text-green-400' :
                                  packageData.activityBreakdown.commitFrequency >= 10 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {packageData.activityBreakdown.commitFrequency}
                                </div>
                                <div className="text-sm text-gray-400">Commit Frequency</div>
                                <div className="text-xs text-gray-500 mt-1">out of 25</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Recent commit activity in the last 3 months</p>
                              <p className="text-xs text-gray-300">15+ commits/month = max score</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center p-4 bg-gray-800/50 rounded-lg cursor-help">
                                <div className={`text-2xl font-bold mb-1 ${
                                  packageData.activityBreakdown.contributorDiversity >= 20 ? 'text-green-400' :
                                  packageData.activityBreakdown.contributorDiversity >= 10 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {packageData.activityBreakdown.contributorDiversity}
                                </div>
                                <div className="text-sm text-gray-400">Contributor Diversity</div>
                                <div className="text-xs text-gray-500 mt-1">out of 25</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of unique contributors in the last 3 months</p>
                              <p className="text-xs text-gray-300">5+ contributors = max score</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center p-4 bg-gray-800/50 rounded-lg cursor-help">
                                <div className={`text-2xl font-bold mb-1 ${
                                  packageData.activityBreakdown.codeChurn >= 20 ? 'text-green-400' :
                                  packageData.activityBreakdown.codeChurn >= 10 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {packageData.activityBreakdown.codeChurn}
                                </div>
                                <div className="text-sm text-gray-400">Code Churn</div>
                                <div className="text-xs text-gray-500 mt-1">out of 25</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Average lines changed per commit in the last 3 months</p>
                              <p className="text-xs text-gray-300">50+ lines/commit = max score</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center p-4 bg-gray-800/50 rounded-lg cursor-help">
                                <div className={`text-2xl font-bold mb-1 ${
                                  packageData.activityBreakdown.developmentConsistency >= 20 ? 'text-green-400' :
                                  packageData.activityBreakdown.developmentConsistency >= 10 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {packageData.activityBreakdown.developmentConsistency}
                                </div>
                                <div className="text-sm text-gray-400">Development Consistency</div>
                                <div className="text-xs text-gray-500 mt-1">out of 25</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Weekly commit rate consistency in the last 3 months</p>
                              <p className="text-xs text-gray-300">3+ commits/week = max score</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Combined Activity Stats and Heatmap */}
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-white font-medium">Activity Statistics</span>
                        </div>
                        
                        {/* Commits per Week */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-white">Commits per Week</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Average weekly commits</span>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                packageData.activityData.commitsPerWeek >= 3 ? 'text-green-400' :
                                packageData.activityData.commitsPerWeek >= 1.5 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {packageData.activityData.commitsPerWeek.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Weekly Activity Pattern */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-white">Weekly Activity Pattern</span>
                          </div>
                          <div className="space-y-2">
                            {packageData.activity_heatmap ? (
                              // Use real activity heatmap data - show all 7 days
                              (() => {
                                const dayEntries = Object.entries(packageData.activity_heatmap.dayOfWeek || {});
                                const maxCommits = Math.max(...dayEntries.map(([_, count]) => count as number), 1);
                                
                                return dayEntries.map(([day, count]) => {
                                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                  const dayName = dayNames[parseInt(day)] || 'Unknown';
                                  const intensity = Math.min((count as number) / maxCommits * 10, 10); // Relative to max
                                  return (
                                    <div key={day} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-300">{dayName}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400">{count} commits</span>
                                        <div className="flex gap-1">
                                          {[...Array(10)].map((_, i) => (
                                            <div
                                              key={i}
                                              className={`w-2 h-2 rounded ${
                                                i < intensity 
                                                  ? 'bg-blue-400' 
                                                  : 'bg-gray-600'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()
                            ) : (
                              // Fallback to mock data - show all 7 days
                              (() => {
                                const maxIntensity = Math.max(...packageData.activityData.activeDays.map(day => day.intensity), 1);
                                
                                return packageData.activityData.activeDays.map((day, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">{day.day}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-400">{day.intensity} commits</span>
                                      <div className="flex gap-1">
                                        {[...Array(10)].map((_, i) => (
                                          <div
                                            key={i}
                                            className={`w-2 h-2 rounded ${
                                              i < (day.intensity / maxIntensity * 10)
                                                ? 'bg-blue-400' 
                                                : 'bg-gray-600'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ));
                              })()
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bus Factor - Full Width */}
                <Card className={`bg-gray-900/50 border-gray-800 ${getBusFactorRiskBgColor(packageData.busFactorDetails.risk)}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Users className="h-5 w-5" />
                      Bus Factor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Bus Factor Score */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-4xl font-bold text-white mb-2">
                            {packageData.busFactorDetails.level}
                          </div>
                          <div className="text-gray-400">on a scale of 1-8</div>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-lg px-4 py-2 ${getBusFactorRiskColor(packageData.busFactorDetails.risk)} bg-transparent border`}>
                            {packageData.busFactorDetails.risk}
                          </Badge>
                        </div>
                      </div>

                      {/* Risk Description */}
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-gray-300">
                          {packageData.busFactorDetails.description}
                        </p>
                      </div>

                      {/* Top Contributors */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Top Contributors</h4>
                        <div className="space-y-3">
                          {packageData.busFactorDetails.topContributors.map((contributor, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={contributor.avatar} />
                                  <AvatarFallback className="bg-gray-700 text-white">
                                    {contributor.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-white font-medium">{contributor.name}</div>
                                  <div className="text-sm text-gray-400">{contributor.percentage}% of commits</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <GitCommit className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-300">{contributor.commits}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Plus className="h-3 w-3 text-green-400" />
                                    <Minus className="h-3 w-3 text-red-400" />
                                    <span className="text-gray-300">{contributor.linesChanged.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-300">{contributor.filesChanged}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Graph Section - Full Width */}
                <Card className="bg-gray-900/50 border-gray-800 group relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <BarChart3 className="h-5 w-5" />
                      Dependency Graph
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-white mb-2">Graph Analysis</h3>
                      <p className="text-gray-400 mb-4">
                        This feature is currently under development by the graph team.
                      </p>
                    </div>
                  </CardContent>
                  
                  {/* Small hover button in corner */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button 
                      onClick={handleViewFullGraph}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Full Graph
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">


                {/* Commit Summary */}
                {commitSummary && (
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Brain className="h-5 w-5" />
                        Commit Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed">
                        {commitSummary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <GitCommit className="h-5 w-5" />
                        Recent Commits
                      </CardTitle>
                      {!commitSummary && (
                        <Button 
                          onClick={handleSummarizeCommits}
                          disabled={isSummarizing}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isSummarizing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Brain className="h-4 w-4 mr-2" />
                          )}
                          {isSummarizing ? 'Summarizing...' : 'Summarize Recent Commits'}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-gray-800">
                      {packageData.commits.map((commit) => (
                        <div key={commit.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={commit.avatar} />
                              <AvatarFallback className="bg-gray-700 text-white">
                                {commit.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">{commit.author}</span>
                                <span className="text-xs text-gray-400">{commit.time}</span>
                                {commit.isSuspicious && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="destructive" className="text-xs cursor-help">
                                          AI Detected Suspicious Commit
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm p-3">
                                        <div className="space-y-2">
                                          <div className="font-medium text-white">AI Analysis:</div>
                                          <p className="text-sm text-gray-300">{commit.suspiciousReason}</p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{commit.message}</p>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 font-mono">{commit.id}</span>
                                  <Button variant="ghost" size="sm" className="h-6 px-2">
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <span className="text-green-400">+{commit.linesAdded}</span>
                                  <span className="text-red-400">-{commit.linesDeleted}</span>
                                  <span>{commit.filesChanged} files</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Repository Alerts</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={alertFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAlertFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={alertFilter === "open" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAlertFilter("open")}
                    >
                      Open
                    </Button>
                    <Button
                      variant={alertFilter === "resolved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAlertFilter("resolved")}
                    >
                      Resolved
                    </Button>
                  </div>
                </div>
                
                {(() => {
                  const filteredAlerts = packageData.alerts.filter(alert => {
                    if (alertFilter === "all") return true;
                    if (alertFilter === "open") return !alert.isResolved;
                    if (alertFilter === "resolved") return alert.isResolved;
                    return true;
                  });
                  
                  return filteredAlerts.length > 0 ? (
                    <div className="space-y-4">
                      {filteredAlerts.map((alert) => (
                        <Card key={alert.id} className={`bg-gray-900/50 border-gray-800 ${alert.isResolved ? 'opacity-75' : ''}`}>
                          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 ${
                                alert.severity === 'high' 
                                  ? 'text-red-400' 
                                  : alert.severity === 'medium'
                                  ? 'text-yellow-400'
                                  : 'text-blue-400'
                              }`} />
                              <span className="text-lg font-semibold text-white">{alert.message}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  alert.severity === 'high' 
                                    ? 'border-red-600 text-red-400' 
                                    : alert.severity === 'medium'
                                    ? 'border-yellow-600 text-yellow-400'
                                    : 'border-blue-600 text-blue-400'
                                }`}
                              >
                                {alert.severity}
                              </Badge>
                              {alert.isResolved && (
                                <Badge variant="secondary" className="text-xs">
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span>{alert.time}</span>
                              <span>•</span>
                              <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-300 leading-relaxed">{alert.description}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Alert ID: {alert.id}</span>
                                <span>Type: {alert.type}</span>
                                <span>Status: {alert.isResolved ? 'Resolved' : 'Active'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="text-xs">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Commit
                                </Button>
                                {!alert.isResolved && (
                                  <Button variant="outline" size="sm" className="text-xs">
                                    Mark Resolved
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No {alertFilter} alerts found for this repository.</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="graph" className="space-y-6">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Dependency Graph</h2>
                
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-white mb-2">Graph Analysis</h3>
                      <p className="text-gray-400 mb-6">
                        This feature is currently under development by the graph team. The dependency graph will show the relationships between packages and their dependencies, helping you understand the impact of changes and potential security vulnerabilities.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <div className="font-medium text-white mb-1">Dependencies</div>
                          <div>View all package dependencies</div>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <div className="font-medium text-white mb-1">Security</div>
                          <div>Identify vulnerable dependencies</div>
                        </div>
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <div className="font-medium text-white mb-1">Impact</div>
                          <div>Understand change impact</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Repository Settings</h2>
                
                {/* Alert Settings */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <AlertTriangle className="h-5 w-5" />
                      Alert Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-white">Alert Severity Thresholds</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">High Severity Alerts</span>
                            <Badge variant="outline" className="border-red-600 text-red-400">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Medium Severity Alerts</span>
                            <Badge variant="outline" className="border-yellow-600 text-yellow-400">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Low Severity Alerts</span>
                            <Badge variant="outline" className="border-blue-600 text-blue-400">Enabled</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-white">Alert Types</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Security Vulnerabilities</span>
                            <Badge variant="outline" className="border-green-600 text-green-400">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Performance Issues</span>
                            <Badge variant="outline" className="border-green-600 text-green-400">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Code Quality Issues</span>
                            <Badge variant="outline" className="border-green-600 text-green-400">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Large Changes</span>
                            <Badge variant="outline" className="border-green-600 text-green-400">Enabled</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-800">
                      <h4 className="text-lg font-medium text-white mb-3">Notification Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <div className="font-medium text-white">Email Notifications</div>
                            <div className="text-sm text-gray-400">Receive alerts via email</div>
                          </div>
                          <Badge variant="outline" className="border-green-600 text-green-400">Enabled</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <div className="font-medium text-white">Slack Integration</div>
                            <div className="text-sm text-gray-400">Send alerts to Slack channel</div>
                          </div>
                          <Badge variant="outline" className="border-gray-600 text-gray-400">Disabled</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Repository Management */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <GitBranch className="h-5 w-5" />
                      Repository Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-white">Repository Information</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Repository:</span>
                            <span className="text-white">{packageData.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Language:</span>
                            <span className="text-white">{packageData.language}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Last Updated:</span>
                            <span className="text-white">{packageData.lastUpdated}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Stars:</span>
                            <span className="text-white">{packageData.stars.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-white">Monitoring Status</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Health Score Monitoring</span>
                            <Badge variant="outline" className="border-green-600 text-green-400">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Activity Tracking</span>
                            <Badge variant="outline" className="border-green-600 text-green-400">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Security Scanning</span>
                            <Badge variant="outline" className="border-green-600 text-green-400">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Dependency Analysis</span>
                            <Badge variant="outline" className="border-green-600 text-green-400">Active</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-red-900/20 border-red-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-red-400 mb-2">Remove from Watchlist</h4>
                          <p className="text-sm text-gray-300 mb-4">
                            This will stop monitoring this repository and remove it from your watchlist. 
                            You can always add it back later, but you'll lose all historical data and settings.
                          </p>
                        </div>
                        <Button variant="destructive" className="ml-4">
                          Remove Repository
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-red-400 mb-2">Reset All Settings</h4>
                          <p className="text-sm text-gray-300 mb-4">
                            Reset all alert settings and monitoring preferences to their default values. 
                            This action cannot be undone.
                          </p>
                        </div>
                        <Button variant="outline" className="ml-4 border-red-600 text-red-400 hover:bg-red-900/20">
                          Reset Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </FullWidthContainer>
    </FullWidthPage>
  )
} 