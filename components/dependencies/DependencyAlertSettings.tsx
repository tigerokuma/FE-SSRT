"use client"

import { useState } from "react"
import { Brain, Activity, FileText, User, Shield, TrendingDown, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DependencyAlertSettingsProps {
  onClose: () => void
  onSave: (settings: any) => void
}

export function DependencyAlertSettings({ onClose, onSave }: DependencyAlertSettingsProps) {
  const [alerts, setAlerts] = useState({
    suspicious_commit_behavior: {
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
    suspicious_author_timestamps: {
      enabled: true
    },
    vulnerability_detected: {
      enabled: true
    },
    health_score_drop: {
      enabled: true,
      minimum_health_change: 1.0
    },
    package_score_drop: {
      enabled: true,
      minimum_score_change: 5.0
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
      await onSave(alerts)
      onClose()
    } catch (error) {
      console.error('Error saving alert settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Dependency Alert Settings</h3>
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
          {/* Suspicious Commit Behavior */}
          <Card className="!bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-400" />
                  <CardTitle className="text-base text-white">Suspicious Commit Behavior</CardTitle>
                </div>
                <Switch
                  checked={alerts.suspicious_commit_behavior.enabled}
                  onCheckedChange={(enabled) => handleAlertToggle('suspicious_commit_behavior', enabled)}
                />
              </div>
              <CardDescription className="text-gray-400">
                Detect unusual commit patterns and behaviors
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

          {/* Vulnerability Detected */}
          <Card className="!bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  <CardTitle className="text-base text-white">Vulnerability Detected</CardTitle>
                </div>
                <Switch
                  checked={alerts.vulnerability_detected.enabled}
                  onCheckedChange={(enabled) => handleAlertToggle('vulnerability_detected', enabled)}
                />
              </div>
              <CardDescription className="text-gray-400">
                Alert when new security vulnerabilities are discovered
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Health Score Drop */}
          <Card className="!bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-yellow-400" />
                  <CardTitle className="text-base text-white">Health Score Drop</CardTitle>
                </div>
                <Switch
                  checked={alerts.health_score_drop.enabled}
                  onCheckedChange={(enabled) => handleAlertToggle('health_score_drop', enabled)}
                />
              </div>
              <CardDescription className="text-gray-400">
                Alert when package health score decreases significantly
              </CardDescription>
            </CardHeader>
            {alerts.health_score_drop.enabled && (
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-gray-300">Minimum Health Change</Label>
                    <span className="text-sm text-gray-400">{alerts.health_score_drop.minimum_health_change} points</span>
                  </div>
                  <Slider
                    value={[alerts.health_score_drop.minimum_health_change]}
                    onValueChange={(value) => setAlerts((prev: typeof alerts) => ({
                      ...prev,
                      health_score_drop: {
                        ...prev.health_score_drop,
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

          {/* Package Score Drop */}
          <Card className="!bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-yellow-400" />
                  <CardTitle className="text-base text-white">Package Score Drop</CardTitle>
                </div>
                <Switch
                  checked={alerts.package_score_drop.enabled}
                  onCheckedChange={(enabled) => handleAlertToggle('package_score_drop', enabled)}
                />
              </div>
              <CardDescription className="text-gray-400">
                Alert when overall package score decreases significantly
              </CardDescription>
            </CardHeader>
            {alerts.package_score_drop.enabled && (
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-gray-300">Minimum Score Change</Label>
                    <span className="text-sm text-gray-400">{alerts.package_score_drop.minimum_score_change} points</span>
                  </div>
                  <Slider
                    value={[alerts.package_score_drop.minimum_score_change]}
                    onValueChange={(value) => setAlerts((prev: typeof alerts) => ({
                      ...prev,
                      package_score_drop: {
                        ...prev.package_score_drop,
                        minimum_score_change: value[0]
                      }
                    }))}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when package score decreases by this amount or more (1 to 20 points)</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </ScrollArea>

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
