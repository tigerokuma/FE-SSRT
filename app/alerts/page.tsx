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
    <div className="flex flex-col">
      <PageHeader title="Alert Center" description="Monitor and manage security and activity alerts">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Alert Rule</DialogTitle>
                <DialogDescription>Define conditions that will trigger alerts for your repositories.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rule-name" className="text-right">
                    Rule Name
                  </Label>
                  <Input id="rule-name" placeholder="e.g., High LOC PR" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rule-type" className="text-right">
                    Rule Type
                  </Label>
                  <Select>
                    <SelectTrigger id="rule-type" className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="condition" className="text-right">
                    Condition
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loc">Lines of Code</SelectItem>
                        <SelectItem value="files_changed">Files Changed</SelectItem>
                        <SelectItem value="commit_frequency">Commit Frequency</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">Greater Than</SelectItem>
                        <SelectItem value="lt">Less Than</SelectItem>
                        <SelectItem value="eq">Equal To</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Value" className="w-[120px]" />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="severity" className="text-right">
                    Severity
                  </Label>
                  <Select>
                    <SelectTrigger id="severity" className="col-span-3">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team" className="text-right">
                    Assign to Team
                  </Label>
                  <Select>
                    <SelectTrigger id="team" className="col-span-3">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="frontend">Frontend</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateRuleOpen(false)}>Create Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="container py-6">
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Alerts</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Input placeholder="Search alerts..." className="w-[250px]" />
            </div>
          </div>
          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Alerts</CardTitle>
                <CardDescription>View and manage all alerts across your repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.rule}</TableCell>
                        <TableCell>{alert.repository}</TableCell>
                        <TableCell>{alert.team}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>{alert.created}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Previous</Button>
                <Button variant="outline">Next</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="open" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Open Alerts</CardTitle>
                <CardDescription>View and manage open alerts that require attention</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts
                      .filter((alert) => alert.status === "open")
                      .map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.rule}</TableCell>
                          <TableCell>{alert.repository}</TableCell>
                          <TableCell>{alert.team}</TableCell>
                          <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                          <TableCell>{alert.created}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="resolved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resolved Alerts</CardTitle>
                <CardDescription>View previously resolved alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Resolved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts
                      .filter((alert) => alert.status === "resolved")
                      .map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.rule}</TableCell>
                          <TableCell>{alert.repository}</TableCell>
                          <TableCell>{alert.team}</TableCell>
                          <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                          <TableCell>{alert.created}</TableCell>
                          <TableCell>1 day ago</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Rule Simulator</CardTitle>
              <CardDescription>Test your alert rules before deploying them</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="rule-select">Select Rule to Simulate</Label>
                    <Select>
                      <SelectTrigger id="rule-select" className="mt-1">
                        <SelectValue placeholder="Select a rule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_loc">High LOC PR</SelectItem>
                        <SelectItem value="risky_import">Risky Import</SelectItem>
                        <SelectItem value="cve_alert">CVE Alert</SelectItem>
                        <SelectItem value="inactive_maintainer">Inactive Maintainer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="repo-select">Select Repository</Label>
                    <Select>
                      <SelectTrigger id="repo-select" className="mt-1">
                        <SelectValue placeholder="Select a repository" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lodash">lodash/lodash</SelectItem>
                        <SelectItem value="nextjs">vercel/next.js</SelectItem>
                        <SelectItem value="react">facebook/react</SelectItem>
                        <SelectItem value="tailwind">tailwindlabs/tailwindcss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>Run Simulation</Button>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium">Simulation Results</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Run a simulation to see how your rule would perform on historical data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
