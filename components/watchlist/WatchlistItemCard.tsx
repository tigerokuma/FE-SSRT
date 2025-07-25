import { Star, Download, ExternalLink, Bell, Activity, Users2, TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WatchlistItem } from '../../lib/watchlist/types'
import { WatchlistBadges } from './WatchlistBadges'
import { Button } from "@/components/ui/button"

interface WatchlistItemCardProps {
  item: WatchlistItem
  onAction?: (item: WatchlistItem, action: 'view' | 'edit' | 'delete') => void
  className?: string
}

export function WatchlistItemCard({ item, onAction, className }: WatchlistItemCardProps) {
  // Use real data from backend instead of mock data
  const isProcessing = item.status === 'processing'
  const activityScore = item.activity_score || 0
  const busFactor = item.bus_factor || 0
  const healthScore = item.health_score || 0
  const notificationCount = item.notification_count || 0
  const trackingDuration = item.tracking_duration || '0 days'
  const version = item.version || 'latest'

  // Determine health trend based on health score (simplified logic)
  const healthTrend = healthScore >= 80 ? 'improving' : healthScore >= 60 ? 'stable' : 'declining'

  return (
    <Card className={`
      bg-gray-900/50 border-gray-800 backdrop-blur-sm rounded-lg border p-4 space-y-3 group hover:border-gray-700 transition-colors
      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0
      active:scale-[0.99] active:shadow-sm
      cursor-pointer
      ${className}
    `}>
      <CardContent className="p-0">
        {/* Package Name and Version */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="font-medium line-clamp-1 min-w-0 text-white group-hover:text-gray-100 transition-colors">
            {item.name.split('/').pop() || item.name}
          </span>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {isProcessing ? (
            <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">
              🔄 Processing...
            </Badge>
          ) : (
            <>
              <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                <Activity className="mr-1 h-3 w-3" />
                Activity: {activityScore}
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">
                <Users2 className="mr-1 h-3 w-3" />
                Bus Factor: {busFactor}
              </Badge>
              <Badge variant="outline" className="border-purple-500 text-purple-500 text-xs">
                {healthTrend === 'improving' ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : healthTrend === 'declining' ? (
                  <TrendingDown className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingUp className="mr-1 h-3 w-3" />
                )}
                Health: {healthTrend}
              </Badge>
            </>
          )}
        </div>

        {/* Notification Counter */}
        {notificationCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-500 font-medium">
              {notificationCount} new alerts
            </span>
          </div>
        )}

        {/* Stats Icons */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>{item.stars || '0'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{item.downloads || '0'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users2 className="h-4 w-4" />
            <span>{item.contributors || '0'}</span>
          </div>
          <div className="flex items-center gap-1">
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>
        
        {/* Tracking Duration */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Tracking for {trackingDuration}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white h-6 px-2 text-xs"
            onClick={() => onAction?.(item, 'view')}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface WatchlistItemGridProps {
  items: WatchlistItem[]
  onItemAction?: (item: WatchlistItem, action: 'view' | 'edit' | 'delete') => void
  emptyState?: React.ReactNode
  className?: string
}

export function WatchlistItemGrid({ 
  items, 
  onItemAction, 
  emptyState,
  className 
}: WatchlistItemGridProps) {
  if (items.length === 0 && emptyState) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        <div className="col-span-full">
          {emptyState}
        </div>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 ${className}`}>
      {items.map((item) => (
        <WatchlistItemCard
          key={item.id}
          item={item}
          onAction={onItemAction}
        />
      ))}
    </div>
  )
} 