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
  Users,
  Star,
  ArrowDown,
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
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Dependency Watchlist" description="Monitor and manage your project dependencies">
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isAddDependencyOpen} onOpenChange={setIsAddDependencyOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Dependency
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px]">
              <DialogHeader className="space-y-2 pb-4">
                <DialogTitle>Add Dependency to Watchlist</DialogTitle>
                <DialogDescription>Search for a package to add to your watchlist for monitoring.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input placeholder="Search for a package..." className="flex-1 min-w-0" />
                    <Button size="icon" variant="ghost" className="shrink-0">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="h-5 w-5 shrink-0" />
                        <span className="font-medium truncate">react-query</span>
                      </div>
                      <Badge variant="outline" className="shrink-0">v4.28.0</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-words">
                      Hooks for fetching, caching and updating asynchronous data in React
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span>34.2k stars</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ArrowDown className="h-4 w-4 text-green-400" />
                      <span>2.8M weekly</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-2 mt-6">
                <Button className="w-full">Add to Watchlist</Button>
                <Button variant="outline" className="w-full" onClick={() => setIsAddDependencyOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="flex-1 py-4">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col gap-4 mb-4">
            <h2 className="text-xl font-bold tracking-tight">Dependencies</h2>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="all" className="px-2 sm:px-4">All</TabsTrigger>
              <TabsTrigger value="production" className="px-2 sm:px-4">Production</TabsTrigger>
              <TabsTrigger value="development" className="px-2 sm:px-4">Development</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {dependencies.map((dep) => (
                <div key={dep.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium min-w-0 truncate">{dep.name}</span>
                      <Badge variant="outline" className="shrink-0">v{dep.version}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="shrink-0">{getRiskBadge(dep.risk)}</div>
                      <div className="shrink-0">{getActivityBadge(dep.activity)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>{dep.cves} CVEs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{dep.maintainers}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span>{dep.stars}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="truncate">Updated {dep.lastUpdate}</span>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
