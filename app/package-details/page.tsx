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
  Package,
  User,
  Shield,
  TrendingDown,
  MessageSquare,
  Mail,
  MessageCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/page-header"
import { FullWidthContainer, FullWidthPage } from "@/components/full-width-container"
import { HealthScoreChart } from "@/components/health-score-chart"
import { useRouter } from "next/navigation"
import { getRecentCommits, generateCommitSummary } from "@/lib/watchlist/api"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import JiraLogo from "@/public/jira.svg"
import { checkJiraLink, createJiraIssue } from "@/lib/alerts/jiraAlerts"

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
    sha: string
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
  alertSettings?: any // Add this field for the alert configuration
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
      avgLinesPerCommit: number
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
  // Vulnerability data
  vulnerabilities?: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    cveId?: string;
    ghsaId?: string;
    publishedDate: string;
    affectedVersions: string[];
    fixedVersions?: string[];
    references: Array<{
      url: string;
      type: string;
    }>;
  }>;
  vulnerabilitySummary?: {
    totalCount: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    lastUpdated: string;
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
  const [isEditingAlerts, setIsEditingAlerts] = useState(false)
  const [editedAlertSettings, setEditedAlertSettings] = useState<any>(null)
  const [isSavingAlerts, setIsSavingAlerts] = useState(false)
  const [commits, setCommits] = useState<Array<{
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
    sha: string
  }>>([])
  const [isLoadingCommits, setIsLoadingCommits] = useState(false)
  const [showAllVulnerabilities, setShowAllVulnerabilities] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [jiraConnection, setJiraConnection] = useState(false);


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
          // Store alert settings
          alertSettings: data.alerts ? (typeof data.alerts === 'string' ? JSON.parse(data.alerts) : data.alerts) : null,
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
              sha: "abc123def456",
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
              sha: "def456ghi789",
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
              sha: "ghi789jkl012",
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
              sha: "jkl012mno345",
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
          alerts: [], // Will be populated with real data from alerts API
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
          busFactorDetails: data.bus_factor_details ? (() => {
            const contributors = data.bus_factor_details.topContributors ? data.bus_factor_details.topContributors.map((contributor: any) => ({
              name: contributor.author || 'Unknown',
              commits: contributor.totalCommits || 0,
              linesChanged: (contributor.totalLinesAdded || 0) + (contributor.totalLinesDeleted || 0),
              filesChanged: contributor.totalFilesChanged || 0,
              percentage: 0, // Will calculate below
              avgLinesPerCommit: contributor.averageLinesPerCommit || 0,
              avatar: "/placeholder-user.jpg",
              initials: (contributor.author || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            })) : [];
            
            // Calculate total commits from all contributors (not just top 5)
            // The backend provides the total commit count for all human contributors
            const totalCommits = data.bus_factor_details.totalCommits || contributors.reduce((sum: number, c: { commits: number }) => sum + c.commits, 0);
            if (totalCommits > 0) {
              contributors.forEach((contributor: { commits: number; percentage: number }) => {
                contributor.percentage = Math.round((contributor.commits / totalCommits) * 100);
              });
            }
            
            return {
              level: data.bus_factor_details.level || 0,
              risk: data.bus_factor_details.risk || 'LOW',
              description: data.bus_factor_details.description || 'No bus factor analysis available.',
              topContributors: contributors
            };
          })() : {
            level: 0,
            risk: 'LOW',
            description: 'No bus factor analysis available.',
            topContributors: []
          },
          // New activity data
          activityData: {
            commitsPerWeek: data.weekly_commit_rate ? Number(data.weekly_commit_rate) : 12,
            activeDays: [
              { day: "Monday", hour: 14, intensity: 42 },
              { day: "Tuesday", hour: 16, intensity: 38 },
              { day: "Wednesday", hour: 10, intensity: 55 },
              { day: "Thursday", hour: 18, intensity: 48 },
              { day: "Friday", hour: 12, intensity: 32 },
              { day: "Saturday", hour: 10, intensity: 12 },
              { day: "Sunday", hour: 14, intensity: 15 }
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
           },
           // Vulnerability data
           vulnerabilities: data.vulnerabilities?.vulnerabilities || [],
           vulnerabilitySummary: data.vulnerabilities?.summary || {
             totalCount: 0,
             criticalCount: 0,
             highCount: 0,
             mediumCount: 0,
             lowCount: 0,
             lastUpdated: new Date().toISOString()
           }
        }
        
        setPackageData(transformedData)
        
        // Fetch alerts for this user watchlist
        try {
          const alertsResponse = await fetch(`/api/backend/activity/alerts/${userWatchlistId}`)
          if (alertsResponse.ok) {
            const alertsData = await alertsResponse.json()
            const transformedAlerts = alertsData.alerts.map((alert: any) => ({
              id: parseInt(alert.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number
              type: alert.metric,
              severity: alert.alert_level || 'medium',
              message: `${alert.metric.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Alert`,
              description: alert.description,
              time: getTimeAgo(new Date(alert.created_at)),
              isResolved: !!alert.resolved_at,
              commitHash: alert.commit_sha,
            }))
            
            setPackageData(prev => prev ? {
              ...prev,
              alerts: transformedAlerts
            } : null)
          }
        } catch (alertError) {
          console.error('Error fetching alerts:', alertError)
          // Don't fail the whole page if alerts fail to load
        }
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

  const fetchCommits = async () => {
    if (!userWatchlistId) return
    
    setIsLoadingCommits(true)
    try {
      const commitsData = await getRecentCommits(userWatchlistId, 50)
      setCommits(commitsData.commits)
    } catch (error) {
      console.error("Error fetching commits:", error)
      // Keep existing mock commits if API fails
    } finally {
      setIsLoadingCommits(false)
    }
  }



  // Fetch commits when activity tab is selected
  useEffect(() => {
    if (activeTab === "activity" && userWatchlistId && commits.length === 0) {
      fetchCommits()
    }
  }, [activeTab, userWatchlistId, commits.length])


  const fetchJiraConn = async () => {

    try {
      const result = await checkJiraLink(userWatchlistId!);
      if (result.success) {
        console.log("result", result);
        setJiraConnection(true);
      } else {
        console.warn(result.message);
        setJiraConnection(false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (activeTab === "alerts" && userWatchlistId && commits.length === 0) {
      fetchJiraConn()
    }
  }, [activeTab, userWatchlistId])


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

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'ai_powered_anomaly_detection':
        return <Brain className="h-4 w-4 text-indigo-400" />
      case 'lines_added_deleted':
        return <Activity className="h-4 w-4 text-emerald-400" />
      case 'files_changed':
        return <FileText className="h-4 w-4 text-cyan-400" />
      case 'suspicious_author_timestamps':
        return <User className="h-4 w-4 text-orange-400" />
      case 'new_vulnerabilities_detected':
        return <Shield className="h-4 w-4 text-red-400" />
      case 'health_score_decreases':
        return <TrendingDown className="h-4 w-4 text-yellow-400" />
      case 'high_churn':
        return <MessageSquare className="h-4 w-4 text-indigo-400" />
      case 'ancestry_breaks':
        return <GitBranch className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getAlertTitle = (alert: any) => {
    switch (alert.type) {
      case 'ai_powered_anomaly_detection':
        return 'Anomaly Detection'
      case 'lines_added_deleted':
        return 'Lines Changed Alert'
      case 'files_changed':
        return 'Files Changed Alert'
      case 'high_churn':
        return 'High Churn Alert'
      default:
        return alert.message || 'Alert'
    }
  }

  const handleSummarizeCommits = async () => {
    if (!userWatchlistId) return
    
    setIsSummarizing(true)
    try {
      const summaryData = await generateCommitSummary(userWatchlistId, 50)
      setCommitSummary(summaryData.summary)
      console.log("Generated commit summary:", summaryData)
    } catch (error) {
      console.error("Error summarizing commits:", error)
      // Fallback to mock summary if API fails
      const mockSummary = `Recent commit activity shows a healthy development pattern with 4 commits over the past 4 days. The commits focus on bug fixes, performance improvements, and documentation updates. Key contributors include John Smith, Alex Turner, Emma Wilson, and Sarah Johnson. The most recent commit addresses a React hooks compatibility issue with the _.debounce function, indicating active maintenance and community responsiveness. Overall, the commit pattern suggests a well-maintained package with regular updates and good code quality practices.`
      setCommitSummary(mockSummary)
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleHealthDataSelect = (data: { date: string; score: number; commitSha?: string }) => {
    setSelectedHealthData(data)
  }

  const handleViewFullGraph = () => {
    // Navigate to graph tab
    setActiveTab("graph")
  }

  const handleViewCommitOnGitHub = (commitSha: string) => {
    if (packageData?.repoUrl) {
      // Convert repo URL to commit URL
      const commitUrl = `${packageData.repoUrl}/commit/${commitSha}`
      window.open(commitUrl, '_blank')
    }
  }

  const handleSendToJira = async (alert: any) => {
    if (packageData) {
       try {
        await createJiraIssue (
          userWatchlistId!,
          packageData.name,
          getAlertTitle(alert),
          alert.description
        )
       console.log("Jira ticket created successfully");
      } catch (error) {
        console.error("Failed to create Jira ticket", error);
      }
    }
  }

  const handleEditAlertSettings = () => {
    const currentSettings = packageData?.alertSettings ? 
      (typeof packageData.alertSettings === 'string' ? JSON.parse(packageData.alertSettings) : packageData.alertSettings) : 
      null;
    
    if (currentSettings) {
      setEditedAlertSettings(JSON.parse(JSON.stringify(currentSettings))) // Deep copy
      setIsEditingAlerts(true)
    }
  }

  const handleSaveAlertSettings = async () => {
    if (!editedAlertSettings || !userWatchlistId) return
    
    setIsSavingAlerts(true)
    try {
      console.log('🔄 Saving alert settings...')
      console.log('UserWatchlistId:', userWatchlistId)
      console.log('Alert settings:', editedAlertSettings)
      
      // Call API to update alert settings
      const response = await fetch(`/api/backend/activity/user-watchlist-alerts/${userWatchlistId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alerts: editedAlertSettings
        }),
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to update alert settings: ${response.statusText} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ Success response:', result)
      
      // Update local state
      setPackageData(prev => prev ? {
        ...prev,
        alertSettings: editedAlertSettings
      } : null)
      
      setIsEditingAlerts(false)
      setEditedAlertSettings(null)
      
      console.log('Alert settings updated successfully')
    } catch (error) {
      console.error('❌ Error updating alert settings:', error)
      // For now, still update local state even if API fails
      setPackageData(prev => prev ? {
        ...prev,
        alertSettings: editedAlertSettings
      } : null)
      setIsEditingAlerts(false)
      setEditedAlertSettings(null)
    } finally {
      setIsSavingAlerts(false)
    }
  }

  const handleRemoveFromWatchlist = async () => {
    if (!userWatchlistId) return
    
    try {
      console.log('🗑️ Removing from watchlist...')
      console.log('UserWatchlistId:', userWatchlistId)
      
      const response = await fetch(`/api/backend/activity/user-watchlist/${userWatchlistId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to remove from watchlist: ${response.statusText} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ Success response:', result)
      
      // Redirect to watchlist page after successful removal
      window.location.href = '/dependencies'
      
    } catch (error) {
      console.error('❌ Error removing from watchlist:', error)
      alert('Failed to remove repository from watchlist. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setIsEditingAlerts(false)
    setEditedAlertSettings(null)
  }

  const handleToggleAlert = (alertKey: string, enabled: boolean) => {
    if (!editedAlertSettings) return
    
    setEditedAlertSettings((prev: any) => ({
      ...prev,
      [alertKey]: {
        ...prev[alertKey],
        enabled
      }
    }))
  }

  const handleUpdateAlertThreshold = (alertKey: string, field: string, value: number) => {
    if (!editedAlertSettings) return
    
    setEditedAlertSettings((prev: any) => ({
      ...prev,
      [alertKey]: {
        ...prev[alertKey],
        [field]: value
      }
    }))
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
                {(() => {
                  const nonResolvedAlerts = packageData.alerts.filter(alert => !alert.isResolved);
                  const displayAlerts = nonResolvedAlerts.slice(0, 3);
                  
                  return nonResolvedAlerts.length > 0 ? (
                    <Card className="bg-gray-900/50 border-gray-800">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-white">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            Active Alerts ({nonResolvedAlerts.length})
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
                          {displayAlerts.map((alert) => (
                            <div 
                              key={alert.id} 
                              className="p-4 rounded-lg border bg-yellow-900/20 border-yellow-800"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getAlertIcon(alert.type)}
                                    <span className="font-medium text-white">
                                      {getAlertTitle(alert)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-300">{alert.description}</p>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{alert.time}</span>
                              </div>
                            </div>
                          ))}
                          {nonResolvedAlerts.length > 3 && (
                            <div className="text-center py-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setActiveTab("alerts")}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                +{nonResolvedAlerts.length - 3} more alerts
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* Security Vulnerabilities - Full Width */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Shield className="h-5 w-5" />
                      Security Vulnerabilities
                      {packageData.vulnerabilitySummary && packageData.vulnerabilitySummary.totalCount > 0 && (
                        <Badge 
                          variant="outline" 
                          className={`ml-2 ${
                            packageData.vulnerabilitySummary.criticalCount > 0 || packageData.vulnerabilitySummary.highCount > 0
                              ? 'border-red-600 text-red-400'
                              : packageData.vulnerabilitySummary.mediumCount > 0
                              ? 'border-yellow-600 text-yellow-400'
                              : 'border-blue-600 text-blue-400'
                          }`}
                        >
                          {packageData.vulnerabilitySummary.totalCount} found
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {packageData.vulnerabilitySummary && packageData.vulnerabilitySummary.totalCount > 0 ? (
                      <div className="space-y-4">
                        {/* Clean Vulnerability Summary */}
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                          <span>Severity breakdown:</span>
                          {packageData.vulnerabilitySummary.criticalCount > 0 && (
                            <span className="text-red-400">{packageData.vulnerabilitySummary.criticalCount} critical</span>
                          )}
                          {packageData.vulnerabilitySummary.highCount > 0 && (
                            <span className="text-orange-400">{packageData.vulnerabilitySummary.highCount} high</span>
                          )}
                          {packageData.vulnerabilitySummary.mediumCount > 0 && (
                            <span className="text-yellow-400">{packageData.vulnerabilitySummary.mediumCount} medium</span>
                          )}
                          {packageData.vulnerabilitySummary.lowCount > 0 && (
                            <span className="text-blue-400">{packageData.vulnerabilitySummary.lowCount} low</span>
                          )}
                        </div>

                        {/* Recent Vulnerabilities */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Vulnerabilities</h4>
                          {packageData.vulnerabilities?.slice(0, showAllVulnerabilities ? undefined : 1).map((vuln) => (
                            <div 
                              key={vuln.id}
                              className="p-4 rounded-lg border border-gray-700 bg-gray-900/30"
                            >
                              <div className="space-y-3">
                                {/* Header with title, severity, and date */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Shield className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium text-white">{vuln.title}</span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          vuln.severity === 'CRITICAL' 
                                            ? 'border-red-500/30 text-red-400' 
                                            : vuln.severity === 'HIGH'
                                            ? 'border-orange-500/30 text-orange-400'
                                            : vuln.severity === 'MEDIUM'
                                            ? 'border-yellow-500/30 text-yellow-400'
                                            : 'border-blue-500/30 text-blue-400'
                                        }`}
                                      >
                                        {vuln.severity}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      <p className={`text-sm text-gray-300 ${expandedDescriptions.has(vuln.id) ? '' : 'line-clamp-3'}`}>
                                        {vuln.description}
                                      </p>
                                      {vuln.description.length > 200 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const newExpanded = new Set(expandedDescriptions)
                                            if (expandedDescriptions.has(vuln.id)) {
                                              newExpanded.delete(vuln.id)
                                            } else {
                                              newExpanded.add(vuln.id)
                                            }
                                            setExpandedDescriptions(newExpanded)
                                          }}
                                          className="text-blue-400 hover:text-blue-300 text-xs p-0 h-auto"
                                        >
                                          {expandedDescriptions.has(vuln.id) ? 'Show less' : 'Show more'}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {getTimeAgo(new Date(vuln.publishedDate))}
                                  </span>
                                </div>

                                {/* Version Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {/* Affected Versions */}
                                  {vuln.affectedVersions && vuln.affectedVersions.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3 text-red-400" />
                                        <span className="text-xs font-medium text-red-400">Affected Versions</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {vuln.affectedVersions.map((version, index) => (
                                          <code key={index} className="text-xs bg-red-900/30 border border-red-800 px-2 py-1 rounded text-red-300">
                                            {version}
                                          </code>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Fixed Versions */}
                                  {vuln.fixedVersions && vuln.fixedVersions.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-3 w-3 text-green-400" />
                                        <span className="text-xs font-medium text-green-400">Fixed Versions</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {vuln.fixedVersions.map((version, index) => (
                                          <code key={index} className="text-xs bg-green-900/30 border border-green-800 px-2 py-1 rounded text-green-300">
                                            {version}
                                          </code>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Identifiers */}
                                <div className="flex flex-wrap items-center gap-3">
                                  {vuln.cveId && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400">CVE:</span>
                                      <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                                        {vuln.cveId}
                                      </code>
                                    </div>
                                  )}
                                  {vuln.ghsaId && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400">GHSA:</span>
                                      <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                                        {vuln.ghsaId}
                                      </code>
                                    </div>
                                  )}
                                </div>

                                {/* References */}
                                {vuln.references && vuln.references.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-xs font-medium text-gray-400">References:</span>
                                    <div className="flex flex-wrap gap-2">
                                      {vuln.references.slice(0, 2).map((ref, index) => (
                                        <a
                                          key={index}
                                          href={ref.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          {ref.type || 'Link'}
                                        </a>
                                      ))}
                                      {vuln.references.length > 2 && (
                                        <span className="text-xs text-gray-500">
                                          +{vuln.references.length - 2} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {packageData.vulnerabilities && packageData.vulnerabilities.length > 1 && (
                            <div className="text-center py-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowAllVulnerabilities(!showAllVulnerabilities)}
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                              >
                                {showAllVulnerabilities ? (
                                  <>
                                    <Minus className="h-4 w-4" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4" />
                                    Show {packageData.vulnerabilities.length - 1} more vulnerabilities
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-green-400" />
                        <p className="text-green-400 mb-2">No vulnerabilities found</p>
                        <p className="text-sm text-gray-500">
                          This package appears to be secure with no known vulnerabilities.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                          {packageData.activityScore === 0 ? 'No Activity' : packageData.activityScore}
                        </div>
                        <div className="text-gray-400">
                          {packageData.activityScore === 0 ? '' : 'out of 100'}
                        </div>
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
                                
                                // Backend now sends data in Monday-first format (0=Monday, 6=Sunday)
                                const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                
                                // Sort day entries to ensure Monday-Sunday order
                                const sortedDayEntries = dayEntries.sort(([dayA], [dayB]) => {
                                  const dayIndexA = parseInt(dayA);
                                  const dayIndexB = parseInt(dayB);
                                  return dayIndexA - dayIndexB;
                                });
                                
                                return sortedDayEntries.map(([day, count]) => {
                                  const dayIndex = parseInt(day);
                                  const dayName = dayNames[dayIndex] || 'Unknown';
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
                                
                                // Sort days to ensure Monday-Sunday order
                                const sortedDays = packageData.activityData.activeDays.sort((a, b) => {
                                  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                                  return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                                });
                                
                                return sortedDays.map((day, index) => (
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
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Users className="h-5 w-5" />
                      Bus Factor
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-gray-400 hover:text-white">
                              ?
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              Bus factor measures knowledge concentration risk. It's the minimum number of contributors 
                              who would need to leave before the project can't continue due to knowledge loss.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Bus Factor Score */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-4xl font-bold mb-2 ${getBusFactorRiskColor(packageData.busFactorDetails.risk)}`}>
                            {packageData.busFactorDetails.level}
                          </div>
                          <div className="text-gray-400">contributors needed for 50% of commits</div>
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
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 cursor-help">
                                            <GitCommit className="h-3 w-3 text-gray-400" />
                                            <span className="text-gray-300">{contributor.commits}</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Total commits</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 cursor-help">
                                            <Plus className="h-3 w-3 text-green-400" />
                                            <Minus className="h-3 w-3 text-red-400" />
                                            <span className="text-gray-300">{contributor.linesChanged.toLocaleString()}</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Total lines added + deleted</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 cursor-help">
                                            <BarChart3 className="h-3 w-3 text-gray-400" />
                                            <span className="text-gray-300">~{Math.round(contributor.avgLinesPerCommit)}/commit</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Average lines changed per commit</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
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
                  {isLoadingCommits ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-400">Loading commits...</span>
                    </div>
                  ) : commits.length === 0 ? (
                    <div className="text-center py-8">
                      <GitCommit className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400 mb-2">No commits found</p>
                      <p className="text-sm text-gray-500">
                        Commits will appear here once the repository is processed.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {commits.map((commit) => (
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
                                  <span className="text-xs text-gray-500 font-mono">{commit.sha.substring(0, 8)}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-2"
                                    onClick={() => handleViewCommitOnGitHub(commit.sha)}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  {commit.linesAdded > 0 && (
                                    <span className="text-green-400">+{commit.linesAdded}</span>
                                  )}
                                  {commit.linesDeleted > 0 && (
                                    <span className="text-red-400">-{commit.linesDeleted}</span>
                                  )}
                                  {commit.filesChanged > 0 && (
                                    <span>{commit.filesChanged} file{commit.filesChanged !== 1 ? 's' : ''}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Footer section to make page full width */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <GitCommit className="h-5 w-5" />
                      <span className="text-lg font-medium">Recent Commits</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      These are the recent commits from the repository showing development activity and code changes. 
                      Each commit displays lines added, deleted, and files modified. Feel free to check GitHub for more details.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                      <span>•</span>
                      <span>Data updated daily</span>
                      <span>•</span>
                      <span>AI detection active</span>
                      <span>•</span>
                      <span>Click links for GitHub</span>
                    </div>
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
                  const filteredAlerts = packageData!.alerts.filter(alert => {
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
                              {getAlertIcon(alert.type)}
                              <span className="text-lg font-semibold text-white">
                                {getAlertTitle(alert)}
                              </span>
                              {alert.isResolved && (
                                <Badge variant="secondary" className="text-xs">
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span>{alert.time}</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-300 leading-relaxed">{alert.description}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Alert ID: {alert.id}</span>
                                <span>Status: {alert.isResolved ? 'Resolved' : 'Active'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {jiraConnection && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => handleSendToJira(alert)}
                                  >
                                    <img src="/jira.svg" className="h-4 w-4 dark:invert" />
                                    Send to Jira
                                  </Button>
                                )}

                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs"
                                  onClick={() => handleViewCommitOnGitHub(alert.commitHash)}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Commit
                                </Button>
                                {!alert.isResolved && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={async () => {
                                      try {
                                        // Convert the numeric ID back to the original UUID format
                                        // The alert ID was converted from UUID to number for display
                                        // We need to find the original alert to get the UUID
                                        const alertsResponse = await fetch(`/api/backend/activity/alerts/${userWatchlistId}`)
                                        if (alertsResponse.ok) {
                                          const alertsData = await alertsResponse.json()
                                          const originalAlert = alertsData.alerts.find((a: any) => 
                                            parseInt(a.id.replace(/-/g, '').substring(0, 8), 16) === alert.id
                                          )
                                          
                                          if (originalAlert) {
                                            const response = await fetch(`/api/backend/activity/alerts/${originalAlert.id}/resolve`, {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                            });
                                            if (response.ok) {
                                              // Update the alert in local state
                                              setPackageData(prev => prev ? {
                                                ...prev,
                                                alerts: prev.alerts.map(a => 
                                                  a.id === alert.id ? { ...a, isResolved: true } : a
                                                )
                                              } : null);
                                            }
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Error resolving alert:', error);
                                      }
                                    }}
                                  >
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
              
              {/* Add space above footer */}
              <div className="h-8"></div>
              
              {/* Footer section to make alerts tab full width */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-lg font-medium">Repository Alerts</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      Monitor security and activity alerts for this repository. Alerts are triggered based on commit activity, 
                      code changes, and security thresholds. You can filter alerts by status and manage their resolution.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                      <span>•</span>
                      <span>Real-time monitoring</span>
                      <span>•</span>
                      <span>Security alerts</span>
                      <span>•</span>
                      <span>Activity tracking</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <AlertTriangle className="h-5 w-5" />
                          Alert Settings
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Configure monitoring alerts for this repository. These settings determine what activity patterns will trigger alerts.
                        </CardDescription>
                      </div>
                      {!isEditingAlerts && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleEditAlertSettings}
                        >
                          Edit Settings
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(() => {
                      // Parse the alerts from the package data
                      const alertSettings = isEditingAlerts ? editedAlertSettings : 
                        (packageData?.alertSettings ? 
                          (typeof packageData.alertSettings === 'string' ? JSON.parse(packageData.alertSettings) : packageData.alertSettings) : 
                          null);

                      if (!alertSettings) {
                        return (
                          <div className="text-center py-8">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-400 mb-2">No alert settings found</p>
                            <p className="text-sm text-gray-500">
                              Alert settings will appear here once they are configured.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-6">
                          {/* AI Anomaly Detection */}
                          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Brain className="h-5 w-5 text-indigo-400" />
                              <div>
                                <div className="font-medium text-white">AI Anomaly Detection</div>
                                <div className="text-sm text-gray-400">Use AI to detect suspicious commit patterns</div>
                              </div>
                            </div>
                            {isEditingAlerts ? (
                              <Switch
                                checked={alertSettings.ai_powered_anomaly_detection?.enabled || false}
                                onCheckedChange={(enabled) => handleToggleAlert('ai_powered_anomaly_detection', enabled)}
                              />
                            ) : (
                              <Badge variant="outline" className={`${
                                alertSettings.ai_powered_anomaly_detection?.enabled 
                                  ? 'border-green-600 text-green-400' 
                                  : 'border-gray-600 text-gray-400'
                              }`}>
                                {alertSettings.ai_powered_anomaly_detection?.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            )}
                          </div>

                          {/* Lines Added/Deleted */}
                          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Activity className="h-5 w-5 text-emerald-400" />
                              <div>
                                <div className="font-medium text-white">Lines Added/Deleted</div>
                                <div className="text-sm text-gray-400">
                                  Alert when commits exceed normal line change thresholds
                                  {alertSettings.lines_added_deleted?.enabled && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Hard threshold: {alertSettings.lines_added_deleted.hardcoded_threshold} lines
                                      <br />
                                      Contributor variance: {alertSettings.lines_added_deleted.contributor_variance}σ
                                      <br />
                                      Repository variance: {alertSettings.lines_added_deleted.repository_variance}σ
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isEditingAlerts ? (
                              <Switch
                                checked={alertSettings.lines_added_deleted?.enabled || false}
                                onCheckedChange={(enabled) => handleToggleAlert('lines_added_deleted', enabled)}
                              />
                            ) : (
                              <Badge variant="outline" className={`${
                                alertSettings.lines_added_deleted?.enabled 
                                  ? 'border-green-600 text-green-400' 
                                  : 'border-gray-600 text-gray-400'
                              }`}>
                                {alertSettings.lines_added_deleted?.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Lines Added/Deleted Configuration */}
                          {isEditingAlerts && alertSettings.lines_added_deleted?.enabled && (
                            <div className="ml-8 p-4 bg-gray-900/50 rounded-lg space-y-4">
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm text-gray-300">Contributor Variance</Label>
                                    <span className="text-sm text-gray-400">{alertSettings.lines_added_deleted.contributor_variance}</span>
                                  </div>
                                  <Slider
                                    value={[alertSettings.lines_added_deleted.contributor_variance]}
                                    onValueChange={(value) => handleUpdateAlertThreshold('lines_added_deleted', 'contributor_variance', value[0])}
                                    max={10}
                                    min={1}
                                    step={0.1}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm text-gray-300">Repository Variance</Label>
                                    <span className="text-sm text-gray-400">{alertSettings.lines_added_deleted.repository_variance}</span>
                                  </div>
                                  <Slider
                                    value={[alertSettings.lines_added_deleted.repository_variance]}
                                    onValueChange={(value) => handleUpdateAlertThreshold('lines_added_deleted', 'repository_variance', value[0])}
                                    max={10}
                                    min={1}
                                    step={0.1}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm text-gray-300">Hard Threshold</Label>
                                  <Input
                                    type="number"
                                    value={alertSettings.lines_added_deleted.hardcoded_threshold}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const numValue = value === '' ? 0 : parseInt(value, 10);
                                      if (!isNaN(numValue)) {
                                        handleUpdateAlertThreshold('lines_added_deleted', 'hardcoded_threshold', numValue);
                                      }
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="h-8 text-sm bg-black border-gray-700 text-white mt-2"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Files Changed */}
                          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-cyan-400" />
                              <div>
                                <div className="font-medium text-white">Files Changed</div>
                                <div className="text-sm text-gray-400">
                                  Alert when commits modify many files
                                  {alertSettings.files_changed?.enabled && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Hard threshold: {alertSettings.files_changed.hardcoded_threshold} files
                                      <br />
                                      Contributor variance: {alertSettings.files_changed.contributor_variance}σ
                                      <br />
                                      Repository variance: {alertSettings.files_changed.repository_variance}σ
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isEditingAlerts ? (
                              <Switch
                                checked={alertSettings.files_changed?.enabled || false}
                                onCheckedChange={(enabled) => handleToggleAlert('files_changed', enabled)}
                              />
                            ) : (
                              <Badge variant="outline" className={`${
                                alertSettings.files_changed?.enabled 
                                  ? 'border-green-600 text-green-400' 
                                  : 'border-gray-600 text-gray-400'
                              }`}>
                                {alertSettings.files_changed?.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Files Changed Configuration */}
                          {isEditingAlerts && alertSettings.files_changed?.enabled && (
                            <div className="ml-8 p-4 bg-gray-900/50 rounded-lg space-y-4">
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm text-gray-300">Contributor Variance</Label>
                                    <span className="text-sm text-gray-400">{alertSettings.files_changed.contributor_variance}</span>
                                  </div>
                                  <Slider
                                    value={[alertSettings.files_changed.contributor_variance]}
                                    onValueChange={(value) => handleUpdateAlertThreshold('files_changed', 'contributor_variance', value[0])}
                                    max={10}
                                    min={1}
                                    step={0.1}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm text-gray-300">Repository Variance</Label>
                                    <span className="text-sm text-gray-400">{alertSettings.files_changed.repository_variance}</span>
                                  </div>
                                  <Slider
                                    value={[alertSettings.files_changed.repository_variance]}
                                    onValueChange={(value) => handleUpdateAlertThreshold('files_changed', 'repository_variance', value[0])}
                                    max={10}
                                    min={1}
                                    step={0.1}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm text-gray-300">Hard Threshold</Label>
                                  <Input
                                    type="number"
                                    value={alertSettings.files_changed.hardcoded_threshold}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const numValue = value === '' ? 0 : parseInt(value, 10);
                                      if (!isNaN(numValue)) {
                                        handleUpdateAlertThreshold('files_changed', 'hardcoded_threshold', numValue);
                                      }
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="h-8 text-sm bg-black border-gray-700 text-white mt-2"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Suspicious Author Timestamps */}
                          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-orange-400" />
                              <div>
                                <div className="font-medium text-white">Suspicious Author Timestamps</div>
                                <div className="text-sm text-gray-400">
                                  Alert when authors commit outside their normal hours
                                </div>
                              </div>
                            </div>
                            {isEditingAlerts ? (
                              <Switch
                                checked={alertSettings.suspicious_author_timestamps?.enabled || false}
                                onCheckedChange={(enabled) => handleToggleAlert('suspicious_author_timestamps', enabled)}
                              />
                            ) : (
                              <Badge variant="outline" className={`${
                                alertSettings.suspicious_author_timestamps?.enabled 
                                  ? 'border-green-600 text-green-400' 
                                  : 'border-gray-600 text-gray-400'
                              }`}>
                                {alertSettings.suspicious_author_timestamps?.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            )}
                          </div>

                          {/* New Vulnerabilities Detected */}
                          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Shield className="h-5 w-5 text-red-400" />
                              <div>
                                <div className="font-medium text-white">New Vulnerabilities Detected</div>
                                <div className="text-sm text-gray-400">
                                  Alert when new security vulnerabilities are discovered
                                </div>
                              </div>
                            </div>
                            {isEditingAlerts ? (
                              <Switch
                                checked={alertSettings.new_vulnerabilities_detected?.enabled || false}
                                onCheckedChange={(enabled) => handleToggleAlert('new_vulnerabilities_detected', enabled)}
                              />
                            ) : (
                              <Badge variant="outline" className={`${
                                alertSettings.new_vulnerabilities_detected?.enabled 
                                  ? 'border-green-600 text-green-400' 
                                  : 'border-gray-600 text-gray-400'
                              }`}>
                                {alertSettings.new_vulnerabilities_detected?.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            )}
                          </div>

                          {/* Health Score Decreases */}
                          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <TrendingDown className="h-5 w-5 text-yellow-400" />
                              <div>
                                <div className="font-medium text-white">Health Score Decreases</div>
                                <div className="text-sm text-gray-400">
                                  Alert when repository health score decreases significantly
                                  {alertSettings.health_score_decreases?.enabled && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Minimum change: {alertSettings.health_score_decreases.minimum_health_change} points
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isEditingAlerts ? (
                              <Switch
                                checked={alertSettings.health_score_decreases?.enabled || false}
                                onCheckedChange={(enabled) => handleToggleAlert('health_score_decreases', enabled)}
                              />
                            ) : (
                              <Badge variant="outline" className={`${
                                alertSettings.health_score_decreases?.enabled 
                                  ? 'border-green-600 text-green-400' 
                                  : 'border-gray-600 text-gray-400'
                              }`}>
                                {alertSettings.health_score_decreases?.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Health Score Decreases Configuration */}
                          {isEditingAlerts && alertSettings.health_score_decreases?.enabled && (
                            <div className="ml-8 p-4 bg-gray-900/50 rounded-lg space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm text-gray-300">Minimum Health Change</Label>
                                  <span className="text-sm text-gray-400">{alertSettings.health_score_decreases.minimum_health_change} points</span>
                                </div>
                                <Slider
                                  value={[alertSettings.health_score_decreases.minimum_health_change]}
                                  onValueChange={(value) => handleUpdateAlertThreshold('health_score_decreases', 'minimum_health_change', value[0])}
                                  max={5}
                                  min={0.5}
                                  step={0.1}
                                  className="w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">Alert when health score decreases by this amount or more (0.5 to 5.0 points)</p>
                              </div>
                            </div>
                          )}

                          {/* Edit Actions */}
                          {isEditingAlerts && (
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-800">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={isSavingAlerts}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm"
                                onClick={handleSaveAlertSettings}
                                disabled={isSavingAlerts}
                              >
                                {isSavingAlerts ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>



                {/* Remove Repository */}
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-red-400 mb-2">Remove from Watchlist</h4>
                      <p className="text-sm text-gray-300 mb-4">
                        This will permanently remove the repository from your watchlist and delete all associated data including health scores, activity history, alerts, and monitoring settings. This action cannot be undone.
                      </p>
                    </div>
                    <Button variant="destructive" className="ml-4" onClick={handleRemoveFromWatchlist}>
                      Remove Repository
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </FullWidthContainer>
    </FullWidthPage>
  )
} 