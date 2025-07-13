"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { MainContent } from "@/components/main-content"

// Import from the modularized watchlist
import type { 
  WatchlistItem as DependencyData,
} from '@/lib/watchlist'
import { 
  useWatchlist,
  WatchlistSearchDialog,
  WatchlistTabs,
  WatchlistStats
} from '@/lib/watchlist'

export default function DependenciesPage() {
  // Use the modularized watchlist hook
  const { items: dependencies } = useWatchlist()

  const handleItemAction = (item: DependencyData, action: 'view' | 'edit' | 'delete') => {
    // TODO: Implement item actions when needed
    console.log(`Action ${action} on item ${item.name}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
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
      
      <MainContent>
        {/* Optional: Add stats overview */}
        {dependencies.length > 0 && (
          <WatchlistStats items={dependencies} className="mb-6" />
        )}

        {/* Main watchlist interface */}
        <WatchlistTabs
          items={dependencies}
          onItemAction={handleItemAction}
          onAddDependency={() => {}}
          defaultTab="all"
        />
      </MainContent>
    </div>
  )
}
