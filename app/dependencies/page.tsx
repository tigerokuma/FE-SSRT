"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Check,
  Clock,
  ExternalLink,
  Package,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"

const dependenciesData = [
  {
    id: 1,
    name: "lodash",
    version: "4.17.21",
    type: "production",
    risk: "low",
    activity: "high",
    lastUpdate: "2 days ago",
    cves: 0,
    maintainers: 5,
    stars: "52.4k",
  },
  {
    id: 2,
    name: "react",
    version: "18.2.0",
    type: "production",
    risk: "low",
    activity: "high",
    lastUpdate: "1 week ago",
    cves: 0,
    maintainers: 12,
    stars: "203k",
  },
  {
    id: 3,
    name: "axios",
    version: "1.3.4",
    type: "production",
    risk: "medium",
    activity: "medium",
    lastUpdate: "1 month ago",
    cves: 1,
    maintainers: 3,
    stars: "98.2k",
  },
  {
    id: 4,
    name: "moment",
    version: "2.29.4",
    type: "production",
    risk: "high",
    activity: "low",
    lastUpdate: "6 months ago",
    cves: 2,
    maintainers: 2,
    stars: "46.8k",
  },
  {
    id: 5,
    name: "express",
    version: "4.18.2",
    type: "production",
    risk: "low",
    activity: "high",
    lastUpdate: "3 months ago",
    cves: 0,
    maintainers: 8,
    stars: "59.7k",
  },
]

export default function DependenciesPage() {
  const [dependencies] = useState(dependenciesData)
  const [isAddDependencyOpen, setIsAddDependencyOpen] = useState(false)

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            <ShieldAlert className="mr-1 h-3 w-3" />
            High Risk
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <Shield className="mr-1 h-3 w-3" />
            Medium Risk
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Low Risk
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getActivityBadge = (activity: string) => {
    switch (activity) {
      case "high":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <Check className="mr-1 h-3 w-3" />
            High Activity
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <Clock className="mr-1 h-3 w-3" />
            Medium Activity
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Low Activity
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Dependency Watchlist" description="Monitor and manage your project dependencies">
        <div className="flex items-center gap-2">
          <Dialog open={isAddDependencyOpen} onOpenChange={setIsAddDependencyOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Dependency
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Dependency to Watchlist</DialogTitle>
                <DialogDescription>Search for a package to add to your watchlist for monitoring.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-2">
                  <Input placeholder="Search for a package..." className="flex-1" />
                  <Button size="icon" variant="ghost">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      <span className="font-medium">react-query</span>
                    </div>
                    <Badge variant="outline">v4.28.0</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Hooks for fetching, caching and updating asynchronous data in React
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span>Stars: 34.2k</span>
                    <span>•</span>
                    <span>Weekly Downloads: 2.8M</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Select>
                      <SelectTrigger id="version">
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4.28.0">4.28.0 (Latest)</SelectItem>
                        <SelectItem value="4.27.0">4.27.0</SelectItem>
                        <SelectItem value="4.26.1">4.26.1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Dependency Type</Label>
                    <Select>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="peer">Peer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDependencyOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDependencyOpen(false)}>Add to Watchlist</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="container py-6">
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Dependencies</TabsTrigger>
              <TabsTrigger value="high-risk">High Risk</TabsTrigger>
              <TabsTrigger value="cve">CVE Alerts</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Input placeholder="Search dependencies..." className="w-[250px]" />
            </div>
          </div>
          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dependency Watchlist</CardTitle>
                <CardDescription>Monitor the health and activity of your dependencies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {dependencies.map((dependency) => (
                    <div
                      key={dependency.id}
                      className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">{dependency.name}</h3>
                          <Badge variant="outline">{dependency.version}</Badge>
                          <Badge variant="secondary">{dependency.type}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getRiskBadge(dependency.risk)}
                          {getActivityBadge(dependency.activity)}
                          {dependency.cves > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {dependency.cves} CVEs
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Updated: {dependency.lastUpdate}</span>
                          <span>Maintainers: {dependency.maintainers}</span>
                          <span>Stars: {dependency.stars}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 sm:mt-0">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Previous</Button>
                <Button variant="outline">Next</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="high-risk" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>High Risk Dependencies</CardTitle>
                <CardDescription>Dependencies that require immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {dependencies
                    .filter((dependency) => dependency.risk === "high")
                    .map((dependency) => (
                      <div
                        key={dependency.id}
                        className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium">{dependency.name}</h3>
                            <Badge variant="outline">{dependency.version}</Badge>
                            <Badge variant="secondary">{dependency.type}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getRiskBadge(dependency.risk)}
                            {getActivityBadge(dependency.activity)}
                            {dependency.cves > 0 && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {dependency.cves} CVEs
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Updated: {dependency.lastUpdate}</span>
                            <span>Maintainers: {dependency.maintainers}</span>
                            <span>Stars: {dependency.stars}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 sm:mt-0">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cve" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>CVE Alerts</CardTitle>
                <CardDescription>Dependencies with known security vulnerabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {dependencies
                    .filter((dependency) => dependency.cves > 0)
                    .map((dependency) => (
                      <div
                        key={dependency.id}
                        className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium">{dependency.name}</h3>
                            <Badge variant="outline">{dependency.version}</Badge>
                            <Badge variant="secondary">{dependency.type}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getRiskBadge(dependency.risk)}
                            {getActivityBadge(dependency.activity)}
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {dependency.cves} CVEs
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Updated: {dependency.lastUpdate}</span>
                            <span>Maintainers: {dependency.maintainers}</span>
                            <span>Stars: {dependency.stars}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 sm:mt-0">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>CVE Warnings</CardTitle>
              <CardDescription>Security vulnerabilities in your dependencies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-red-800 dark:text-red-300">CVE-2023-1234</h3>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-400">Affects: moment (2.29.4)</p>
                      <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                        A vulnerability in the moment library allows attackers to potentially execute arbitrary code
                        through malicious date strings. This vulnerability has a CVSS score of 7.5 (High).
                      </p>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-red-800 dark:text-red-300">CVE-2023-5678</h3>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-400">Affects: axios (1.3.4)</p>
                      <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                        A vulnerability in axios could allow an attacker to perform server-side request forgery (SSRF)
                        attacks. This vulnerability has a CVSS score of 6.5 (Medium).
                      </p>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
