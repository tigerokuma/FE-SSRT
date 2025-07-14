"use client"

import { useState } from "react"
import { Plus, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { FullWidthPage, FullWidthContainer, FullWidthGrid } from "@/components/full-width-container"

// Import from the modularized watchlist
import type { 
  WatchlistItem as DependencyData,
} from '@/lib/watchlist'
import { 
  useWatchlist,
  WatchlistSearchDialog
} from '@/lib/watchlist'

export default function DependenciesPage() {
  // Use the modularized watchlist hook
  const { items: dependencies } = useWatchlist()

  const handleItemAction = (item: DependencyData, action: 'view' | 'edit' | 'delete') => {
    // TODO: Implement item actions when needed
    console.log(`Action ${action} on item ${item.name}`)
  }

  return (
    <FullWidthPage>
      <PageHeader 
        title="Dependency Watchlist" 
        description="Monitor and manage your project dependencies"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <WatchlistSearchDialog
            trigger={
              <Button size="sm" className="sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Dependency
              </Button>
            }
            defaultType="production"
          />
        </div>
      </PageHeader>
      
      <FullWidthContainer>
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="text-xl font-bold tracking-tight">Dependency Watchlist</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All Dependencies</Button>
              <Button variant="ghost" size="sm">Production</Button>
              <Button variant="ghost" size="sm">Development</Button>
            </div>
            
            <WatchlistSearchDialog
              trigger={
                <Button size="sm" className="sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Dependency
                </Button>
              }
              defaultType="production"
            />
          </div>
        </div>

        {/* Content Grid - Full Width */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {dependencies.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border bg-card p-8">
              <Package className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No dependencies in watchlist</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Start monitoring your project dependencies by adding them to your watchlist.
              </p>
              <div className="mt-4">
                <WatchlistSearchDialog
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Dependency
                    </Button>
                  }
                  defaultType="production"
                />
              </div>
            </div>
          ) : (
            dependencies.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium line-clamp-1 min-w-0">{item.name}</span>
                    <Badge variant="outline">{item.version}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground line-clamp-1">{item.type}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={item.risk === 'high' ? 'bg-red-500' : item.risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}>
                    {item.risk} risk
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.lastUpdate}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.stars} stars • {item.maintainers} maintainers
                </p>
              </div>
            ))
          )}
        </div>
      </FullWidthContainer>
    </FullWidthPage>
  )
}
