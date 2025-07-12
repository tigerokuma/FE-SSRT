"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { MainContent } from "@/components/main-content"

// Import from the modularized watchlist
import type { 
  Package as PackageType, 
  WatchlistItem as DependencyData,
} from '@/lib/watchlist'
import { 
  useWatchlist,
  WatchlistSearchDialog,
  WatchlistTabs,
  WatchlistPreviewPanel,
  WatchlistStats
} from '@/lib/watchlist'

export default function DependenciesPage() {
  // Use the modularized watchlist hook
  const { items: dependencies } = useWatchlist()
  
  // Local state for UI interactions
  const [isAddDependencyOpen, setIsAddDependencyOpen] = useState(false)
  const [previewPanel, setPreviewPanel] = useState<{
    isOpen: boolean
    package: PackageType | null
    type: 'npm' | 'github'
  }>({
    isOpen: false,
    package: null,
    type: 'npm',
  })

  const handleAddDependency = () => {
    setIsAddDependencyOpen(true)
  }

  const handlePackagePreview = (pkg: PackageType, type: 'npm' | 'github') => {
    // Only show preview on desktop (screen width > 1024px)
    if (window.innerWidth > 1024) {
      setPreviewPanel({
        isOpen: true,
        package: pkg,
        type,
      })
    } else {
      // On mobile, open in new tab
      const url = type === 'npm' ? pkg.npm_url : pkg.repo_url
      if (url) window.open(url, '_blank')
    }
  }

  const closePreviewPanel = () => {
    setPreviewPanel({
      isOpen: false,
      package: null,
      type: 'npm',
    })
  }

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
            onPackagePreview={handlePackagePreview}
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
          onAddDependency={handleAddDependency}
          defaultTab="all"
        />

        {/* Preview Panel - Desktop Only */}
        <WatchlistPreviewPanel
          isOpen={previewPanel.isOpen}
          package={previewPanel.package}
          type={previewPanel.type}
          onClose={closePreviewPanel}
        />
      </MainContent>
    </div>
  )
}
