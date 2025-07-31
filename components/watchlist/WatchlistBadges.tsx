import { AlertTriangle, Check, Clock, Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { WatchlistItem } from '../../lib/watchlist/types'

interface RiskBadgeProps {
  risk: WatchlistItem['risk']
  className?: string
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  switch (risk) {
    case "high":
      return (
        <Badge variant="outline" className={`border-red-500 text-red-500 ${className}`}>
          <ShieldAlert className="mr-1 h-3 w-3" />
          High Risk
        </Badge>
      )
    case "medium":
      return (
        <Badge variant="outline" className={`border-yellow-500 text-yellow-500 ${className}`}>
          <Shield className="mr-1 h-3 w-3" />
          Medium Risk
        </Badge>
      )
    case "low":
      return (
        <Badge variant="outline" className={`border-green-500 text-green-500 ${className}`}>
          <ShieldCheck className="mr-1 h-3 w-3" />
          Low Risk
        </Badge>
      )
    default:
      return <Badge variant="outline" className={className}>Unknown</Badge>
  }
}

interface ActivityBadgeProps {
  activity: WatchlistItem['activity'] | number | null | undefined
  className?: string
}

export function ActivityBadge({ activity, className }: ActivityBadgeProps) {
  // Handle numeric activity scores (from backend)
  if (typeof activity === 'number') {
    if (activity === 0) {
      return (
        <Badge variant="outline" className={`border-gray-500 text-gray-500 ${className}`}>
          <Clock className="mr-1 h-3 w-3" />
          No Activity
        </Badge>
      )
    }
    if (activity >= 65) {
      return (
        <Badge variant="outline" className={`border-green-500 text-green-500 ${className}`}>
          <Check className="mr-1 h-3 w-3" />
          Very Active
        </Badge>
      )
    }
    if (activity >= 30) {
      return (
        <Badge variant="outline" className={`border-yellow-500 text-yellow-500 ${className}`}>
          <Clock className="mr-1 h-3 w-3" />
          Moderate Activity
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className={`border-red-500 text-red-500 ${className}`}>
        <AlertTriangle className="mr-1 h-3 w-3" />
        Inactive
      </Badge>
    )
  }

  // Handle string-based activity levels (legacy)
  switch (activity) {
    case "high":
      return (
        <Badge variant="outline" className={`border-green-500 text-green-500 ${className}`}>
          <Check className="mr-1 h-3 w-3" />
          High Activity
        </Badge>
      )
    case "medium":
      return (
        <Badge variant="outline" className={`border-yellow-500 text-yellow-500 ${className}`}>
          <Clock className="mr-1 h-3 w-3" />
          Medium Activity
        </Badge>
      )
    case "low":
      return (
        <Badge variant="outline" className={`border-red-500 text-red-500 ${className}`}>
          <AlertTriangle className="mr-1 h-3 w-3" />
          Low Activity
        </Badge>
      )
    default:
      return <Badge variant="outline" className={className}>Unknown</Badge>
  }
}

interface CveBadgeProps {
  cveCount: number
  className?: string
}

export function CveBadge({ cveCount, className }: CveBadgeProps) {
  if (cveCount === 0) return null
  
  return (
    <Badge variant="outline" className={`border-red-500 text-red-500 ${className}`}>
      <AlertTriangle className="mr-1 h-3 w-3" />
      {cveCount} CVE{cveCount !== 1 ? 's' : ''}
    </Badge>
  )
}

interface WatchlistBadgesProps {
  item: WatchlistItem
  className?: string
}

export function WatchlistBadges({ item, className }: WatchlistBadgesProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <RiskBadge risk={item.risk} />
      <ActivityBadge activity={item.activity_score} />
      <CveBadge cveCount={item.cves} />
    </div>
  )
} 