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
import { hasVulnerabilities, getVulnerabilityCount, getHighestSeverity } from '../../lib/watchlist/utils'
import { PackageCard } from './PackageCard'
import { PackageDetailsPanel } from './PackageDetailsPanel'
import { AlertConfigurationDialog } from "./AlertConfigurationDialog"
import { addRepositoryToWatchlist } from "../../lib/watchlist/api"

interface WatchlistSearchDialogProps {
  trigger?: React.ReactNode
  onPackagePreview?: (pkg: PackageType, type: 'npm' | 'github') => void
  defaultType?: WatchlistItem['type']
}

export function WatchlistSearchDialog({ 
  trigger, 
  onPackagePreview,
  defaultType = 'production' 
}: WatchlistSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)
  const [showAlertConfig, setShowAlertConfig] = useState(false)
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

  // Filter results by security status
  const filteredResults = searchResults.filter(pkg => {
    if (securityFilter === 'secure') {
      return !hasVulnerabilities(pkg.osv_vulnerabilities)
    } else if (securityFilter === 'vulnerable') {
      return hasVulnerabilities(pkg.osv_vulnerabilities)
    }
    return true
  })

  const handlePackageSelect = (pkg: PackageType) => {
    setSelectedPackage(pkg)
    onPackagePreview?.(pkg, 'npm')
  }

  const handleAddToWatchlist = async (pkg: PackageType) => {
    // Always show alert config dialog for all packages
    setSelectedPackage(pkg)
    setShowAlertConfig(true)
    setIsOpen(false) // Close search dialog when opening alert config
  }

  const handleAlertConfigAdd = async (config: {
    repo_url: string
    added_by: string
    notes?: string
    alerts: {
      ai_powered_anomaly_detection: {
        enabled: boolean
      }
      lines_added_deleted: {
        enabled: boolean
        contributor_variance: number
        repository_variance: number
        hardcoded_threshold: number
      }
      files_changed: {
        enabled: boolean
        contributor_variance: number
        repository_variance: number
        hardcoded_threshold: number
      }
      high_churn: {
        enabled: boolean
        multiplier: number
        hardcoded_threshold: number
      }
      ancestry_breaks: {
        enabled: boolean
      }
      unusual_author_activity: {
        enabled: boolean
        percentage_outside_range: number
      }
    }
  }) => {
    if (!selectedPackage) return
    
    setIsAdding(true)
    try {
      await addRepositoryToWatchlist(config)
      setShowAlertConfig(false)
      setIsOpen(false)
      setSearchQuery("")
      setSelectedPackage(null)
      clearSearch()
    } catch (error) {
      console.error('Error adding repository to watchlist:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleAlertConfigBack = () => {
    setShowAlertConfig(false)
    setIsOpen(true) // Reopen search dialog when going back
  }

  const handleAlertConfigClose = () => {
    setShowAlertConfig(false)
    setIsOpen(false)
    setSelectedPackage(null)
    setSearchQuery("")
    clearSearch()
  }

  const hasResults = filteredResults.length > 0
  const vulnerableCount = searchResults.filter(pkg => hasVulnerabilities(pkg.osv_vulnerabilities)).length
  const secureCount = searchResults.filter(pkg => !hasVulnerabilities(pkg.osv_vulnerabilities)).length

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
                        className="text-xs"
                      >
                        All ({searchResults.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={securityFilter === 'secure' ? 'default' : 'outline'}
                        onClick={() => setSecurityFilter('secure')}
                        className="text-xs"
                      >
                        Secure ({secureCount})
                      </Button>
                      <Button
                        size="sm"
                        variant={securityFilter === 'vulnerable' ? 'default' : 'outline'}
                        onClick={() => setSecurityFilter('vulnerable')}
                        className="text-xs"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Vulnerable ({vulnerableCount})
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
                          onAdd={handleAddToWatchlist}
                          searchQuery={searchQuery}
                          isSelected={selectedPackage?.name === pkg.name}
                          isAdding={isAddingToWatchlist}
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
              <PackageDetailsPanel
                pkg={selectedPackage}
                onClose={() => setSelectedPackage(null)}
                onAdd={handleAddToWatchlist}
                onAddWithConfig={handleAddToWatchlist} // Use same handler for both buttons
                isAdding={isAddingToWatchlist}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Configuration Dialog */}
      {selectedPackage && (
        <AlertConfigurationDialog
          pkg={selectedPackage}
          isOpen={showAlertConfig}
          onClose={handleAlertConfigClose}
          onBack={handleAlertConfigBack}
          onAdd={handleAlertConfigAdd}
          isAdding={isAdding}
        />
      )}
    </>
  )
} 