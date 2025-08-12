"use client"

import { useState, useEffect } from "react"
import { Brain, Activity, FileText, User, Shield, TrendingDown, Save, X, MessageSquare, Mail, MessageCircle, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateUserWatchlistAlerts } from "../../lib/watchlist/api"

interface AlertSettingsProps {
  userWatchlistId: string
  currentAlerts: any
  onClose: () => void
  onSave: () => void
}

export function AlertSettings({ 
  userWatchlistId, 
  currentAlerts, 
  onClose, 
  onSave 
}: AlertSettingsProps) {
  const [alerts, setAlerts] = useState(currentAlerts || {
    ai_powered_anomaly_detection: {
      enabled: false
    },
    lines_added_deleted: {
      enabled: false,
      contributor_variance: 3.0,
      repository_variance: 3.5,
      hardcoded_threshold: 1000
    },
    files_changed: {
      enabled: false,
      contributor_variance: 2.5,
      repository_variance: 3.0,
      hardcoded_threshold: 20
    },
    suspicious_author_timestamps: {
      enabled: false
    },
    new_vulnerabilities_detected: {
      enabled: false
    },
    health_score_decreases: {
      enabled: false,
      minimum_health_change: 1.0
    }
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleAlertToggle = (alertKey: keyof typeof alerts, enabled: boolean) => {
    setAlerts((prev: typeof alerts) => ({
      ...prev,
      [alertKey]: {
        ...prev[alertKey],
        enabled
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUserWatchlistAlerts(userWatchlistId, alerts)
      onSave()
    } catch (error) {
      console.error('Error saving alert settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Alert Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {/* AI Anomaly Detection */}
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
                      onValueChange={(value) => setAlerts((prev: typeof alerts) => ({
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
                                          </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-gray-300">Repository Variance</Label>
                        <span className="text-sm text-gray-400">{alerts.lines_added_deleted.repository_variance}</span>
                      </div>
                      <Slider
                        value={[alerts.lines_added_deleted.repository_variance]}
                        onValueChange={(value) => setAlerts((prev: typeof alerts) => ({
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
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Hard Threshold</Label>
                    <Input
                      type="number"
                      value={alerts.lines_added_deleted.hardcoded_threshold}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : parseInt(value, 10);
                        if (!isNaN(numValue)) {
                          setAlerts((prev: typeof alerts) => ({
                            ...prev,
                            lines_added_deleted: {
                              ...prev.lines_added_deleted,
                              hardcoded_threshold: numValue
                            }
                          }));
                        }
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
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
                      onValueChange={(value) => setAlerts((prev: typeof alerts) => ({
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
                    
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-gray-300">Repository Variance</Label>
                      <span className="text-sm text-gray-400">{alerts.files_changed.repository_variance}</span>
                    </div>
                    <Slider
                      value={[alerts.files_changed.repository_variance]}
                      onValueChange={(value) => setAlerts((prev: typeof alerts) => ({
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
                    
                  </div>
                  <div>
                    <Label className="text-sm text-gray-300">Hard Threshold</Label>
                    <Input
                      type="number"
                      value={alerts.files_changed.hardcoded_threshold}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === '' ? 0 : parseInt(value, 10);
                        if (!isNaN(numValue)) {
                          setAlerts((prev: typeof alerts) => ({
                            ...prev,
                            files_changed: {
                              ...prev.files_changed,
                              hardcoded_threshold: numValue
                            }
                          }));
                        }
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="h-8 text-sm bg-black border-gray-700 text-white mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Suspicious Author Timestamps */}
          <Card className="!bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-400" />
                  <CardTitle className="text-base text-white">Suspicious Author Timestamps</CardTitle>
                </div>
                <Switch
                  checked={alerts.suspicious_author_timestamps.enabled}
                  onCheckedChange={(enabled) => handleAlertToggle('suspicious_author_timestamps', enabled)}
                />
              </div>
              <CardDescription className="text-gray-400">
                Alert when authors commit outside their normal hours
              </CardDescription>
            </CardHeader>
          </Card>

          {/* New Vulnerabilities Detected */}
          <Card className="!bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  <CardTitle className="text-base text-white">New Vulnerabilities Detected</CardTitle>
                </div>
                <Switch
                  checked={alerts.new_vulnerabilities_detected.enabled}
                  onCheckedChange={(enabled) => handleAlertToggle('new_vulnerabilities_detected', enabled)}
                />
              </div>
              <CardDescription className="text-gray-400">
                Alert when new security vulnerabilities are discovered
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Health Score Decreases */}
          <Card className="!bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-yellow-400" />
                  <CardTitle className="text-base text-white">Health Score Decreases</CardTitle>
                </div>
                <Switch
                  checked={alerts.health_score_decreases.enabled}
                  onCheckedChange={(enabled) => handleAlertToggle('health_score_decreases', enabled)}
                />
              </div>
              <CardDescription className="text-gray-400">
                Alert when repository health score decreases significantly
              </CardDescription>
            </CardHeader>
            {alerts.health_score_decreases.enabled && (
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-gray-300">Minimum Health Change</Label>
                    <span className="text-sm text-gray-400">{alerts.health_score_decreases.minimum_health_change} points</span>
                  </div>
                  <Slider
                    value={[alerts.health_score_decreases.minimum_health_change]}
                    onValueChange={(value) => setAlerts((prev: typeof alerts) => ({
                      ...prev,
                      health_score_decreases: {
                        ...prev.health_score_decreases,
                        minimum_health_change: value[0]
                      }
                    }))}
                    max={5}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when health score decreases by this amount or more (0.5 to 5.0 points)</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </ScrollArea>

      {/* Integrations Section */}
      <div className="space-y-4">
        <Separator className="my-6" />
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Alert Integrations</h4>
          <p className="text-sm text-gray-400">
            Configure where alerts should be sent when triggered. These integrations will be implemented in future updates.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discord Integration */}
            <Card className="!bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-400" />
                    <CardTitle className="text-base text-white">Discord</CardTitle>
                  </div>
                  <Switch disabled />
                </div>
                <CardDescription className="text-gray-400">
                  Send alerts to Discord channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Webhook URL</Label>
                  <Input
                    placeholder="https://discord.com/api/webhooks/..."
                    disabled
                    className="h-8 text-sm bg-black border-gray-700 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </CardContent>
            </Card>

            {/* Slack Integration */}
            <Card className="!bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-400" />
                    <CardTitle className="text-base text-white">Slack</CardTitle>
                  </div>
                  <Switch disabled />
                </div>
                <CardDescription className="text-gray-400">
                  Send alerts to Slack channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Webhook URL</Label>
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    disabled
                    className="h-8 text-sm bg-black border-gray-700 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </CardContent>
            </Card>

            {/* Email Integration */}
            <Card className="!bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-400" />
                    <CardTitle className="text-base text-white">Email</CardTitle>
                  </div>
                  <Switch disabled />
                </div>
                <CardDescription className="text-gray-400">
                  Send alerts via email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Email Address</Label>
                  <Input
                    placeholder="alerts@yourcompany.com"
                    disabled
                    className="h-8 text-sm bg-black border-gray-700 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </CardContent>
            </Card>

            {/* Jira Integration */}
            <Card className="!bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base text-white">Jira</CardTitle>
                  </div>
                  <Switch disabled />
                </div>
                <CardDescription className="text-gray-400">
                  Create Jira tickets for alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Jira URL</Label>
                  <Input
                    placeholder="https://yourcompany.atlassian.net"
                    disabled
                    className="h-8 text-sm bg-black border-gray-700 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">Coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-white text-black hover:bg-gray-100"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
} 