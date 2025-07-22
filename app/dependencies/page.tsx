"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Package, Search, TrendingUp, Shield, Clock, Download, Star, Users, Loader2 } from "lucide-react"

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

// Extended type for display - now handles partial data
interface DisplayDependency {
  id: number
  name: string
  version: string
  type: string
  risk: string
  stars: string | number | null
  maintainers: number
  lastUpdate: string
  downloads?: string | null
  description?: string | null
  // New fields to indicate data completeness
  isGitHubDataLoaded?: boolean
  forks?: number | null
  contributors?: number | null
}

export default function DependenciesPage() {
  const router = useRouter()
  // Use the modularized watchlist hook
  const { items: userDependencies, isLoading } = useWatchlist()
  
  // Transform user dependencies to display format
  const allDependencies: DisplayDependency[] = userDependencies.map(item => ({
    id: item.id,
    name: item.name,
    version: item.version,
    type: item.type,
    risk: item.risk,
    stars: item.stars,
    maintainers: item.maintainers,
    lastUpdate: item.lastUpdate,
    downloads: null, // Not available from backend yet
    description: `${item.type} dependency`,
    isGitHubDataLoaded: !!item.stars && item.stars !== '0', // Assume loaded if we have stars
    forks: null, // Not available from backend yet
    contributors: item.maintainers
  }))

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20" variant="outline">High Risk</Badge>
      case "medium":
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20" variant="outline">Medium Risk</Badge>
      case "low":
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20" variant="outline">Low Risk</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="border-gray-700 text-gray-300 text-xs">
        {type}
      </Badge>
    )
  }

  // Helper component for stats with loading state
  const StatWithLoading = ({ 
    icon: Icon, 
    value, 
    isLoading 
  }: { 
    icon: React.ElementType
    value: string | number | null | undefined
    isLoading: boolean 
  }) => {
    if (isLoading || value === null || value === undefined) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Icon className="h-3 w-3" />
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        <span>{value}</span>
      </div>
    )
  }

  return (
    <FullWidthPage>
      <PageHeader 
        title="Dependency Watchlist" 
        description="Monitor and manage your project dependencies"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-900">
            <Search className="mr-2 h-4 w-4" />
            Filter
          </Button>
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
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 border-gray-800 backdrop-blur-sm border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{allDependencies.length}</div>
            <div className="text-sm text-gray-400">Total Dependencies</div>
          </div>
          <div className="bg-gray-900/50 border-gray-800 backdrop-blur-sm border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {allDependencies.filter(d => d.risk === 'low').length}
            </div>
            <div className="text-sm text-gray-400">Low Risk</div>
          </div>
          <div className="bg-gray-900/50 border-gray-800 backdrop-blur-sm border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {allDependencies.filter(d => d.risk === 'medium').length}
            </div>
            <div className="text-sm text-gray-400">Medium Risk</div>
          </div>
          <div className="bg-gray-900/50 border-gray-800 backdrop-blur-sm border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {allDependencies.filter(d => d.risk === 'high').length}
            </div>
            <div className="text-sm text-gray-400">High Risk</div>
          </div>
        </div>

        {/* Dependencies Grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {/* Add New Dependency Card */}
          <WatchlistSearchDialog
            trigger={
              <div className="bg-gray-900/50 border-gray-800 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-600 p-6 space-y-4 cursor-pointer transition-colors group">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 group-hover:border-gray-600 transition-colors">
                    <Plus className="h-8 w-8 text-gray-400 group-hover:text-gray-300 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-gray-100 transition-colors">Add New Dependency</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Search and add packages to monitor
                    </p>
                  </div>
                </div>
              </div>
            }
            defaultType="production"
          />

          {/* Loading State */}
          {isLoading && (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-400">Loading dependencies...</p>
              </div>
            </div>
          )}

          {/* Dependency Cards */}
          {!isLoading && allDependencies.map((item) => (
            <div key={item.id} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm rounded-lg border p-4 space-y-3 group hover:border-gray-700 transition-colors">
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium line-clamp-1 min-w-0 text-white group-hover:text-gray-100 transition-colors">
                    {item.name}
                  </span>
                  <Badge variant="outline" className="text-xs flex-shrink-0 border-gray-700 text-gray-300">
                    {item.version}
                  </Badge>
                </div>
                <span className="text-sm text-gray-400 line-clamp-1">
                  {item.description || `${item.type} dependency`}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="shrink-0">{getRiskBadge(item.risk)}</div>
                <div className="shrink-0">{getTypeBadge(item.type)}</div>
                {!item.isGitHubDataLoaded && (
                  <Badge variant="outline" className="border-blue-700/50 text-blue-400/80 text-xs">
                    Loading...
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <StatWithLoading 
                  icon={Star} 
                  value={item.stars} 
                  isLoading={!item.isGitHubDataLoaded}
                />
                <StatWithLoading 
                  icon={Download} 
                  value={item.downloads} 
                  isLoading={!item.isGitHubDataLoaded}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{item.lastUpdate}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white h-6 px-2 text-xs"
                  onClick={() => router.push(`/package-details?name=${encodeURIComponent(item.name)}`)}
                >
                  {item.isGitHubDataLoaded ? 'View' : 'View Details'}
                </Button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!isLoading && allDependencies.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-800 flex items-center justify-center mb-6">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Dependencies Yet
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Start by adding your first dependency to monitor
                </p>
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
          )}
        </div>
      </FullWidthContainer>
    </FullWidthPage>
  )
}
