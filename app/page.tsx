import { AlertTriangle, BarChart3, GitBranch, Package, Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityFeed } from "@/components/activity-feed"
import { PageHeader } from "@/components/page-header"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="OpenSource Insight Tracker"
        description="Monitor the health, risk, and activity of open-source repositories"
      >
        <div className="flex items-center gap-2">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Quick Search
          </Button>
        </div>
      </PageHeader>

      <section className="container py-6 md:py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Gain Insights Into Your Open Source Dependencies
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Track health, risk, and activity of repositories to make informed decisions about your dependencies.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button size="lg">Get Started</Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Track a Repository</CardTitle>
              <CardDescription>Monitor activity and health</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <GitBranch className="h-6 w-6" />
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/repository">
                  Start Tracking
                  <span className="sr-only">Track a Repository</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Watch a Dependency</CardTitle>
              <CardDescription>Get alerts on changes</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Package className="h-6 w-6" />
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/dependencies">
                  Add Dependency
                  <span className="sr-only">Watch a Dependency</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">View Alerts</CardTitle>
              <CardDescription>Check security and activity alerts</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/alerts">
                  View Alerts
                  <span className="sr-only">View Alerts</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Export Graphs</CardTitle>
              <CardDescription>Generate visual insights</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/graph-export">
                  Create Graph
                  <span className="sr-only">Export Graphs</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="container py-8">
        <Tabs defaultValue="activity" className="w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Repository Activity Feed</CardTitle>
                <CardDescription>Recent events from your tracked repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Activity
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Security and activity alerts from your tracked repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">High LOC PR Detected</p>
                      <p className="text-sm text-muted-foreground">
                        lodash/lodash - PR #1234 contains over 500 lines of code
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Risky Import Detected</p>
                      <p className="text-sm text-muted-foreground">
                        vercel/next.js - New dependency added with low maintainer score
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">CVE Alert</p>
                      <p className="text-sm text-muted-foreground">
                        facebook/react - Dependency has a new CVE: CVE-2023-1234
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Alerts
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
