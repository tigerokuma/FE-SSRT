"use client"

import { useState } from "react"
import { Brain, Activity, FileText, User, Shield, TrendingDown, AlertTriangle, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { colors } from "@/lib/design-system"

interface DependencyAlert {
  id: string
  type: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "resolved"
  createdAt: string
  timeAgo: string
  value?: number
  thresholdValue?: number
  commitSha?: string
  contributor?: string
}

interface DependencyAlertCardProps {
  alert: DependencyAlert
  onResolve: (alertId: string) => void
  onSendToJira: (alertId: string) => void
}

export function DependencyAlertCard({ alert, onResolve, onSendToJira }: DependencyAlertCardProps) {
  const [isResolving, setIsResolving] = useState(false)
  const [isSendingToJira, setIsSendingToJira] = useState(false)

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'suspicious_commit_behavior':
        return <Brain className="h-4 w-4 text-indigo-400" />
      case 'lines_added_deleted':
        return <Activity className="h-4 w-4 text-emerald-400" />
      case 'files_changed':
        return <FileText className="h-4 w-4 text-cyan-400" />
      case 'suspicious_author_timestamps':
        return <User className="h-4 w-4 text-orange-400" />
      case 'vulnerability_detected':
        return <Shield className="h-4 w-4 text-red-400" />
      case 'health_score_drop':
        return <TrendingDown className="h-4 w-4 text-yellow-400" />
      case 'package_score_drop':
        return <TrendingDown className="h-4 w-4 text-yellow-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            Critical
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Low
          </Badge>
        )
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

  const handleResolve = async () => {
    setIsResolving(true)
    try {
      await onResolve(alert.id)
    } finally {
      setIsResolving(false)
    }
  }

  const handleSendToJira = async () => {
    setIsSendingToJira(true)
    try {
      await onSendToJira(alert.id)
    } finally {
      setIsSendingToJira(false)
    }
  }

  return (
    <Card style={{ backgroundColor: colors.background.card }} className="border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getAlertIcon(alert.type)}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base line-clamp-1" style={{ color: colors.text.primary }}>
                {alert.title}
              </CardTitle>
              <CardDescription className="text-sm" style={{ color: colors.text.secondary }}>
                {alert.timeAgo}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {getSeverityBadge(alert.severity)}
            {getStatusBadge(alert.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {alert.description}
        </p>
        
        {(alert.value !== undefined || alert.commitSha || alert.contributor) && (
          <div className="text-xs space-y-1" style={{ color: colors.text.muted }}>
            {alert.value !== undefined && alert.thresholdValue !== undefined && (
              <p>Value: {alert.value} (threshold: {alert.thresholdValue})</p>
            )}
            {alert.commitSha && (
              <p>Commit: {alert.commitSha.substring(0, 8)}</p>
            )}
            {alert.contributor && (
              <p>Contributor: {alert.contributor}</p>
            )}
          </div>
        )}
        
        {alert.status === "open" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResolve}
              disabled={isResolving}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {isResolving ? "Resolving..." : "Resolve"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendToJira}
              disabled={isSendingToJira}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              {isSendingToJira ? "Sending..." : "Send to Jira"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
