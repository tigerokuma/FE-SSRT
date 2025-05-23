import { AlertTriangle, BarChart3, GitBranch, Package, Search, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityFeed } from "@/components/activity-feed"
import { PageHeader } from "@/components/page-header"
import { MainContent } from "@/components/main-content"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
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

      <MainContent className="p-0">
        <section className="py-4 sm:py-6 md:py-8 px-4 sm:px-6">
          <div className="mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                Gain Insights Into Your Open Source Dependencies
              </h1>
              <p className="mx-auto max-w-[800px] text-muted-foreground text-sm sm:text-base">
                Track health, risk, and activity of repositories to make informed decisions about your dependencies.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Button size="lg" className="w-full sm:w-auto">Get Started</Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="w-full">
                <CardHeader className="space-y-1 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Package className="h-5 w-5" />
                    Dependencies
                  </CardTitle>
                  <CardDescription>Monitor your project dependencies</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl font-bold">124</div>
                  <p className="text-xs text-muted-foreground">Active dependencies tracked</p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 pt-0">
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/dependencies" className="flex items-center justify-center">
                      View Dependencies
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="w-full">
                <CardHeader className="space-y-1 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <AlertTriangle className="h-5 w-5" />
                    Alerts
                  </CardTitle>
                  <CardDescription>Security and activity alerts</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-xs text-muted-foreground">Open alerts requiring attention</p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 pt-0">
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/alerts" className="flex items-center justify-center">
                      View Alerts
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="w-full">
                <CardHeader className="space-y-1 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <GitBranch className="h-5 w-5" />
                    Repositories
                  </CardTitle>
                  <CardDescription>Tracked repositories</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl font-bold">15</div>
                  <p className="text-xs text-muted-foreground">Active repositories monitored</p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 pt-0">
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/repositories" className="flex items-center justify-center">
                      View Repositories
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="w-full">
                <CardHeader className="space-y-1 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="h-5 w-5" />
                    Analytics
                  </CardTitle>
                  <CardDescription>Repository insights</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-xs text-muted-foreground">Overall health score</p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 pt-0">
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/analytics" className="flex items-center justify-center">
                      View Analytics
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <div className="py-4 sm:py-8 px-4 sm:px-6">
          <Tabs defaultValue="activity" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Recent Activity</h2>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="activity" className="flex-1 sm:flex-none">Activity</TabsTrigger>
                <TabsTrigger value="alerts" className="flex-1 sm:flex-none">Alerts</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="activity" className="mt-4 sm:mt-6">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
                <Card className="w-full lg:col-span-2">
                  <CardHeader className="space-y-1 p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Repository Activity Feed</CardTitle>
                    <CardDescription>Recent events from your tracked repositories</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <ActivityFeed />
                  </CardContent>
                  <CardFooter className="p-4 sm:p-6 pt-0">
                    <Button variant="outline" className="w-full">
                      View All Activity
                    </Button>
                  </CardFooter>
                </Card>
                <Card className="w-full">
                  <CardHeader className="space-y-1 p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
                    <CardDescription>Overview of repository health</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm">Healthy Repos</span>
                        </div>
                        <span className="font-bold">12/15</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm">At Risk</span>
                        </div>
                        <span className="font-bold">2</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-blue-500" />
                          <span className="text-sm">Updates Available</span>
                        </div>
                        <span className="font-bold">8</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainContent>
    </div>
  )
}
