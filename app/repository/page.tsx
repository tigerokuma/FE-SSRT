"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, Calendar, Code, ExternalLink, GitCommit, GitFork, GitPullRequest, Star } from "lucide-react"

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
    <div className="flex flex-col">
      <PageHeader title={repo.name} description={repo.description}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Star className="mr-2 h-4 w-4" />
            Star
          </Button>
          <Button variant="outline" size="sm">
            <GitFork className="mr-2 h-4 w-4" />
            Fork
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            View on GitHub
          </Button>
        </div>
      </PageHeader>

      <div className="container py-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Repository Activity</CardTitle>
                  <div className="flex gap-2">
                    {repo.alerts.map((alert) => (
                      <Badge key={alert.id} variant="outline" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <span>{alert.message}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardDescription>Recent commits and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="commits">
                  <TabsList className="mb-4">
                    <TabsTrigger value="commits">Commits</TabsTrigger>
                    <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
                    <TabsTrigger value="issues">Issues</TabsTrigger>
                  </TabsList>
                  <TabsContent value="commits" className="space-y-4">
                    {repo.commits.map((commit) => (
                      <div key={commit.id} className="flex items-start gap-4 rounded-lg border p-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={commit.avatar || "/placeholder.svg"} alt={commit.author} />
                          <AvatarFallback>{commit.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{commit.author}</span>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <GitCommit className="h-3 w-3" />
                              <span className="text-xs">{commit.id.substring(0, 7)}</span>
                            </Badge>
                          </div>
                          <p className="text-sm">{commit.message}</p>
                          <p className="text-xs text-muted-foreground">{commit.time}</p>
                        </div>
                        <Button variant="ghost" size="icon">
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Repository Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{repo.stars} stars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitFork className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{repo.forks} forks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Updated {repo.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{repo.language}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Maintainers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {repo.maintainers.map((maintainer, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={maintainer.avatar || "/placeholder.svg"} alt={maintainer.name} />
                        <AvatarFallback>{maintainer.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{maintainer.name}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {repo.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center gap-4 rounded-lg border p-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${getSeverityColor(alert.severity)}`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
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
