"use client"

import { useState } from "react"
import { Calendar, Download, FileDown, GitBranch, GitCommit, GitMerge, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MainContent } from "@/components/main-content"

export default function GraphExportPage() {
  const [selectedRepo, setSelectedRepo] = useState("")
  const [commitRange, setCommitRange] = useState("")
  const [exportFormat, setExportFormat] = useState("json")

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Graph Export" description="Export and visualize your repository dependencies">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="sm:w-auto">
            <Calendar className="mr-2 h-4 w-4" />
            History
          </Button>
        </div>
      </PageHeader>

      <MainContent>
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-xl font-bold tracking-tight">Export Configuration</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings</CardTitle>
                <CardDescription>Configure your graph export settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="repo-select">Select Repository</Label>
                    <div className="flex gap-2">
                      <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                        <SelectTrigger id="repo-select">
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lodash">lodash/lodash</SelectItem>
                          <SelectItem value="nextjs">vercel/next.js</SelectItem>
                          <SelectItem value="react">facebook/react</SelectItem>
                          <SelectItem value="tailwind">tailwindlabs/tailwindcss</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commit-range">Commit Range</Label>
                    <Select value={commitRange} onValueChange={setCommitRange}>
                      <SelectTrigger id="commit-range">
                        <SelectValue placeholder="Select commit range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-week">Last Week</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-quarter">Last Quarter</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {commitRange === "custom" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="start-commit">Start Commit</Label>
                        <Input id="start-commit" placeholder="Commit hash or tag" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-commit">End Commit</Label>
                        <Input id="end-commit" placeholder="Commit hash or tag" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <RadioGroup
                      defaultValue="json"
                      value={exportFormat}
                      onValueChange={setExportFormat}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="json" id="json" />
                        <Label htmlFor="json">JSON</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="graphml" id="graphml" />
                        <Label htmlFor="graphml">GraphML</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label htmlFor="csv">CSV</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Graph Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-deps" className="h-4 w-4 rounded border-gray-300" />
                        <Label htmlFor="include-deps">Include Dependencies</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-imports" className="h-4 w-4 rounded border-gray-300" />
                        <Label htmlFor="include-imports">Include Imports</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-functions" className="h-4 w-4 rounded border-gray-300" />
                        <Label htmlFor="include-functions">Include Function Calls</Label>
                      </div>
                    </div>
                  </div>
                  <Button className="sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Export Graph
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Exports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">lodash/lodash</span>
                    </div>
                    <Button variant="ghost" size="icon">
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">vercel/next.js</span>
                    </div>
                    <Button variant="ghost" size="icon">
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">facebook/react</span>
                    </div>
                    <Button variant="ghost" size="icon">
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Graph Preview</CardTitle>
              <CardDescription>
                {selectedRepo ? `Visualizing ${selectedRepo}` : "Select a repository to preview its graph"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] flex items-center justify-center">
              {selectedRepo ? (
                <div className="w-full h-full rounded-lg border border-dashed flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      <GitMerge className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">Graph Visualization</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This is where the graph visualization would appear. <br />
                      Configure your export settings and click "Export Graph" to create a preview.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <GitCommit className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No Repository Selected</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a repository and configure your export settings to generate a graph preview.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset</Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download Graph
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainContent>
    </div>
  )
}
