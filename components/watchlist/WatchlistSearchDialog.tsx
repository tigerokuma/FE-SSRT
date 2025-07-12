import { useState, useEffect } from "react"
import { Search, Loader2, Download, Plus } from "lucide-react"

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
  onPreview: (pkg: PackageType, type: 'npm' | 'github') => void
  onAdd: (pkg: PackageType) => void
  searchQuery: string
  isAdding?: boolean
}

function PackageCard({ pkg, onPreview, onAdd, searchQuery, isAdding }: PackageCardProps) {
  const isExactMatch = pkg.name.toLowerCase() === searchQuery.toLowerCase().trim()
  
  return (
    <div className="group rounded-lg border border-gray-800 p-4 hover:border-gray-700 hover:bg-gray-900/50 transition-all duration-200 bg-black-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-white truncate">{pkg.name}</h3>
          {isExactMatch && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
              exact match
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <Download className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{formatNumber(pkg.downloads)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {pkg.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {pkg.description}
        </p>
      )}

      {/* Keywords */}
      {pkg.keywords && pkg.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pkg.keywords.slice(0, 4).map((keyword: string, idx: number) => (
            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
              {keyword}
            </span>
          ))}
          {pkg.keywords.length > 4 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-500">
              +{pkg.keywords.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Metadata Row */}
      <div className="flex items-center justify-between gap-4 mb-3 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {/* Maintainer */}
          {pkg.maintainers && pkg.maintainers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {pkg.maintainers[0].charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-300">{pkg.maintainers[0]}</span>
              {pkg.maintainers.length > 1 && (
                <span className="text-gray-500">+{pkg.maintainers.length - 1}</span>
              )}
            </div>
          )}
          
          {/* Version & Last Updated */}
          <div className="flex items-center gap-3">
            {pkg.version && (
              <span className="font-mono text-gray-400">v{pkg.version}</span>
            )}
            {pkg.last_updated && (
              <span className="text-gray-500">{pkg.last_updated}</span>
            )}
          </div>
        </div>

        {/* License */}
        {pkg.license && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="text-xs">⚖️</span>
            <span className="font-medium">{pkg.license}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(pkg, 'npm')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            NPM
          </button>
          {pkg.repo_url && (
            <button
              onClick={() => onPreview(pkg, 'github')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              GitHub
            </button>
          )}
        </div>
        
        <Button
          onClick={() => onAdd(pkg)}
          disabled={isAdding}
          size="sm"
          className="h-8 px-4 text-sm font-medium bg-white text-black hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
        >
          {isAdding ? (
            <>
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1.5" />
              Add
            </>
          )}
        </Button>
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
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchPackages(searchQuery)
      } else if (searchQuery.trim().length === 0) {
        clearSearch()
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchPackages, clearSearch])

  const handleAddToWatchlist = async (pkg: PackageType) => {
    try {
      await addItem(pkg, defaultType)
      setIsOpen(false)
      setSearchQuery("")
      clearSearch()
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
                    onPreview={handlePackagePreview}
                    onAdd={handleAddToWatchlist}
                    searchQuery={searchQuery}
                    isAdding={isAdding}
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
          <div className="text-sm text-gray-500">
            {searchResults.length > 0 && (
              <span>Click "Add" on any package to add it to your watchlist</span>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 