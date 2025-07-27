"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Check, Filter, Plus, X, RefreshCw } from "lucide-react"

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
import { FullWidthPage, FullWidthContainer } from "@/components/full-width-container"
import { useAlerts } from "@/lib/alerts"
import { fetchWatchlistItems } from "@/lib/watchlist/api"

interface AlertDisplay {
  id: string
  rule: string
  repository: string
  team?: string
  severity: string
  status: "open" | "resolved"
  created: string
  description: string
  commitSha: string
  contributor: string
  metric: string
  value: number
  thresholdValue: number
}

export default function AlertsPage() {
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false)
  const [selectedUserWatchlistId, setSelectedUserWatchlistId] = useState<string | undefined>()
  const [watchlistItems, setWatchlistItems] = useState<any[]>([])

  // Get alerts for the selected user watchlist
  const { alerts, loading, error, refetch } = useAlerts({
    userWatchlistId: selectedUserWatchlistId,
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  // Load watchlist items to get user watchlist IDs
  useEffect(() => {
    const loadWatchlistItems = async () => {
      try {
        const items = await fetchWatchlistItems()
        setWatchlistItems(items)
        // Select the first item by default if available
        if (items.length > 0 && !selectedUserWatchlistId) {
          setSelectedUserWatchlistId(items[0].id)
        }
      } catch (error) {
        console.error('Error loading watchlist items:', error)
      }
    }

    loadWatchlistItems()
  }, [])

  // Transform backend alerts to frontend format
  const transformAlerts = (backendAlerts: any[]): AlertDisplay[] => {
    return backendAlerts.map(alert => {
      const status = alert.resolved_at ? "resolved" : "open"
      const createdDate = new Date(alert.created_at)
      const timeAgo = getTimeAgo(createdDate)
      
      return {
        id: alert.id,
        rule: `${alert.metric.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Alert`,
        repository: alert.watchlist?.package?.repo_name || 'Unknown Repository',
        severity: alert.alert_level || 'moderate',
        status,
        created: timeAgo,
        description: alert.description,
        commitSha: alert.commit_sha,
        contributor: alert.contributor,
        metric: alert.metric,
        value: alert.value,
        thresholdValue: alert.threshold_value,
      }
    })
  }

  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
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

  const transformedAlerts = transformAlerts(alerts)
  const openAlerts = transformedAlerts.filter(alert => alert.status === "open")
  const resolvedAlerts = transformedAlerts.filter(alert => alert.status === "resolved")

  return (
    <FullWidthPage>
      <PageHeader title="Alert Center" description="Monitor and manage security and activity alerts">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedUserWatchlistId} onValueChange={setSelectedUserWatchlistId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              {watchlistItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              if (!selectedUserWatchlistId) {
                alert('Please select a repository first');
                return;
              }
              try {
                const response = await fetch('/api/backend/activity/alerts/test/create-sample', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userWatchlistId: selectedUserWatchlistId }),
                });
                const result = await response.json();
                alert(`Created ${result.alerts?.length || 0} sample alerts`);
                refetch(); // Refresh the alerts
              } catch (error) {
                alert('Error creating sample alerts: ' + (error instanceof Error ? error.message : 'Unknown error'));
              }
            }}
          >
            Create Sample Alerts
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

      <FullWidthContainer>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Error loading alerts: {error}</p>
          </div>
        )}

        {!selectedUserWatchlistId && (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Repository Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Please select a repository from the dropdown to view its alerts.
            </p>
          </div>
        )}

        {selectedUserWatchlistId && (
          <Tabs defaultValue="all">
            <div className="flex flex-col gap-4 mb-4">
              <h2 className="text-xl font-bold tracking-tight">Active Alerts</h2>
              <TabsList className="grid grid-cols-3 max-w-md">
                <TabsTrigger value="all">All ({transformedAlerts.length})</TabsTrigger>
                <TabsTrigger value="open">Open ({openAlerts.length})</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({resolvedAlerts.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading alerts...</span>
                </div>
              ) : transformedAlerts.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center rounded-lg border bg-card p-8">
                  <Check className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Alerts Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    No alerts have been triggered for this repository yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {transformedAlerts.map((alert) => (
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
                        <span className="text-sm text-muted-foreground">{alert.created}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {alert.contributor}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>Metric: {alert.metric}</p>
                        <p>Value: {alert.value} (threshold: {alert.thresholdValue})</p>
                        <p>Commit: {alert.commitSha.substring(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="open" className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading alerts...</span>
                </div>
              ) : openAlerts.length === 0 ? (
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
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {openAlerts.map((alert) => (
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
                        <span className="text-sm text-muted-foreground">{alert.created}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {alert.contributor}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>Metric: {alert.metric}</p>
                        <p>Value: {alert.value} (threshold: {alert.thresholdValue})</p>
                        <p>Commit: {alert.commitSha.substring(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading alerts...</span>
                </div>
              ) : resolvedAlerts.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center rounded-lg border bg-card p-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Resolved Alerts</h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    There are no resolved alerts yet. Alerts will appear here once they are addressed.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {resolvedAlerts.map((alert) => (
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
                        <span className="text-sm text-muted-foreground">{alert.created}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {alert.contributor}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <p>Metric: {alert.metric}</p>
                        <p>Value: {alert.value} (threshold: {alert.thresholdValue})</p>
                        <p>Commit: {alert.commitSha.substring(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </FullWidthContainer>
    </FullWidthPage>
  )
}
