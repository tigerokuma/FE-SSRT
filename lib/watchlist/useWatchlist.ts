import { useState, useCallback, useEffect } from 'react'
import { 
  Package, 
  WatchlistItem, 
  UseWatchlistState, 
  WatchlistOperations 
} from './types'
import { 
  addToWatchlist as apiAddToWatchlist,
  removeFromWatchlist as apiRemoveFromWatchlist,
  updateWatchlistItem as apiUpdateWatchlistItem,
  fetchWatchlistItems,
  searchPackages as apiSearchPackages
} from './api'

/**
 * Custom hook for managing watchlist operations
 */
export const useWatchlist = (): UseWatchlistState & WatchlistOperations => {
  const [state, setState] = useState<UseWatchlistState>({
    items: [],
    isLoading: false, // Don't show loading since we're not fetching yet
    isAdding: false,
    error: null,
  })

  // TODO: Enable when watchlist API is ready
  // Load watchlist items on mount
  // useEffect(() => {
  //   const loadItems = async () => {
  //     try {
  //       const items = await fetchWatchlistItems()
  //       setState(prev => ({
  //         ...prev,
  //         items,
  //         isLoading: false,
  //       }))
  //     } catch (error) {
  //       const errorMessage = error instanceof Error ? error.message : 'Failed to load watchlist items'
  //       setState(prev => ({
  //         ...prev,
  //         isLoading: false,
  //         error: errorMessage,
  //       }))
  //     }
  //   }

  //   loadItems()
  // }, [])

  /**
   * Add a package to the watchlist
   */
  const addItem = useCallback(async (pkg: Package, type: WatchlistItem['type'] = 'production') => {
    setState(prev => ({ ...prev, isAdding: true, error: null }))
    
    try {
      // TODO: Enable when watchlist API is ready
      // const newItem = await apiAddToWatchlist(pkg, type, state.items)
      
      // For now, just add locally
      const newItem = {
        id: Math.max(0, ...state.items.map(item => item.id)) + 1,
        name: pkg.name,
        version: pkg.version || 'latest',
        type,
        risk: 'low' as const,
        activity: 'high' as const,
        lastUpdate: 'recently',
        cves: 0,
        maintainers: pkg.maintainers?.length || 0,
        stars: String(pkg.downloads || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      setState(prev => ({
        ...prev,
        items: [...prev.items, newItem],
        isAdding: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add package to watchlist'
      setState(prev => ({
        ...prev,
        isAdding: false,
        error: errorMessage,
      }))
      throw error // Re-throw so calling component can handle it
    }
  }, [state.items])

  /**
   * Remove a package from the watchlist
   */
  const removeItem = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Enable when watchlist API is ready
      // await apiRemoveFromWatchlist(id)
      
      // For now, just remove locally
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove package from watchlist'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      throw error
    }
  }, [])

  /**
   * Update a watchlist item
   */
  const updateItem = useCallback(async (id: number, updates: Partial<WatchlistItem>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Enable when watchlist API is ready
      // const updatedItem = await apiUpdateWatchlistItem(id, updates)
      
      // For now, just update locally
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === id 
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        ),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update watchlist item'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      throw error
    }
  }, [])

  /**
   * Refresh all watchlist items
   */
  const refreshItems = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // TODO: Enable when watchlist API is ready
      // const items = await fetchWatchlistItems()
      
      // For now, just clear loading state
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh watchlist items'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      throw error
    }
  }, [])

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    addItem,
    removeItem,
    updateItem,
    refreshItems,
    clearError,
  }
}

/**
 * Hook for package search functionality
 */
export const usePackageSearch = () => {
  const [searchResults, setSearchResults] = useState<Package[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchResponseTime, setSearchResponseTime] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const searchPackages = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      setSearchResponseTime("")
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const startTime = Date.now()
      const response = await apiSearchPackages(query)
      const endTime = Date.now()

      setSearchResults(response.results || [])
      setSearchResponseTime(response.responseTime || `${endTime - startTime}ms`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      setError(errorMessage)
      setSearchResults([])
      setSearchResponseTime("")
    } finally {
      setIsSearching(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setSearchResponseTime("")
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    searchResults,
    isSearching,
    searchResponseTime,
    error,
    searchPackages,
    clearSearch,
    clearError,
  }
} 