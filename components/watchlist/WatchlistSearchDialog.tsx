import { useState, useEffect } from "react"
import { Search, Loader2, Package, Download, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import type { Package as PackageType, WatchlistItem } from '../../lib/watchlist/types'
import { usePackageSearch, useWatchlist, formatNumber } from '../../lib/watchlist/index'

interface PackageCardProps {
  pkg: PackageType
  isSelected: boolean
  onSelect: (pkg: PackageType) => void
  onPreview: (pkg: PackageType, type: 'npm' | 'github') => void
  searchQuery: string
}

function PackageCard({ pkg, isSelected, onSelect, onPreview, searchQuery }: PackageCardProps) {
  const isExactMatch = pkg.name.toLowerCase() === searchQuery.toLowerCase().trim()
  
  return (
    <div 
      className={`rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'hover:bg-muted/30'
      }`}
      onClick={() => onSelect(pkg)}
    >
      {/* Header with name and badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{pkg.name}</h3>
          {isExactMatch && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
              exact match
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="font-medium">{formatNumber(pkg.downloads)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {pkg.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {pkg.description}
        </p>
      )}

      {/* Keywords */}
      {pkg.keywords && pkg.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {pkg.keywords.slice(0, 3).map((keyword: string, idx: number) => (
            <Badge key={idx} variant="outline" className="text-xs bg-gray-50 text-gray-600">
              {keyword}
            </Badge>
          ))}
          {pkg.keywords.length > 3 && (
            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 opacity-60">
              +{pkg.keywords.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Bottom row with maintainer info and metadata */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {/* Maintainer info */}
          {pkg.maintainers && pkg.maintainers.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {pkg.maintainers[0].charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{pkg.maintainers[0]}</span>
              {pkg.maintainers.length > 1 && (
                <span className="text-gray-400">+{pkg.maintainers.length - 1}</span>
              )}
            </div>
          )}
          
          {/* Version and last updated */}
          <div className="flex items-center gap-3">
            {pkg.version && (
              <span>{pkg.version}</span>
            )}
            {pkg.last_updated && (
              <span>{pkg.last_updated}</span>
            )}
          </div>
        </div>

        {/* License */}
        {pkg.license && (
          <div className="flex items-center gap-1">
            <span className="text-xs">⚖️</span>
            <span>{pkg.license}</span>
          </div>
        )}
      </div>

      {/* Action Buttons - More subtle */}
      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation()
            onPreview(pkg, 'npm')
          }}
          title="Preview NPM page"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
          NPM
        </Button>
        {pkg.repo_url && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-gray-50 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation()
              onPreview(pkg, 'github')
            }}
            title="Preview GitHub repository"
          >
            <div className="w-2 h-2 rounded-full bg-gray-700 mr-1.5" />
            GitHub
          </Button>
        )}
      </div>
    </div>
  )
}

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

  const { isAdding, addItem } = useWatchlist()
  const {
    searchResults,
    isSearching,
    searchResponseTime,
    searchPackages,
    clearSearch,
  } = usePackageSearch()

  // Auto-search with debouncing
  useEffect(() => {
    // Clear selection when user starts typing new search
    if (selectedPackage && searchQuery.trim() !== selectedPackage.name) {
      setSelectedPackage(null)
    }

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchPackages(searchQuery)
      } else if (searchQuery.trim().length === 0) {
        clearSearch()
        setSelectedPackage(null)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedPackage, searchPackages, clearSearch])

  const handleAddToWatchlist = async (pkg: PackageType) => {
    try {
      await addItem(pkg, defaultType)
      setIsOpen(false)
      setSearchQuery("")
      clearSearch()
      setSelectedPackage(null)
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      // Error is already handled by the hook
    }
  }

  const handlePackagePreview = (pkg: PackageType, type: 'npm' | 'github') => {
    if (onPackagePreview) {
      onPackagePreview(pkg, type)
    } else {
      // Fallback to opening in new tab
      const url = type === 'npm' ? pkg.npm_url : pkg.repo_url
      if (url) window.open(url, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Dependency
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle>Add Dependency to Watchlist</DialogTitle>
          <DialogDescription>
            Search for a package to add to your watchlist for monitoring.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4">
          {/* Search Input */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input 
                placeholder="Start typing to search packages..." 
                className="flex-1 min-w-0 pr-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {/* Search Status */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {searchQuery.length > 0 && searchQuery.length < 2 
                  ? `Type ${2 - searchQuery.length} more character${2 - searchQuery.length > 1 ? 's' : ''} to search...`
                  : searchResponseTime 
                    ? `Search completed in ${searchResponseTime}`
                    : "Search automatically as you type"
                }
              </span>
              {searchResults.length > 0 && (
                <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((pkg, index) => (
                  <PackageCard
                    key={`${pkg.name}-${index}`}
                    pkg={pkg}
                    isSelected={selectedPackage?.name === pkg.name}
                    onSelect={setSelectedPackage}
                    onPreview={handlePackagePreview}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            )}
            
            {/* No Results State */}
            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No packages found</h3>
                <p className="text-sm">Try a different search term or check your spelling.</p>
              </div>
            )}
            
            {/* Empty State */}
            {searchQuery.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Search NPM packages</h3>
                <p className="text-sm">Start typing to find packages to add to your watchlist.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <DialogFooter className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedPackage && (
              <>
                <Package className="h-4 w-4" />
                <span className="font-medium">{selectedPackage.name}</span>
                <span>selected</span>
              </>
            )}
          </div>
          <Button 
            disabled={!selectedPackage || isAdding}
            onClick={() => selectedPackage && handleAddToWatchlist(selectedPackage)}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding to Watchlist...
              </>
            ) : (
              'Add to Watchlist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 