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
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PageHeader } from "@/components/page-header"
import { FullWidthContainer, FullWidthPage } from "@/components/full-width-container"
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
  aiOverview: string
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
  }>
  healthHistory: Array<{
    date: string
    score: number
  }>
  alerts: Array<{
    id: number
    type: string
    severity: string
    message: string
    description: string
    time: string
  }>
}

export default function PackageDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const packageName = searchParams.get("name") || "lodash"
  const [packageData, setPackageData] = useState<PackageDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [commitSummary, setCommitSummary] = useState<string | null>(null)

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchPackageDetails = async () => {
      setIsLoading(true)
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/packages/${packageName}/details`)
        // const data = await response.json()
        
        // Mock data for now
        const mockData: PackageDetails = {
          name: packageName,
          description: "A modern JavaScript utility library delivering modularity, performance, & extras.",
          version: "4.17.21",
          stars: 52400,
          forks: 6800,
          lastUpdated: "2 days ago",
          language: "JavaScript",
          healthScore: 85,
          activityScore: 92,
          busFactor: 78,
          aiOverview: "This package shows excellent maintainability with consistent commit activity and a healthy contributor base. The bus factor indicates good distribution of responsibility among maintainers. Recent activity suggests active development with regular updates and bug fixes.",
          maintainers: [
            { name: "John Dalton", avatar: "/placeholder-user.jpg", initials: "JD" },
            { name: "Mathias Bynens", avatar: "/placeholder-user.jpg", initials: "MB" },
          ],
          commits: [
            {
              id: "abc123",
              message: "Fix: Resolve issue with _.debounce when used with React hooks",
              author: "John Smith",
              time: "2 hours ago",
              avatar: "/placeholder-user.jpg",
              initials: "JS",
            },
            {
              id: "def456",
              message: "Refactor: Improve performance of _.map for large arrays",
              author: "Alex Turner",
              time: "2 days ago",
              avatar: "/placeholder-user.jpg",
              initials: "AT",
            },
            {
              id: "ghi789",
              message: "Docs: Update documentation for _.throttle",
              author: "Emma Wilson",
              time: "3 days ago",
              avatar: "/placeholder-user.jpg",
              initials: "EW",
            },
            {
              id: "jkl012",
              message: "Test: Add tests for _.memoize edge cases",
              author: "Sarah Johnson",
              time: "4 days ago",
              avatar: "/placeholder-user.jpg",
              initials: "SJ",
            },
          ],
          healthHistory: [
            { date: "2024-01-01", score: 82 },
            { date: "2024-02-01", score: 84 },
            { date: "2024-03-01", score: 83 },
            { date: "2024-04-01", score: 86 },
            { date: "2024-05-01", score: 85 },
            { date: "2024-06-01", score: 87 },
            { date: "2024-07-01", score: 85 },
          ],
          alerts: [
            {
              id: 1,
              type: "high_loc",
              severity: "medium",
              message: "High LOC PR Detected",
              description: "PR #1234 contains over 500 lines of code",
              time: "2 days ago",
            },
          ],
        }
        
        setPackageData(mockData)
      } catch (error) {
        console.error("Error fetching package details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPackageDetails()
  }, [packageName])

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
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
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
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Star
              </Button>
              <Button variant="outline" size="sm">
                <GitFork className="h-4 w-4 mr-2" />
                Fork
              </Button>
              <Button variant="outline" size="sm">
                <GithubIcon className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {packageData.alerts.length > 0 && (
          <div className="mb-6 flex gap-2">
            {packageData.alerts.map((alert) => (
              <Badge
                key={alert.id}
                className={`${getSeverityColor(alert.severity)} flex items-center gap-1`}
              >
                <AlertTriangle className="h-3 w-3" />
                {alert.message}
              </Badge>
            ))}
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="graph">Graph</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column - Metrics */}
                <div className="lg:col-span-3 space-y-6">
                  {/* AI Overview */}
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Brain className="h-5 w-5" />
                        AI Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed">
                        {packageData.aiOverview}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Health Score Graph */}
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="h-5 w-5" />
                        Health Score History
                      </CardTitle>
                    </CardHeader>
                                      <CardContent>
                    <div className="h-48 relative">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <g stroke="#374151" strokeWidth="0.5" opacity="0.3">
                          {[20, 40, 60, 80, 100].map((y) => (
                            <line key={y} x1="0" y1={100 - y} x2="100" y2={100 - y} />
                          ))}
                        </g>
                        {/* Line path */}
                        <path
                          d={`M 0,${100 - (packageData.healthHistory[0].score * 100 / 100)} ${packageData.healthHistory.map((point, index) => {
                            const x = (index) * (100 / (packageData.healthHistory.length - 1))
                            const y = 100 - (point.score * 100 / 100)
                            return `L ${x},${y}`
                          }).join(' ')}`}
                          fill="none"
                          stroke="url(#healthGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Fill area */}
                        <path
                          d={`M 0,${100 - (packageData.healthHistory[0].score * 100 / 100)} ${packageData.healthHistory.map((point, index) => {
                            const x = (index) * (100 / (packageData.healthHistory.length - 1))
                            const y = 100 - (point.score * 100 / 100)
                            return `L ${x},${y}`
                          }).join(' ')} L 100,100 L 0,100 Z`}
                          fill="url(#healthGradient)"
                          opacity="0.2"
                        />
                        {/* Data points */}
                        {packageData.healthHistory.map((point, index) => {
                          const x = (index) * (100 / (packageData.healthHistory.length - 1))
                          const y = 100 - (point.score * 100 / 100)
                          return (
                            <circle
                              key={index}
                              cx={x}
                              cy={y}
                              r="1.5"
                              fill="#10b981"
                              stroke="none"
                            />
                          )
                        })}
                      </svg>
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        {packageData.healthHistory.map((point, index) => (
                          <span key={index}>{point.score}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                </div>

                {/* Right Column - Stats */}
                <div className="space-y-6">
                  {/* Repository Info */}
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Repository Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-300">{packageData.stars.toLocaleString()} stars</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <GitFork className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">{packageData.forks.toLocaleString()} forks</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">Updated {packageData.lastUpdated}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Code className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{packageData.language}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Metrics */}
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Health Score</span>
                          <span className={`text-lg font-semibold ${getScoreColor(packageData.healthScore)}`}>
                            {packageData.healthScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${packageData.healthScore}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Activity Score</span>
                          <span className={`text-lg font-semibold ${getScoreColor(packageData.activityScore)}`}>
                            {packageData.activityScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${packageData.activityScore}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Bus Factor</span>
                          <span className={`text-lg font-semibold ${getScoreColor(packageData.busFactor)}`}>
                            {packageData.busFactor}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${packageData.busFactor}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Maintainers */}
                  <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Maintainers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {packageData.maintainers.map((maintainer, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={maintainer.avatar} />
                              <AvatarFallback className="bg-gray-700 text-white">
                                {maintainer.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-300">{maintainer.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Recent Commits</h2>
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
                </div>

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
                <CardContent className="p-0">
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
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{commit.message}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-mono">{commit.id}</span>
                              <Button variant="ghost" size="sm" className="h-6 px-2">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
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

          <TabsContent value="graph" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-12">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white mb-2">Graph Analysis</h3>
                    <p className="text-gray-400">
                      This feature is currently under development by the graph team.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </FullWidthContainer>
    </FullWidthPage>
  )
} 