import { 
  Package, 
  WatchlistItem, 
  AddToWatchlistRequest, 
  WatchlistApiResponse,
  SearchApiResponse,
  ApiResult
} from './types'
import { packageToWatchlistItem, getNextId, deduplicatePackages } from './utils'

// API Base URL - configurable via environment
// Defaults to remote API, falls back to localhost if not set
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://34.94.83.163:3000'

// API proxy path for Next.js rewrites
const API_PROXY_PATH = process.env.NEXT_PUBLIC_API_PROXY_PATH || '/api/backend'

/**
 * Search for NPM packages via the new API
 * Returns fast NPM data only - no GitHub fields
 */
export const searchPackages = async (query: string): Promise<SearchApiResponse> => {
  try {
    console.log('Searching for:', query)
    const response = await fetch(`${API_PROXY_PATH}/packages/search?name=${encodeURIComponent(query)}`)
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Raw API response:', data)
    
    // Apply deduplication to prevent React key conflicts
    if (data.results) {
      console.log('Results before deduplication:', data.results.map((r: any) => r.name))
      data.results = deduplicatePackages(data.results)
      console.log('Results after deduplication:', data.results.map((r: any) => r.name))
      data.count = data.results.length
    }
    
    return data
  } catch (error) {
    console.error('Error searching packages:', error)
    throw new Error('Failed to search packages. Please try again.')
  }
}

/**
 * Parallel API Strategy: Fast search + optional GitHub enrichment
 * This is the recommended approach for maximum efficiency
 */
export const searchAndEnrichPackages = async (
  query: string,
  options: {
    enrichWithGitHub?: boolean
    maxConcurrentEnrichments?: number
  } = {}
): Promise<{
  searchResults: SearchApiResponse
  enrichedResults?: Package[]
  enrichmentErrors?: string[]
}> => {
  const { enrichWithGitHub = false, maxConcurrentEnrichments = 5 } = options

  // 1. Get fast search results immediately (NPM data only)
  const searchResults = await searchPackages(query)
  
  if (!enrichWithGitHub || !searchResults.results?.length) {
    return { searchResults }
  }

  // 2. Enrich with GitHub data in parallel (optional)
  const enrichedResults: Package[] = []
  const enrichmentErrors: string[] = []

  // Process in batches to avoid overwhelming the API
  const results = searchResults.results.slice(0, maxConcurrentEnrichments)
  
  const enrichmentPromises = results.map(async (pkg: Package) => {
    try {
      const result = await getPackageDetails(pkg.name, 'details')
      if (result.success) {
        return result.data
      } else {
        enrichmentErrors.push(`Failed to enrich ${pkg.name}: ${result.error}`)
        return pkg // Fallback to NPM data only
      }
    } catch (error) {
      enrichmentErrors.push(`Failed to enrich ${pkg.name}: ${error}`)
      return pkg // Fallback to NPM data only
    }
  })

  const enrichedData = await Promise.all(enrichmentPromises)
  enrichedResults.push(...enrichedData)

  return {
    searchResults,
    enrichedResults,
    enrichmentErrors: enrichmentErrors.length > 0 ? enrichmentErrors : undefined
  }
}

/**
 * Batch enrich packages with GitHub data
 * Useful for updating existing search results with GitHub data
 */
export const batchEnrichPackages = async (
  packages: Package[],
  options: {
    maxConcurrent?: number
    timeout?: number
  } = {}
): Promise<{
  enriched: Package[]
  errors: Array<{ packageName: string; error: string }>
}> => {
  const { maxConcurrent = 5, timeout = 30000 } = options
  const enriched: Package[] = []
  const errors: Array<{ packageName: string; error: string }> = []

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < packages.length; i += maxConcurrent) {
    const batch = packages.slice(i, i + maxConcurrent)
    
    const batchPromises = batch.map(async (pkg) => {
      try {
        const timeoutPromise = new Promise<Package>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), timeout)
        })

        const detailsPromise = getPackageDetails(pkg.name, 'details').then(result => {
          if (result.success) {
            return result.data
          } else {
            throw new Error(result.error)
          }
        })

        const enrichedPkg = await Promise.race([detailsPromise, timeoutPromise])
        return enrichedPkg
      } catch (error) {
        errors.push({ 
          packageName: pkg.name, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        return pkg // Fallback to original data
      }
    })

    const batchResults = await Promise.all(batchPromises)
    enriched.push(...batchResults)
  }

  return { enriched, errors }
}

