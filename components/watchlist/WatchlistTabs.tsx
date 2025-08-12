
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Shield, AlertTriangle } from "lucide-react"

import type { WatchlistItem } from '../../lib/watchlist/types'
import { filterByType, sortWatchlistItems, hasVulnerabilities, hasActiveVulnerabilities } from '../../lib/watchlist/utils'
import { WatchlistItemGrid } from './WatchlistItemCard'
import { AllDependenciesEmptyState, ProductionEmptyState, DevelopmentEmptyState } from './WatchlistEmptyState'
import { WatchlistSearchDialog } from './WatchlistSearchDialog'

interface WatchlistTabsProps {
  items: WatchlistItem[]
  onItemAction?: (item: WatchlistItem, action: 'view' | 'edit' | 'delete') => void
  onAddDependency?: () => void
  defaultTab?: string
  className?: string
}

type SortOption = 'name' | 'risk' | 'activity' | 'lastUpdate' | 'vulnerabilities'
type SortOrder = 'asc' | 'desc'

export function WatchlistTabs({ 
  items, 
  onItemAction, 
  onAddDependency,
  defaultTab = "all",
  className 
}: WatchlistTabsProps) {
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<'all' | 'secure' | 'vulnerable'>('all')

  // Filter items by type and vulnerability status
  const filterItems = (items: WatchlistItem[]) => {
    let filtered = items
    
    // Apply vulnerability filter - use active vulnerabilities for security assessment
    if (vulnerabilityFilter === 'secure') {
      filtered = filtered.filter(item => !hasActiveVulnerabilities(item.vulnerabilities))
    } else if (vulnerabilityFilter === 'vulnerable') {
      filtered = filtered.filter(item => hasActiveVulnerabilities(item.vulnerabilities))
    }
    
    return sortWatchlistItems(filtered, sortBy, sortOrder)
  }

  const allItems = filterItems(items)
  const productionItems = filterItems(filterByType(items, 'production'))
  const developmentItems = filterItems(filterByType(items, 'development'))

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-') as [SortOption, SortOrder]
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const getSortValue = () => `${sortBy}-${sortOrder}`

  return (
    <Tabs defaultValue={defaultTab} className={`w-full ${className}`}>
      {/* Tab Header with Controls */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="all">All Dependencies</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {/* Vulnerability Filter */}
            <Select value={vulnerabilityFilter} onValueChange={(value) => setVulnerabilityFilter(value as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by security" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All packages</SelectItem>
                <SelectItem value="secure">Secure only</SelectItem>
                <SelectItem value="vulnerable">With vulnerabilities</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={getSortValue()} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="risk-asc">Risk Low-High</SelectItem>
                <SelectItem value="risk-desc">Risk High-Low</SelectItem>
                <SelectItem value="activity-asc">Activity Low-High</SelectItem>
                <SelectItem value="activity-desc">Activity High-Low</SelectItem>
                <SelectItem value="vulnerabilities-desc">Most Vulnerable</SelectItem>
                <SelectItem value="vulnerabilities-asc">Least Vulnerable</SelectItem>
                <SelectItem value="lastUpdate-desc">Recently Updated</SelectItem>
                <SelectItem value="lastUpdate-asc">Oldest Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      <TabsContent value="all" className="space-y-4">
        <WatchlistItemGrid
          items={allItems}
          onItemAction={onItemAction}
          emptyState={
            items.length === 0 ? (
              <AllDependenciesEmptyState 
                onAddDependency={onAddDependency}
                addDependencyButton={
                  <WatchlistSearchDialog
                    trigger={
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Dependency
                      </Button>
                    }
                    defaultType="production"
                  />
                }
              />
            ) : null
          }
        />
      </TabsContent>

      <TabsContent value="production" className="space-y-4">
        <WatchlistItemGrid
          items={productionItems}
          onItemAction={onItemAction}
          emptyState={
            <ProductionEmptyState 
              onAddDependency={onAddDependency}
              addDependencyButton={
                <WatchlistSearchDialog
                  trigger={
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Production Dependency
                    </Button>
                  }
                  defaultType="production"
                />
              }
            />
          }
        />
      </TabsContent>

      <TabsContent value="development" className="space-y-4">
        <WatchlistItemGrid
          items={developmentItems}
          onItemAction={onItemAction}
          emptyState={
            <DevelopmentEmptyState 
              onAddDependency={onAddDependency}
              addDependencyButton={
                <WatchlistSearchDialog
                  trigger={
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Development Dependency
                    </Button>
                  }
                  defaultType="development"
                />
              }
            />
          }
        />
      </TabsContent>
    </Tabs>
  )
}

interface WatchlistStatsProps {
  items: WatchlistItem[]
  className?: string
}

export function WatchlistStats({ items, className }: WatchlistStatsProps) {
  const totalItems = items.length
  const productionItems = filterByType(items, 'production').length
  const developmentItems = filterByType(items, 'development').length
  const highRiskItems = items.filter(item => item.risk === 'high').length

  const lowActivityItems = items.filter(item => (item.activity_score || 0) < 30).length
  const vulnerableItems = items.filter(item => hasActiveVulnerabilities(item.vulnerabilities)).length

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-6 gap-4 ${className}`}>
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold">{totalItems}</div>
        <div className="text-sm text-muted-foreground">Total</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold">{productionItems}</div>
        <div className="text-sm text-muted-foreground">Production</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold">{developmentItems}</div>
        <div className="text-sm text-muted-foreground">Development</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-red-600">{highRiskItems}</div>
        <div className="text-sm text-muted-foreground">High Risk</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-orange-600">{lowActivityItems}</div>
        <div className="text-sm text-muted-foreground">Low Activity</div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-red-600">{vulnerableItems}</div>
        <div className="text-sm text-muted-foreground">Vulnerable</div>
      </div>
    </div>
  )
} 