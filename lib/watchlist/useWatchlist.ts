import { useState, useCallback, useEffect } from 'react'
import { 
  Package, 
  WatchlistItem, 
  UseWatchlistState, 
  WatchlistOperations 
} from './types'
import { 
  addToWatchlist, 
  removeFromWatchlist, 
  updateWatchlistItem, 
  fetchWatchlistItems, 
  getUserWatchlist 
} from './api'
import { 
  searchAndEnrichPackages, 
  searchPackages, 
  batchEnrichPackages, 
  getPackageDetails, 
  getPackageDetailsSafe, 
  getPackageDetailsWithFull, 
  getPackageForUseCase, 
  refreshPackageData 
} from '../packages/api'

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

  const USER_ID = 'test_user'

  // Load watchlist items on mount
  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const items = await fetchWatchlistItems(USER_ID)
      setState(prev => ({ ...prev, items, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load watchlist'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const addItem = useCallback(async (pkg: Package, type: WatchlistItem['type'] = 'production') => {
    setState(prev => ({ ...prev, isAdding: true, error: null }))
    try {
      await addToWatchlist(USER_ID, pkg.name)
      await loadItems() // Refresh the list
      setState(prev => ({ ...prev, isAdding: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item'
      setState(prev => ({ ...prev, error: errorMessage, isAdding: false }))
    }
  }, [loadItems])

  const removeItem = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      await removeFromWatchlist(String(id), USER_ID)
      await loadItems() // Refresh the list
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [loadItems])

  const updateItem = useCallback(async (id: number, updates: Partial<WatchlistItem>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      // Only pass note and alertsEnabled fields as required by the new API
      const apiUpdates: { note?: string; alertsEnabled?: boolean } = {}
      if ('note' in updates) apiUpdates.note = (updates as any).note
      if ('alertsEnabled' in updates) apiUpdates.alertsEnabled = (updates as any).alertsEnabled
      await updateWatchlistItem(String(id), USER_ID, apiUpdates)
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

  const doSearchPackages = useCallback(async (query: string, options: {
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

    setIsSearching(true)
    setError(null)

    try {
      const startTime = Date.now()
      if (options.enrichWithGitHub) {
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
        const response = await searchPackages(query)
        const endTime = Date.now()
        setSearchResults(response && (response as any).results ? (response as any).results : [])
        setSearchResponseTime(response && (response as any).responseTime ? (response as any).responseTime : `${endTime - startTime}ms`)
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
    searchPackages: doSearchPackages,
    enrichExistingResults,
    clearSearch,
    clearError,
  }
} 