/**
 * Get package details by name (default summary view)
 * Returns a result object instead of throwing errors
 */
export const getPackageDetails = async (name: string, view: 'summary' | 'details' = 'summary'): Promise<ApiResult<Package>> => {
  try {
    const url = view === 'details' 
      ? `${API_PROXY_PATH}/packages/${encodeURIComponent(name)}?view=details`
      : `${API_PROXY_PATH}/packages/${encodeURIComponent(name)}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorType = response.status === 404 ? 'not_found' : 
                       response.status >= 500 ? 'server_error' : 'network'
      
      return {
        success: false,
        error: `Failed to get package details: ${response.statusText}`,
        errorType
      }
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error getting package details:', error)
    return {
      success: false,
      error: 'Failed to get package details. Please check your connection.',
      errorType: 'network'
    }
  }
}

/**
 * Get package details with full information
 * Legacy wrapper that throws errors for backward compatibility
 */
export const getPackageDetailsWithFull = async (name: string): Promise<Package> => {
  const result = await getPackageDetails(name, 'details')
  if (!result.success) {
    throw new Error(result.error)
  }
  return result.data
}

/**
 * Safe package details fetcher that returns null on failure
 * Use this for non-critical operations where you want graceful degradation
 */
export const getPackageDetailsSafe = async (name: string, view: 'summary' | 'details' = 'summary'): Promise<Package | null> => {
  const result = await getPackageDetails(name, view)
  return result.success ? result.data : null
}

/**
 * Smart package fetching - chooses summary or details based on use case
 */
export const getPackageForUseCase = async (
  name: string, 
  useCase: 'search' | 'preview' | 'analysis' | 'watchlist'
): Promise<Package> => {
  const view = (useCase === 'preview' || useCase === 'analysis') ? 'details' : 'summary'
  const result = await getPackageDetails(name, view)
  
  if (!result.success) {
    throw new Error(result.error)
  }
  
  return result.data
}

/**
 * Add a package to the watchlist
 * Currently stores locally, but prepared for backend integration
 */
export const addToWatchlist = async (
  pkg: Package, 
  type: WatchlistItem['type'] = 'production',
  existingItems: WatchlistItem[] = []
): Promise<WatchlistItem> => {
  try {
    // Check if package already exists in watchlist
    const existingItem = existingItems.find(item => item.name === pkg.name)
    if (existingItem) {
      throw new Error(`${pkg.name} is already in your watchlist`)
    }
    
    const response = await fetch(`${API_PROXY_PATH}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ package: pkg, type }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to add to watchlist: ${response.statusText}`)
    }
    
    const data: WatchlistApiResponse = await response.json()
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to add to watchlist')
    }
    
    return data.data
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to add package to watchlist. Please try again.')
  }
}

/**
 * Remove a package from the watchlist
 */
export const removeFromWatchlist = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_PROXY_PATH}/watchlist/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to remove from watchlist: ${response.statusText}`)
    }
    
    const data: WatchlistApiResponse = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to remove from watchlist')
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    throw new Error('Failed to remove package from watchlist. Please try again.')
  }
}

/**
 * Update a watchlist item
 */
export const updateWatchlistItem = async (
  id: number, 
  updates: Partial<WatchlistItem>
): Promise<WatchlistItem> => {
  try {
    const response = await fetch(`${API_PROXY_PATH}/watchlist/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update watchlist item: ${response.statusText}`)
    }
    
    const data: WatchlistApiResponse = await response.json()
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update watchlist item')
    }
    
    return data.data
  } catch (error) {
    console.error('Error updating watchlist item:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update watchlist item. Please try again.')
  }
}

/**
 * Fetch all watchlist items
 */
export const fetchWatchlistItems = async (): Promise<WatchlistItem[]> => {
  try {
    const response = await fetch(`${API_PROXY_PATH}/watchlist`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch watchlist: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching watchlist items:', error)
    throw new Error('Failed to fetch watchlist items. Please try again.')
  }
}

/**
 * Refresh package data for a watchlist item
 */
export const refreshPackageData = async (name: string): Promise<Package> => {
  try {
    // Get fresh summary data for watchlist refresh (lightweight)
    return await getPackageForUseCase(name, 'watchlist')
  } catch (error) {
    console.error('Error refreshing package data:', error)
    throw new Error('Failed to refresh package data. Please try again.')
  }
} 