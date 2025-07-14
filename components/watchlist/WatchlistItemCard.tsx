import { Star, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WatchlistItem } from '../../lib/watchlist/types'
import { WatchlistBadges } from './WatchlistBadges'

interface WatchlistItemCardProps {
  item: WatchlistItem
  onAction?: (item: WatchlistItem, action: 'view' | 'edit' | 'delete') => void
  className?: string
}

export function WatchlistItemCard({ item, onAction, className }: WatchlistItemCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold truncate">{item.name}</h3>
              <Badge variant="outline">{item.version}</Badge>
              {item.type !== 'production' && (
                <Badge variant="secondary" className="text-xs">
                  {item.type}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{item.stars} stars</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{item.maintainers} maintainers</span>
              </div>
              <span>Updated {item.lastUpdate}</span>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <WatchlistBadges item={item} />
          </div>
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