"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Package, Search, TrendingUp, Shield, Clock, Download, Star, Users, Loader2, Bell, Activity, Users2, TrendingDown, Calendar } from "lucide-react"

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
import { checkRepositoryStatus } from '@/lib/watchlist/api'

// Utility function to format large numbers
const formatNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '0'
  
  const value = typeof num === 'string' ? parseInt(num) : num
  if (isNaN(value)) return '0'
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  } else {
    return value.toString()
  }
}

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
  // Status tracking
  status?: 'processing' | 'ready' | 'error'
  repoUrl?: string
  // New enriched data fields from backend
  activity_score?: number
  bus_factor?: number
  health_score?: number
  notification_count?: number
  tracking_duration?: string
}

export default function DependenciesPage() {
  const { items: userDependencies, isLoading, refreshItems } = useWatchlist()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [dependencyStatuses, setDependencyStatuses] = useState<Record<string, 'processing' | 'ready' | 'error'>>({})
  
  // Refresh watchlist when component mounts or when returning to this page
  useEffect(() => {
    console.log('🔄 Initial watchlist refresh...')
    refreshItems()
    
    // Also refresh when the page becomes visible (user returns from another page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Visibility change - refreshing watchlist...')
        refreshItems()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshItems])
  
  // Use status directly from watchlist data (no separate API calls needed!)
  useEffect(() => {
    console.log('🚀 Processing watchlist data with built-in status:', userDependencies.length, 'items')
    console.log('📋 Current watchlist items:', userDependencies.map(item => ({ name: item.name, status: item.status })))
    
    const statuses: Record<string, 'processing' | 'ready' | 'error'> = {}
    
    for (const item of userDependencies) {
      console.log(`🔍 Item: ${item.name}, status from backend: ${item.status}`)
      statuses[item.name] = (item.status as 'processing' | 'ready' | 'error') || 'ready'
    }
    
    console.log('🎯 Final statuses from backend:', statuses)
    setDependencyStatuses(statuses)
  }, [userDependencies])

  // Poll for processing package statuses
  useEffect(() => {
    const checkProcessingStatuses = async () => {
      const processingPackages = userDependencies.filter(dep => dep.status === 'processing')
      
      if (processingPackages.length === 0) return
      
      console.log(`🔍 Checking status for ${processingPackages.length} processing packages`)
      
      const statusPromises = processingPackages.map(async (pkg) => {
        try {
          const status = await checkRepositoryStatus(pkg.watchlist_id || '')
          return {
            watchlistId: pkg.watchlist_id,
            status: status.status
          }
        } catch (error) {
          console.error(`Error checking status for ${pkg.name}:`, error)
          return {
            watchlistId: pkg.watchlist_id,
            status: 'error' as const
          }
        }
      })
      
      const results = await Promise.all(statusPromises)
      
      // Update statuses for packages that have changed
      const newStatuses = { ...dependencyStatuses }
      let hasChanges = false
      
      results.forEach(result => {
        if (result.watchlistId) {
          const watchlistId = result.watchlistId
          if (result.status !== dependencyStatuses[watchlistId]) {
            newStatuses[watchlistId] = result.status
            hasChanges = true
            console.log(`📊 Status updated for ${watchlistId}: ${result.status}`)
          }
        }
      })
      
      if (hasChanges) {
        setDependencyStatuses(newStatuses)
        // Only refresh watchlist if any package finished processing (status changed to 'ready')
        const finishedProcessing = results.some(result => 
          result.watchlistId && result.status === 'ready' && dependencyStatuses[result.watchlistId] === 'processing'
        )
        if (finishedProcessing) {
          console.log('🔄 Package finished processing, refreshing watchlist data...')
          refreshItems()
        }
      }
    }
    
    // Check immediately
    checkProcessingStatuses()
    
    // Then check every 3 seconds
    const interval = setInterval(checkProcessingStatuses, 3000)
    
    return () => clearInterval(interval)
  }, [userDependencies, dependencyStatuses, refreshItems])

  // Transform user dependencies to display format
  const allDependencies: DisplayDependency[] = useMemo(() => {
    return userDependencies.map(dep => ({
      id: dep.id,
      name: dep.name,
      version: dep.version || 'latest',
      type: dep.type,
      risk: dep.risk,
      stars: dep.stars,
      maintainers: dep.maintainers,
      lastUpdate: dep.lastUpdate,
      downloads: dep.downloads?.toString() || null,
      description: dep.description,
      status: dependencyStatuses[dep.watchlist_id || ''] || dep.status,
      repoUrl: dep.repo_url,
      activity_score: dep.activity_score,
      bus_factor: dep.bus_factor,
      health_score: dep.health_score,
      notification_count: dep.notification_count || 0,
      tracking_duration: dep.tracking_duration
    }))
  }, [userDependencies, dependencyStatuses])

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
    if (isLoading || value === null || value === undefined || value === '') {
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
        <span>{formatNumber(value)}</span>
      </div>
    )
  }

  // Helper function to get activity color and label
  const getActivityDisplay = (score: number | null | undefined) => {
    if (!score) return { color: 'text-gray-400', borderColor: 'border-gray-600', label: 'Unknown' }
    if (score >= 70) return { color: 'text-green-400', borderColor: 'border-green-500/30', label: 'Active' }
    if (score >= 40) return { color: 'text-yellow-400', borderColor: 'border-yellow-500/30', label: 'Moderate Activity' }
    return { color: 'text-red-400', borderColor: 'border-red-500/30', label: 'Inactive' }
  }

  // Helper function to get bus factor risk level
  const getBusFactorDisplay = (factor: number | null | undefined) => {
    if (!factor) return { color: 'text-gray-400', borderColor: 'border-gray-600', label: 'Unknown' }
    if (factor >= 5) return { color: 'text-green-400', borderColor: 'border-green-500/30', label: 'No Bus Factor Risk' }
    if (factor >= 3) return { color: 'text-yellow-400', borderColor: 'border-yellow-500/30', label: 'Bus Factor Risk' }
    return { color: 'text-red-400', borderColor: 'border-red-500/30', label: 'Bus Factor Risk' }
  }

  // Helper function to get health color and label
  const getHealthDisplay = (score: number | null | undefined) => {
    if (!score) return { color: 'text-gray-400', borderColor: 'border-gray-600', label: 'Unknown' }
    if (score >= 80) return { color: 'text-green-400', borderColor: 'border-green-500/30', label: 'Good Health' }
    if (score >= 60) return { color: 'text-yellow-400', borderColor: 'border-yellow-500/30', label: 'Fair Health' }
    return { color: 'text-red-400', borderColor: 'border-red-500/30', label: 'Poor Health' }
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
            onRepositoryAdded={refreshItems}
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
          {!isLoading && allDependencies.map((item) => {
            return (
              <div
                key={item.id}
                className={`bg-gray-900/50 border-gray-800 backdrop-blur-sm rounded-lg border p-4 space-y-3 group transition-colors ${
                  item.status === 'processing' 
                    ? 'animate-pulse cursor-not-allowed' 
                    : 'hover:border-gray-700 cursor-pointer'
                }`}
                onClick={() => {
                  if (item.status !== 'processing') {
                    router.push(`/package-details?name=${encodeURIComponent(item.name)}`)
                  }
                }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium line-clamp-1 min-w-0 text-white group-hover:text-gray-100 transition-colors">
                      {item.name.split('/').pop() || item.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {item.status === 'processing' ? (
                    <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Processing...
                    </Badge>
                  ) : (
                    <>
                        <Badge variant="outline" className={`${getActivityDisplay(item.activity_score).borderColor} text-gray-300 text-xs`}>
                          <Activity className={`mr-1 h-3 w-3 ${getActivityDisplay(item.activity_score).color}`} />
                          {getActivityDisplay(item.activity_score).label}
                        </Badge>
                        <Badge variant="outline" className={`${getBusFactorDisplay(item.bus_factor).borderColor} text-gray-300 text-xs`}>
                          <Users2 className={`mr-1 h-3 w-3 ${getBusFactorDisplay(item.bus_factor).color}`} />
                          {getBusFactorDisplay(item.bus_factor).label}
                        </Badge>
                        <Badge variant="outline" className={`${getHealthDisplay(item.health_score).borderColor} text-gray-300 text-xs`}>
                          <Shield className={`mr-1 h-3 w-3 ${getHealthDisplay(item.health_score).color}`} />
                          {getHealthDisplay(item.health_score).label}
                        </Badge>
                    </>
                  )}
                </div>

                {/* Notification Counter */}
                {(item.notification_count || 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-500 font-medium">
                      {item.notification_count || 0} new alerts
                    </span>
                  </div>
                )}

                {/* Stats Icons */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <StatWithLoading 
                    icon={Star} 
                    value={item.stars} 
                    isLoading={isLoading} 
                  />
                  <StatWithLoading 
                    icon={Download} 
                    value={item.downloads} 
                    isLoading={isLoading} 
                  />
                  <StatWithLoading 
                    icon={Users} 
                    value={item.maintainers} 
                    isLoading={isLoading} 
                  />
                </div>
                
                {/* Tracking Duration */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Tracking for {item.tracking_duration || '0 days'}</span>
                  </div>
                  {item.status !== 'processing' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white h-6 px-2 text-xs"
                      onClick={() => router.push(`/package-details?name=${encodeURIComponent(item.name)}`)}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

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
                  onRepositoryAdded={refreshItems}
                />
              </div>
            </div>
          )}
        </div>
      </FullWidthContainer>
    </FullWidthPage>
  )
}
