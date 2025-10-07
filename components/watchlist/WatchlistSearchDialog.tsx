"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import type { Package as PackageType, WatchlistItem } from '../../lib/watchlist/types'
import { usePackageSearch, useWatchlist } from '../../lib/watchlist/index'
import { hasVulnerabilities, hasActiveVulnerabilities, getVulnerabilityCount, getHighestSeverity } from '../../lib/watchlist/utils'
import { PackageCard } from './PackageCard'
import { PackageDetailsSummary } from './PackageDetailsSummary'
import { addRepositoryToWatchlist } from "../../lib/watchlist/api"

interface WatchlistSearchDialogProps {
  trigger?: React.ReactNode
  onPackagePreview?: (pkg: PackageType, type: 'npm' | 'github') => void
  defaultType?: WatchlistItem['type']
  onRepositoryAdded?: () => void
  projectId?: string
}

export function WatchlistSearchDialog({ 
  trigger, 
  onPackagePreview,
  defaultType = 'production',
  onRepositoryAdded,
  projectId
}: WatchlistSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [securityFilter, setSecurityFilter] = useState<'all' | 'secure' | 'vulnerable'>('all')

  const { isAdding: isAddingToWatchlist, addItem } = useWatchlist()
  const {
    searchResults,
    isSearching,
    searchPackages,
    clearSearch,
  } = usePackageSearch()

  // Clear search when query is empty
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      clearSearch()
    }
  }, [searchQuery, clearSearch])

  // Auto-search with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) return

    const timeoutId = setTimeout(() => {
      searchPackages(searchQuery, {
        enrichWithGitHub: false,
        maxConcurrentEnrichments: 0
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchPackages])

  // Calculate security counts using active vulnerabilities
  const secureCount = searchResults.filter(pkg => !hasActiveVulnerabilities(pkg.osv_vulnerabilities)).length
  const vulnerableCount = searchResults.filter(pkg => hasActiveVulnerabilities(pkg.osv_vulnerabilities)).length

  // Filter and sort results by security status and exact match
  const filteredResults = searchResults
    .filter(pkg => {
      if (securityFilter === 'secure') {
        return !hasActiveVulnerabilities(pkg.osv_vulnerabilities)
      } else if (securityFilter === 'vulnerable') {
        return hasActiveVulnerabilities(pkg.osv_vulnerabilities)
      }
      return true
    })
    .sort((a, b) => {
      // Sort exact matches first
      const aIsExact = a.name.toLowerCase() === searchQuery.toLowerCase().trim()
      const bIsExact = b.name.toLowerCase() === searchQuery.toLowerCase().trim()
      
      if (aIsExact && !bIsExact) return -1
      if (!aIsExact && bIsExact) return 1
      
      // Then sort by downloads (higher first) for secondary sorting
      return (b.downloads || 0) - (a.downloads || 0)
    })

  const handlePackageSelect = (pkg: PackageType) => {
    setSelectedPackage(pkg)
    onPackagePreview?.(pkg, 'npm')
  }

  const handleAddToWatchlist = async (pkg: PackageType) => {
    setIsAdding(true)
    try {
      console.log('🔄 Adding repository to watchlist:', pkg.repo_url || pkg.name)
      
      // Create default alert configuration with all alerts disabled
      const defaultAlertConfig = {
        repo_url: pkg.repo_url || `https://github.com/${pkg.name}`,
        added_by: "user-123", // TODO: Get actual user ID
        project_id: projectId, // Include project ID
        alerts: {
          ai_powered_anomaly_detection: {
            enabled: false
          },
          lines_added_deleted: {
            enabled: false,
            contributor_variance: 3.0,
            repository_variance: 3.5,
            hardcoded_threshold: 1000
          },
          files_changed: {
            enabled: false,
            contributor_variance: 2.5,
            repository_variance: 3.0,
            hardcoded_threshold: 20
          },
          suspicious_author_timestamps: {
            enabled: false
          },
          new_vulnerabilities_detected: {
            enabled: false
          },
          health_score_decreases: {
            enabled: false,
            minimum_health_change: 5
          }
        }
      }
      
      // Use addRepositoryToWatchlist which calls the correct endpoint
      const result = await addRepositoryToWatchlist(defaultAlertConfig)
      console.log('✅ Repository added successfully:', result)
      
      setIsOpen(false)
      setSearchQuery("")
      setSelectedPackage(null)
      clearSearch()
      
      // Notify parent component that a repository was added
      onRepositoryAdded?.()
      
    } catch (error) {
      console.error('❌ Error adding repository to watchlist:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const hasResults = searchResults.length > 0

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <div className="flex h-[80vh]">
            {/* Left Panel - Search */}
            <div className="w-1/2 border-r border-gray-800 flex flex-col min-h-0">
              <DialogHeader className="p-6 pb-4 flex-shrink-0">
                <DialogTitle>Search NPM Packages</DialogTitle>
                <DialogDescription>
                  Find and add packages to your watchlist
                </DialogDescription>
              </DialogHeader>

              {/* Search Controls */}
              <div className="px-6 pb-4 flex-shrink-0 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search packages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Security Filter */}
                {searchResults.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Security:</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={securityFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setSecurityFilter('all')}
                        className="text-xs flex items-center gap-1.5"
                      >
                        All
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs font-medium">
                          {searchResults.length}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        variant={securityFilter === 'secure' ? 'default' : 'outline'}
                        onClick={() => setSecurityFilter('secure')}
                        className="text-xs flex items-center gap-1.5"
                      >
                        Secure
                        <span className="bg-green-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs font-medium">
                          {secureCount}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        variant={securityFilter === 'vulnerable' ? 'default' : 'outline'}
                        onClick={() => setSecurityFilter('vulnerable')}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Vulnerable
                        <span className="bg-red-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs font-medium">
                          {vulnerableCount}
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-6">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                        <p className="text-sm text-gray-400">Searching NPM packages...</p>
                      </div>
                    </div>
                  ) : hasResults ? (
                    <div className="space-y-3 pb-6">
                      {filteredResults.map((pkg) => (
                        <PackageCard
                          key={pkg.name}
                          pkg={pkg}
                          onSelect={handlePackageSelect}
                          searchQuery={searchQuery}
                          isSelected={selectedPackage?.name === pkg.name}
                          onAdd={handleAddToWatchlist}
                          isAdding={isAdding}
                        />
                      ))}
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Search className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-400">
                          {securityFilter === 'all' 
                            ? 'No packages found' 
                            : securityFilter === 'secure' 
                            ? 'No secure packages found' 
                            : 'No vulnerable packages found'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Search className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-400">Start typing to search...</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* Right Panel - Package Details */}
            <div className="w-1/2 flex flex-col min-h-0">
              <PackageDetailsSummary
                pkg={selectedPackage}
                onAdd={handleAddToWatchlist}
                isAdding={isAddingToWatchlist}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 