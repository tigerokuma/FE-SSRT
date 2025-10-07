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
  searchPackages as apiSearchPackages,
  searchAndEnrichPackages,
  batchEnrichPackages,
  // testEventStreamSearch
} from './api'

/**
 * Custom hook for managing watchlist operations
 */
export const useWatchlist = (): UseWatchlistState & WatchlistOperations => {
  const [state, setState] = useState<UseWatchlistState>({
    items: [],
    isLoading: false,
    isAdding: false,
    error: null,
  })

  // Load watchlist items on mount
  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const items = await fetchWatchlistItems()
      setState(prev => ({ ...prev, items, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load watchlist'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const addItem = useCallback(async (pkg: Package, type: WatchlistItem['type'] = 'production') => {
    setState(prev => ({ ...prev, isAdding: true, error: null }))
    try {
      await apiAddToWatchlist(pkg, type, state.items)
      await loadItems() // Refresh the list
      setState(prev => ({ ...prev, isAdding: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item'
      setState(prev => ({ ...prev, error: errorMessage, isAdding: false }))
    }
  }, [loadItems, state.items])

  const removeItem = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      await apiRemoveFromWatchlist(id)
      await loadItems() // Refresh the list
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [loadItems])

  const updateItem = useCallback(async (id: string, updates: Partial<WatchlistItem>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      await apiUpdateWatchlistItem(id, updates)
      await loadItems() // Refresh the list
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [loadItems])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    addItem,
    removeItem,
    updateItem,
    refreshItems: loadItems,
    clearError,
  }
}

/**
 * Hook for package search functionality with parallel API strategy
 */
export const usePackageSearch = () => {
  const [searchResults, setSearchResults] = useState<Package[]>([])
  const [enrichedResults, setEnrichedResults] = useState<Package[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [searchResponseTime, setSearchResponseTime] = useState<string>("")
  const [enrichmentProgress, setEnrichmentProgress] = useState<{
    total: number
    completed: number
    errors: string[]
  }>({ total: 0, completed: 0, errors: [] })
  const [error, setError] = useState<string | null>(null)

  const searchPackages = useCallback(async (query: string, options: {
    enrichWithGitHub?: boolean
    maxConcurrentEnrichments?: number
  } = {}) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      setEnrichedResults([])
      setSearchResponseTime("")
      setEnrichmentProgress({ total: 0, completed: 0, errors: [] })
      return
    }

    // Test event-stream specifically
    // if (query.toLowerCase().includes('event-stream')) {
    //   console.log('Testing event-stream search...')
    //   await testEventStreamSearch()
    // }

    setIsSearching(true)
    setError(null)

    try {
      const startTime = Date.now()
      
      if (options.enrichWithGitHub) {
        // Use parallel strategy: fast search + GitHub enrichment
        const response = await searchAndEnrichPackages(query, options)
        const endTime = Date.now()

        setSearchResults(response.searchResults.results || [])
        setSearchResponseTime(response.searchResults.responseTime || `${endTime - startTime}ms`)
        
        if (response.enrichedResults) {
          setEnrichedResults(response.enrichedResults)
        }
        
        if (response.enrichmentErrors) {
          setEnrichmentProgress(prev => ({
            ...prev,
            errors: response.enrichmentErrors || []
          }))
        }
      } else {
        // Fast search only (NPM data)
        const response = await apiSearchPackages(query)
        const endTime = Date.now()

        setSearchResults(response.results || [])
        setSearchResponseTime(response.responseTime || `${endTime - startTime}ms`)
        setEnrichedResults([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed'
      setError(errorMessage)
      setSearchResults([])
      setEnrichedResults([])
      setSearchResponseTime("")
    } finally {
      setIsSearching(false)
    }
  }, [])

  const enrichExistingResults = useCallback(async (packages: Package[]) => {
    if (!packages.length) return

    setIsEnriching(true)
    setEnrichmentProgress({ total: packages.length, completed: 0, errors: [] })

    try {
      const { enriched, errors } = await batchEnrichPackages(packages)
      setEnrichedResults(enriched)
      setEnrichmentProgress(prev => ({
        ...prev,
        completed: enriched.length,
        errors: errors.map(e => e.error)
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enrichment failed'
      setError(errorMessage)
    } finally {
      setIsEnriching(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setEnrichedResults([])
    setSearchResponseTime("")
    setEnrichmentProgress({ total: 0, completed: 0, errors: [] })
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    searchResults,
    enrichedResults,
    isSearching,
    isEnriching,
    searchResponseTime,
    enrichmentProgress,
    error,
    searchPackages,
    enrichExistingResults,
    clearSearch,
    clearError,
  }
} 