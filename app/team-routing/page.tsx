"use client"

import { useState } from "react"
import { AlertTriangle, Check, Download, FileUp, Plus, Send, User, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { PageHeader } from "@/components/page-header"

const teamsData = [
  {
    id: 1,
    name: "Core",
    members: 5,
    repositories: 3,
    rules: 4,
  },
  {
    id: 2,
    name: "Frontend",
    members: 8,
    repositories: 5,
    rules: 6,
  },
  {
    id: 3,
    name: "Backend",
    members: 6,
    repositories: 4,
    rules: 5,
  },
  {
    id: 4,
    name: "Design",
    members: 3,
    repositories: 2,
    rules: 2,
  },
]

const routingRulesData = [
  {
    id: 1,
    team: "Core",
    rule: "High LOC PR",
    repository: "lodash/lodash",
    severity: "medium",
    status: "active",
  },
  {
    id: 2,
    team: "Frontend",
    rule: "Risky Import",
    repository: "vercel/next.js",
    severity: "high",
    status: "active",
  },
  {
    id: 3,
    team: "Frontend",
    rule: "CVE Alert",
    repository: "facebook/react",
    severity: "critical",
    status: "active",
  },
  {
    id: 4,
    team: "Backend",
    rule: "Inactive Maintainer",
    repository: "tailwindlabs/tailwindcss",
    severity: "low",
    status: "inactive",
  },
  {
    id: 5,
    team: "Core",
    rule: "Dependency Version",
    repository: "lodash/lodash",
    severity: "low",
    status: "active",
  },
]

export default function TeamRoutingPage() {
  const [teams] = useState(teamsData)
  const [routingRules] = useState(routingRulesData)
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false)
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)

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
      case "active":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <Check className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Team Alert Routing" description="Configure alert routing for your teams">
        <div className="flex items-center gap-2">
          <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Team</DialogTitle>
                <DialogDescription>Create a new team to route alerts to.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team-name" className="text-right">
                    Team Name
                  </Label>
                  <Input id="team-name" placeholder="e.g., Security" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team-description" className="text-right">
                    Description
                  </Label>
                  <Input id="team-description" placeholder="Team description" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team-lead" className="text-right">
                    Team Lead
                  </Label>
                  <Select>
                    <SelectTrigger id="team-lead" className="col-span-3">
                      <SelectValue placeholder="Select team lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Smith</SelectItem>
                      <SelectItem value="sarah">Sarah Johnson</SelectItem>
                      <SelectItem value="mike">Mike Chen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddTeamOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddTeamOpen(false)}>Add Team</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Routing Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Alert Routing Rule</DialogTitle>
                <DialogDescription>
                  Configure which team receives alerts for specific rules and repositories.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rule-team" className="text-right">
                    Team
                  </Label>
                  <Select>
                    <SelectTrigger id="rule-team" className="col-span-3">
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
                  <Label htmlFor="rule-repo" className="text-right">
                    Repository
                  </Label>
                  <Select>
                    <SelectTrigger id="rule-repo" className="col-span-3">
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lodash">lodash/lodash</SelectItem>
                      <SelectItem value="nextjs">vercel/next.js</SelectItem>
                      <SelectItem value="react">facebook/react</SelectItem>
                      <SelectItem value="tailwind">tailwindlabs/tailwindcss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rule-severity" className="text-right">
                    Severity
                  </Label>
                  <Select>
                    <SelectTrigger id="rule-severity" className="col-span-3">
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddRuleOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddRuleOpen(false)}>Add Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="py-6">
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="routing">Routing Rules</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
          </TabsList>
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Manage teams for alert routing</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Repositories</TableHead>
                      <TableHead>Alert Rules</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.members}</TableCell>
                        <TableCell>{team.repositories}</TableCell>
                        <TableCell>{team.rules}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="select-team">Select Team</Label>
                      <Select>
                        <SelectTrigger id="select-team" className="w-[180px]">
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
                    <div className="rounded-lg border p-4">
                      <div className="text-center">
                        <User className="mx-auto h-8 w-8 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No Team Selected</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Select a team to view and manage its members.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Team Repositories</CardTitle>
                  <CardDescription>Manage team repositories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="select-team-repos">Select Team</Label>
                      <Select>
                        <SelectTrigger id="select-team-repos" className="w-[180px]">
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
                    <div className="rounded-lg border p-4">
                      <div className="text-center">
                        <User className="mx-auto h-8 w-8 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No Team Selected</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Select a team to view and manage its repositories.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="routing">
            <Card>
              <CardHeader>
                <CardTitle>Alert Routing Rules</CardTitle>
                <CardDescription>
                  Configure which team receives alerts for specific rules and repositories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routingRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.team}</TableCell>
                        <TableCell>{rule.rule}</TableCell>
                        <TableCell>{rule.repository}</TableCell>
                        <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                        <TableCell>{getStatusBadge(rule.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Alert Routing</CardTitle>
                  <CardDescription>Simulate an alert to test your routing configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="test-rule">Alert Rule</Label>
                      <Select>
                        <SelectTrigger id="test-rule">
                          <SelectValue placeholder="Select rule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_loc">High LOC PR</SelectItem>
                          <SelectItem value="risky_import">Risky Import</SelectItem>
                          <SelectItem value="cve_alert">CVE Alert</SelectItem>
                          <SelectItem value="inactive_maintainer">Inactive Maintainer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test-repo">Repository</Label>
                      <Select>
                        <SelectTrigger id="test-repo">
                          <SelectValue placeholder="Select repository" />
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
                  <div className="mt-4 flex justify-end">
                    <Button>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Alert
                    </Button>
                  </div>
                  <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-lg font-medium">Routing Preview</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Run a test to see which team would receive this alert.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="import">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Import Configuration</CardTitle>
                  <CardDescription>Upload a CSV file to configure team alert routing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                    <FileUp className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Upload CSV File</h3>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Drag and drop your CSV file here, or click to browse.
                    </p>
                    <Button variant="outline" className="mt-4">
                      Browse Files
                    </Button>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium">CSV Format</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your CSV should include the following columns: Team, Rule, Repository, Severity, Status
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Import Configuration</Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Export Configuration</CardTitle>
                  <CardDescription>Export your current team alert routing configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Export Content</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="export-teams"
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="export-teams">Teams</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="export-members"
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="export-members">Team Members</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="export-rules"
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked
                          />
                          <Label htmlFor="export-rules">Routing Rules</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export Configuration
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
