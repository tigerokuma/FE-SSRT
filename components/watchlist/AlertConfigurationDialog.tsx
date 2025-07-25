"use client"

import { useState } from "react"
import { X, AlertTriangle, FileText, Activity, GitBranch, User, Brain, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Package as PackageType } from '../../lib/watchlist/types'

interface AlertConfigurationDialogProps {
  pkg: PackageType
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  onAdd: (config: AlertConfig) => void
  isAdding?: boolean
}

interface AlertConfig {
  repo_url: string
  added_by: string
  notes?: string
  alerts: {
    ai_powered_anomaly_detection: {
      enabled: boolean
    }
    lines_added_deleted: {
      enabled: boolean
      contributor_variance: number
      repository_variance: number
      hardcoded_threshold: number
    }
    files_changed: {
      enabled: boolean
      contributor_variance: number
      repository_variance: number
      hardcoded_threshold: number
    }
    high_churn: {
      enabled: boolean
      multiplier: number
      hardcoded_threshold: number
    }
    ancestry_breaks: {
      enabled: boolean
    }
    unusual_author_activity: {
      enabled: boolean
      percentage_outside_range: number
    }
  }
}

export function AlertConfigurationDialog({ 
  pkg, 
  isOpen, 
  onClose, 
  onBack, 
  onAdd, 
  isAdding 
}: AlertConfigurationDialogProps) {
  const [notes, setNotes] = useState("")
  const [alerts, setAlerts] = useState<AlertConfig['alerts']>({
    ai_powered_anomaly_detection: {
      enabled: true
    },
    lines_added_deleted: {
      enabled: true,
      contributor_variance: 3.0,
      repository_variance: 3.5,
      hardcoded_threshold: 1000
    },
    files_changed: {
      enabled: true,
      contributor_variance: 2.5,
      repository_variance: 3.0,
      hardcoded_threshold: 20
    },
    high_churn: {
      enabled: true,
      multiplier: 3.0,
      hardcoded_threshold: 10
    },
    ancestry_breaks: {
      enabled: true
    },
    unusual_author_activity: {
      enabled: true,
      percentage_outside_range: 80
    }
  })

  const handleAlertToggle = (alertKey: keyof AlertConfig['alerts'], enabled: boolean) => {
    setAlerts(prev => ({
      ...prev,
      [alertKey]: {
        ...prev[alertKey],
        enabled
      }
    }))
  }

  const handleAdd = () => {
    // For NPM packages, we need to construct the GitHub URL properly
    // Most NPM packages follow the pattern: https://github.com/owner/package-name
    let repoUrl = pkg.repo_url
    
    if (!repoUrl && pkg.name) {
      // Try to construct GitHub URL from package name
      // For scoped packages like @types/react, we need to handle differently
      if (pkg.name.startsWith('@')) {
        // For scoped packages, use the package name as-is
        repoUrl = `https://github.com/${pkg.name}`
      } else {
        // For regular packages, assume it's the same as the package name
        repoUrl = `https://github.com/${pkg.name}/${pkg.name}`
      }
    }
    
    const config: AlertConfig = {
      repo_url: repoUrl || `https://github.com/${pkg.name}`,
      added_by: "user-123", // TODO: Get actual user ID
      notes: notes.trim() || undefined,
      alerts
    }
    onAdd(config)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-black border border-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Configure Alerts
              </h2>
              <p className="text-sm text-gray-400">
                Set up monitoring for {pkg.name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Notes Section - Slimmer */}
            <div>
              <Card className="!bg-gray-900 border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    Add notes about this repository
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="e.g., Important repository to monitor for security updates..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] bg-black border-gray-700 text-white placeholder:text-gray-500"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Alert Configuration Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Alert Configuration
              </h3>
              
              <div className="space-y-4">
                {/* AI Anomaly Detection - Moved to top */}
                <Card className="!bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-400" />
                        <CardTitle className="text-base text-white">AI Anomaly Detection</CardTitle>
                      </div>
                      <Switch
                        checked={alerts.ai_powered_anomaly_detection.enabled}
                        onCheckedChange={(enabled) => handleAlertToggle('ai_powered_anomaly_detection', enabled)}
                      />
                    </div>
                    <CardDescription className="text-gray-400">
                      Use AI to detect suspicious commit patterns
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Lines Added/Deleted */}
                <Card className="!bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-400" />
                        <CardTitle className="text-base text-white">Lines Added/Deleted</CardTitle>
                      </div>
                      <Switch
                        checked={alerts.lines_added_deleted.enabled}
                        onCheckedChange={(enabled) => handleAlertToggle('lines_added_deleted', enabled)}
                      />
                    </div>
                    <CardDescription className="text-gray-400">
                      Alert when commits exceed normal line change thresholds
                    </CardDescription>
                  </CardHeader>
                  {alerts.lines_added_deleted.enabled && (
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm text-gray-300">Contributor Variance</Label>
                            <span className="text-sm text-gray-400">{alerts.lines_added_deleted.contributor_variance}</span>
                          </div>
                          <Slider
                            value={[alerts.lines_added_deleted.contributor_variance]}
                            onValueChange={(value) => setAlerts(prev => ({
                              ...prev,
                              lines_added_deleted: {
                                ...prev.lines_added_deleted,
                                contributor_variance: value[0]
                              }
                            }))}
                            max={10}
                            min={1}
                            step={0.1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">Suggested: 3.0</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm text-gray-300">Repository Variance</Label>
                            <span className="text-sm text-gray-400">{alerts.lines_added_deleted.repository_variance}</span>
                          </div>
                          <Slider
                            value={[alerts.lines_added_deleted.repository_variance]}
                            onValueChange={(value) => setAlerts(prev => ({
                              ...prev,
                              lines_added_deleted: {
                                ...prev.lines_added_deleted,
                                repository_variance: value[0]
                              }
                            }))}
                            max={10}
                            min={1}
                            step={0.1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">Suggested: 3.5</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Hard Threshold</Label>
                          <Input
                            type="number"
                            value={alerts.lines_added_deleted.hardcoded_threshold}
                            onChange={(e) => setAlerts(prev => ({
                              ...prev,
                              lines_added_deleted: {
                                ...prev.lines_added_deleted,
                                hardcoded_threshold: parseInt(e.target.value) || 1000
                              }
                            }))}
                            className="h-8 text-sm bg-black border-gray-700 text-white mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Files Changed */}
                <Card className="!bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-cyan-400" />
                        <CardTitle className="text-base text-white">Files Changed</CardTitle>
                      </div>
                      <Switch
                        checked={alerts.files_changed.enabled}
                        onCheckedChange={(enabled) => handleAlertToggle('files_changed', enabled)}
                      />
                    </div>
                    <CardDescription className="text-gray-400">
                      Alert when commits modify many files
                    </CardDescription>
                  </CardHeader>
                  {alerts.files_changed.enabled && (
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm text-gray-300">Contributor Variance</Label>
                            <span className="text-sm text-gray-400">{alerts.files_changed.contributor_variance}</span>
                          </div>
                          <Slider
                            value={[alerts.files_changed.contributor_variance]}
                            onValueChange={(value) => setAlerts(prev => ({
                              ...prev,
                              files_changed: {
                                ...prev.files_changed,
                                contributor_variance: value[0]
                              }
                            }))}
                            max={10}
                            min={1}
                            step={0.1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">Suggested: 2.5</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm text-gray-300">Repository Variance</Label>
                            <span className="text-sm text-gray-400">{alerts.files_changed.repository_variance}</span>
                          </div>
                          <Slider
                            value={[alerts.files_changed.repository_variance]}
                            onValueChange={(value) => setAlerts(prev => ({
                              ...prev,
                              files_changed: {
                                ...prev.files_changed,
                                repository_variance: value[0]
                              }
                            }))}
                            max={10}
                            min={1}
                            step={0.1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">Suggested: 3.0</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Hard Threshold</Label>
                          <Input
                            type="number"
                            value={alerts.files_changed.hardcoded_threshold}
                            onChange={(e) => setAlerts(prev => ({
                              ...prev,
                              files_changed: {
                                ...prev.files_changed,
                                hardcoded_threshold: parseInt(e.target.value) || 20
                              }
                            }))}
                            className="h-8 text-sm bg-black border-gray-700 text-white mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* High Churn */}
                <Card className="!bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                        <CardTitle className="text-base text-white">High Churn</CardTitle>
                      </div>
                      <Switch
                        checked={alerts.high_churn.enabled}
                        onCheckedChange={(enabled) => handleAlertToggle('high_churn', enabled)}
                      />
                    </div>
                    <CardDescription className="text-gray-400">
                      Alert on high lines-to-files ratio commits
                    </CardDescription>
                  </CardHeader>
                  {alerts.high_churn.enabled && (
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm text-gray-300">Multiplier</Label>
                            <span className="text-sm text-gray-400">{alerts.high_churn.multiplier}</span>
                          </div>
                          <Slider
                            value={[alerts.high_churn.multiplier]}
                            onValueChange={(value) => setAlerts(prev => ({
                              ...prev,
                              high_churn: {
                                ...prev.high_churn,
                                multiplier: value[0]
                              }
                            }))}
                            max={10}
                            min={1}
                            step={0.1}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">Suggested: 3.0</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Hard Threshold</Label>
                          <Input
                            type="number"
                            value={alerts.high_churn.hardcoded_threshold}
                            onChange={(e) => setAlerts(prev => ({
                              ...prev,
                              high_churn: {
                                ...prev.high_churn,
                                hardcoded_threshold: parseInt(e.target.value) || 10
                              }
                            }))}
                            className="h-8 text-sm bg-black border-gray-700 text-white mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Ancestry Breaks */}
                <Card className="!bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-purple-400" />
                        <CardTitle className="text-base text-white">Ancestry Breaks</CardTitle>
                      </div>
                      <Switch
                        checked={alerts.ancestry_breaks.enabled}
                        onCheckedChange={(enabled) => handleAlertToggle('ancestry_breaks', enabled)}
                      />
                    </div>
                    <CardDescription className="text-gray-400">
                      Alert on git history rewrites
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Unusual Author Activity - Re-added */}
                <Card className="!bg-gray-900 border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-orange-400" />
                        <CardTitle className="text-base text-white">Unusual Author Activity</CardTitle>
                      </div>
                      <Switch
                        checked={alerts.unusual_author_activity.enabled}
                        onCheckedChange={(enabled) => handleAlertToggle('unusual_author_activity', enabled)}
                      />
                    </div>
                    <CardDescription className="text-gray-400">
                      Alert when authors commit outside normal hours
                    </CardDescription>
                  </CardHeader>
                  {alerts.unusual_author_activity.enabled && (
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm text-gray-300">Percentage Outside Range</Label>
                          <span className="text-sm text-gray-400">{alerts.unusual_author_activity.percentage_outside_range}%</span>
                        </div>
                        <Slider
                          value={[alerts.unusual_author_activity.percentage_outside_range]}
                          onValueChange={(value) => setAlerts(prev => ({
                            ...prev,
                            unusual_author_activity: {
                              ...prev.unusual_author_activity,
                              percentage_outside_range: value[0]
                            }
                          }))}
                          max={100}
                          min={10}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">Suggested: 80%</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isAdding}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Back
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isAdding}
            className="min-w-[100px] bg-white text-black hover:bg-gray-100"
          >
            {isAdding ? "Adding..." : "Add to Watchlist"}
          </Button>
        </div>
      </div>
    </div>
  )
} 