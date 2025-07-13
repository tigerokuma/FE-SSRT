"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { PackageCard } from './PackageCard'
import { PackageDetailsPanel } from './PackageDetailsPanel'

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
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchPackages(searchQuery)
      } else if (searchQuery.trim().length === 0) {
        clearSearch()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchPackages, clearSearch])

  const handleAddToWatchlist = async (pkg: PackageType) => {
    try {
      await addItem(pkg, defaultType)
      setIsOpen(false)
      setSearchQuery("")
      setSelectedPackage(null)
      clearSearch()
    } catch (error) {
      console.error('Error adding to watchlist:', error)
    }
  }

  const handlePackageSelect = (pkg: PackageType) => {
    setSelectedPackage(pkg)
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
      <DialogContent className="max-w-[90vw] w-full h-[85vh] flex flex-col">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle>Add Dependency to Watchlist</DialogTitle>
          <DialogDescription>
            Search for packages and view detailed information before adding to your watchlist.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left Panel - Search */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search Input */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="relative">
                <Input 
                  placeholder="Search packages..." 
                  className="pr-10" 
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
            <ScrollArea className="flex-1">
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((pkg, index) => (
                    <PackageCard
                      key={`${pkg.name}-${index}`}
                      pkg={pkg}
                      onSelect={handlePackageSelect}
                      onAdd={handleAddToWatchlist}
                      searchQuery={searchQuery}
                      isSelected={selectedPackage?.name === pkg.name}
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
            </ScrollArea>
          </div>

          {/* Right Panel - Package Details */}
          <div className="w-[45%] border-l border-gray-800 pl-6 flex flex-col">
            <PackageDetailsPanel
              pkg={selectedPackage}
              onClose={() => setSelectedPackage(null)}
              onAdd={handleAddToWatchlist}
              isAdding={isAdding}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 