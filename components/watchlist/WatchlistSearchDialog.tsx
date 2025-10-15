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
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WatchlistSearchDialog({ 
  trigger, 
  onPackagePreview,
  defaultType = 'production',
  onRepositoryAdded,
  projectId,
  open,
  onOpenChange
}: WatchlistSearchDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen
  
  // Debug logging
  console.log('🔍 WatchlistSearchDialog - open prop:', open, 'isOpen:', isOpen, 'projectId:', projectId)
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
      console.log('🔄 Adding package to project watchlist:', pkg.name, 'Project ID:', projectId)
      
      if (!projectId) {
        console.error('❌ Project ID is missing:', { projectId, open, onOpenChange })
        throw new Error('Project ID is required but not provided')
      }
      
      // Call our new project watchlist endpoint
      const apiUrl = `http://localhost:3000/projects/${projectId}/watchlist/add-package`
      console.log('🚀 Making API call to:', apiUrl)
      console.log('🚀 Request body:', JSON.stringify({
        packageName: pkg.name,
        repoUrl: pkg.repo_url,
        userId: "user-123",
      }))
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageName: pkg.name,
          repoUrl: pkg.repo_url,
          userId: "user-123", // TODO: Get actual user ID
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorText: errorText
        })
        throw new Error(`Failed to add package: ${response.statusText} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ Package added to project watchlist successfully:', result)
      
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
        {trigger && (
          <DialogTrigger asChild>
            {trigger}
          </DialogTrigger>
        )}

        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <div className="flex h-[80vh]">
            {/* Left Panel - Search */}
            <div className="w-1/2 border-r border-gray-800 flex flex-col min-h-0">
              <DialogHeader className="p-6 pb-4 flex-shrink-0">
                <DialogTitle>Add Package to Project Watchlist</DialogTitle>
                <DialogDescription>
                  Search and add packages to your project's dependency watchlist
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