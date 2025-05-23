import { AlertTriangle, BarChart3, GitBranch, Package, Search, CheckCircle2, ArrowRight } from "lucide-react"
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
          <Button className="w-full sm:w-auto">
            <Search className="mr-2 h-4 w-4" />
            Quick Search
          </Button>
        </div>
      </PageHeader>

      <section className="container py-4 sm:py-6 md:py-10">
        <div className="mx-auto max-w-3xl lg:max-w-5xl space-y-4 sm:space-y-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl px-2">
              Gain Insights Into Your Open Source Dependencies
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg px-4 sm:px-6">
              Track health, risk, and activity of repositories to make informed decisions about your dependencies.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 px-4">
              <Button size="lg" className="w-full sm:w-auto">Get Started</Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 sm:py-12">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 px-2 sm:px-0">
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-primary/10">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <GitBranch className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-semibold pt-4">Track a Repository</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Monitor repository activity and track overall health metrics in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Real-time activity monitoring</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Health score tracking</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Automated issue detection</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-between">
                Learn More <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="group relative overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-primary/10">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Package className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-semibold pt-4">Watch Dependencies</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Stay updated on dependency changes and security vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Version update notifications</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Security vulnerability alerts</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Dependency health metrics</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-between">
                Learn More <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="group relative overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-primary/10">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-semibold pt-4">Security Alerts</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Monitor and respond to security alerts and vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Real-time security notifications</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Vulnerability assessment</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Automated fix suggestions</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-between">
                Learn More <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="group relative overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-primary/10">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <BarChart3 className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-semibold pt-4">Insights & Graphs</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Generate visual insights and dependency graphs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Interactive dependency graphs</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Trend analysis</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Custom graph exports</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-between">
                Learn More <ArrowRight className="h-4 w-4 ml-2" />
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
