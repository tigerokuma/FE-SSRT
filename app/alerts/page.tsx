"use client"

import { useState } from "react"
import { AlertTriangle, Check, Filter, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { MainContent } from "@/components/main-content"

const alertsData = [
  {
    id: 1,
    rule: "High LOC PR",
    repository: "lodash/lodash",
    team: "Core",
    severity: "medium",
    status: "open",
    created: "2 days ago",
    description: "PR #1234 contains over 500 lines of code",
  },
  {
    id: 2,
    rule: "Risky Import",
    repository: "vercel/next.js",
    team: "Frontend",
    severity: "high",
    status: "open",
    created: "3 days ago",
    description: "New dependency added with low maintainer score",
  },
  {
    id: 3,
    rule: "CVE Alert",
    repository: "facebook/react",
    team: "Frontend",
    severity: "critical",
    status: "open",
    created: "4 days ago",
    description: "Dependency has a new CVE: CVE-2023-1234",
  },
  {
    id: 4,
    rule: "Inactive Maintainer",
    repository: "tailwindlabs/tailwindcss",
    team: "Design",
    severity: "low",
    status: "resolved",
    created: "1 week ago",
    description: "Primary maintainer has been inactive for over 30 days",
  },
  {
    id: 5,
    rule: "Dependency Version",
    repository: "lodash/lodash",
    team: "Core",
    severity: "low",
    status: "resolved",
    created: "1 week ago",
    description: "Using outdated version of dependency with known issues",
  },
]

export default function AlertsPage() {
  const [alerts] = useState(alertsData)
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false)

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "high":
        return <Badge className="bg-red-500">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>
      case "low":
        return <Badge className="bg-green-500">Low</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Open
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <Check className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Alert Center" description="Monitor and manage security and activity alerts">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader className="space-y-2 pb-4">
                <DialogTitle>Create Alert Rule</DialogTitle>
                <DialogDescription>Define conditions that will trigger alerts for your repositories.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input id="rule-name" placeholder="e.g., High LOC PR" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rule-type">Rule Type</Label>
                  <Select>
                    <SelectTrigger id="rule-type">
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pr_size">PR Size</SelectItem>
                      <SelectItem value="dependency">Dependency Change</SelectItem>
                      <SelectItem value="activity">Repository Activity</SelectItem>
                      <SelectItem value="security">Security Vulnerability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="condition">Condition</Label>
                  <div className="grid gap-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loc">Lines of Code</SelectItem>
                        <SelectItem value="files_changed">Files Changed</SelectItem>
                        <SelectItem value="commit_frequency">Commit Frequency</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">Greater Than</SelectItem>
                        <SelectItem value="lt">Less Than</SelectItem>
                        <SelectItem value="eq">Equal To</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Value" />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-2 mt-6">
                <Button className="w-full">Create Rule</Button>
                <Button variant="outline" className="w-full" onClick={() => setIsCreateRuleOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <MainContent>
        <Tabs defaultValue="all">
          <div className="flex flex-col gap-4 mb-4">
            <h2 className="text-xl font-bold tracking-tight">Active Alerts</h2>
            <TabsList className="grid grid-cols-3 max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium line-clamp-1 min-w-0">{alert.rule}</span>
                      <div className="shrink-0">
                        {getStatusBadge(alert.status)}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground line-clamp-1">{alert.repository}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="shrink-0">{getSeverityBadge(alert.severity)}</div>
                    <span className="text-sm text-muted-foreground">{alert.created}</span>
                    {alert.team && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {alert.team}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="open" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {alerts.filter(alert => alert.status === "open").map((alert) => (
                <div key={alert.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium line-clamp-1 min-w-0">{alert.rule}</span>
                      <div className="shrink-0">
                        {getStatusBadge(alert.status)}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground line-clamp-1">{alert.repository}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="shrink-0">{getSeverityBadge(alert.severity)}</div>
                    <span className="text-sm text-muted-foreground">{alert.created}</span>
                    {alert.team && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {alert.team}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                </div>
              ))}
              {alerts.filter(alert => alert.status === "open").length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-lg border bg-card p-8">
                  <Check className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Open Alerts</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    All alerts have been resolved. Create a new alert rule to start monitoring.
                  </p>
                  <Button onClick={() => setIsCreateRuleOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Rule
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {alerts.filter(alert => alert.status === "resolved").map((alert) => (
                <div key={alert.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium line-clamp-1 min-w-0">{alert.rule}</span>
                      <div className="shrink-0">
                        {getStatusBadge(alert.status)}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground line-clamp-1">{alert.repository}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="shrink-0">{getSeverityBadge(alert.severity)}</div>
                    <span className="text-sm text-muted-foreground">{alert.created}</span>
                    {alert.team && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {alert.team}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                </div>
              ))}
              {alerts.filter(alert => alert.status === "resolved").length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-lg border bg-card p-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Resolved Alerts</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    There are no resolved alerts yet. Alerts will appear here once they are addressed.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </MainContent>
    </div>
  )
}
