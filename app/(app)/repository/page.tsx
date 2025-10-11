"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, Calendar, Code, ExternalLink, GitCommit, GitFork, GithubIcon, GitPullRequest, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PageHeader } from "@/components/page-header"

export default function RepositoryPage() {
  const searchParams = useSearchParams()
  const repoParam = searchParams.get("repo") || "lodash/lodash"

  const [repo] = useState({
    name: repoParam,
    description: "A modern JavaScript utility library delivering modularity, performance, & extras.",
    stars: "52.4k",
    forks: "6.8k",
    lastUpdated: "2 days ago",
    language: "JavaScript",
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
      {
        id: "mno345",
        message: "Chore: Update dependencies and build process",
        author: "Mike Chen",
        time: "5 days ago",
        avatar: "/placeholder-user.jpg",
        initials: "MC",
      },
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
      {
        id: 2,
        type: "risky_import",
        severity: "high",
        message: "Risky Import Detected",
        description: "New dependency added with low maintainer score",
        time: "3 days ago",
      },
    ],
  })

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

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <PageHeader title={repo.name} description={repo.description}>
        <div className="grid grid-cols-3 sm:flex sm:flex-row w-full sm:w-auto gap-2 mt-2 sm:mt-0">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full sm:w-auto bg-primary/10 hover:bg-primary/20 text-primary border-0 flex items-center justify-center h-12 sm:h-9"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Star className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Star</span>
            </div>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="w-full sm:w-auto bg-primary/10 hover:bg-primary/20 text-primary border-0 flex items-center justify-center h-12 sm:h-9"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <GitFork className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Fork</span>
            </div>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="w-full sm:w-auto bg-primary/10 hover:bg-primary/20 text-primary border-0 flex items-center justify-center h-12 sm:h-9"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <GithubIcon className="h-4 w-4" />
              <span className="text-xs sm:text-sm whitespace-nowrap">GitHub</span>
            </div>
          </Button>
        </div>
      </PageHeader>

      <div className="py-4 sm:py-6 w-full max-w-full overflow-x-hidden">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
          <div className="lg:col-span-2 space-y-4 sm:space-y-0 w-full">
            <Card className="w-full">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <CardTitle className="text-xl sm:text-2xl">Repository Activity</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {repo.alerts.map((alert) => (
                      <Badge key={alert.id} variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <span>{alert.message}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardDescription>Recent commits and activity</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Tabs defaultValue="commits">
                  <TabsList className="mb-4 w-full sm:w-auto flex">
                    <TabsTrigger value="commits" className="flex-1 sm:flex-none text-sm">Commits</TabsTrigger>
                    <TabsTrigger value="pulls" className="flex-1 sm:flex-none text-sm">Pull Requests</TabsTrigger>
                    <TabsTrigger value="issues" className="flex-1 sm:flex-none text-sm">Issues</TabsTrigger>
                  </TabsList>
                  <TabsContent value="commits" className="space-y-3 sm:space-y-4">
                    {repo.commits.map((commit) => (
                      <div key={commit.id} className="flex items-start gap-2 sm:gap-4 rounded-lg border p-3 sm:p-4 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={commit.avatar || "/placeholder.svg"} alt={commit.author} />
                          <AvatarFallback>{commit.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium truncate">{commit.author}</span>
                            <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                              <GitCommit className="h-3 w-3" />
                              <span className="text-xs">{commit.id.substring(0, 7)}</span>
                            </Badge>
                          </div>
                          <p className="text-sm break-words">{commit.message}</p>
                          <p className="text-xs text-muted-foreground">{commit.time}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 hidden sm:flex">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="pulls">
                    <div className="rounded-lg border p-8 text-center">
                      <GitPullRequest className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No Open Pull Requests</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        There are no open pull requests for this repository at the moment.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="issues">
                    <div className="rounded-lg border p-8 text-center">
                      <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">No Open Issues</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        There are no open issues for this repository at the moment.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4 sm:space-y-6 w-full">
            <Card className="w-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Repository Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Star className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{repo.stars} stars</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <GitFork className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{repo.forks} forks</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">Updated {repo.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Code className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{repo.language}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Maintainers</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:gap-4">
                  {repo.maintainers.map((maintainer) => (
                    <div key={maintainer.name} className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={maintainer.avatar} alt={maintainer.name} />
                        <AvatarFallback>{maintainer.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{maintainer.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Alerts</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {repo.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-2 sm:gap-4 rounded-lg border p-3 sm:p-4 min-w-0">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${getSeverityColor(alert.severity)}`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">{alert.message}</p>
                        <p className="text-xs text-muted-foreground break-words">{alert.description}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

