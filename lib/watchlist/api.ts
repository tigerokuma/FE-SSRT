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
// Defaults to local API, falls back to remote if not set

// API proxy path for Next.js rewrites
const API_BASE_URL = '/api/backend'





/**
 * Search for NPM packages via the new API
 * Returns fast NPM data only - no GitHub fields
 */
export const searchPackages = async (query: string): Promise<SearchApiResponse> => {
  try {
    console.log('Searching for:', query)
    const response = await fetch(`${API_BASE_URL}/packages/search?name=${encodeURIComponent(query)}`)
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Raw API response:', data)
    

    
    // Debug: Check for vulnerability data in results
    if (data.results && data.results.length > 0) {
      console.log('Checking for vulnerability data in results:')
      data.results.forEach((pkg: any, index: number) => {
        console.log(`Package ${index + 1}: ${pkg.name}`)
        console.log(`  - osv_vulnerabilities:`, pkg.osv_vulnerabilities)
        console.log(`  - vulnerability count:`, pkg.osv_vulnerabilities?.length || 0)
      })
    }
    
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
      ? `${API_BASE_URL}/packages/${encodeURIComponent(name)}?view=details`
      : `${API_BASE_URL}/packages/${encodeURIComponent(name)}`
    
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
    
    const response = await fetch(`${API_BASE_URL}/watchlist`, {
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
 * Get user's watchlist from the backend
 */
export const getUserWatchlist = async (userId: string = 'user-123'): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user watchlist:', error);
    throw error;
  }
}

/**
 * Add a repository to the watchlist with alert configuration
 * Calls the activity service endpoint
 */
export const addRepositoryToWatchlist = async (
  config: {
    repo_url: string
    added_by: string
    project_id?: string
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
      suspicious_author_timestamps: {
        enabled: boolean
      }
      new_vulnerabilities_detected: {
        enabled: boolean
      }
      health_score_decreases: {
        enabled: boolean
        minimum_health_change: number
      }
    }
  }
): Promise<any> => {
  try {
    console.log('Adding repository to watchlist with config:', config)
    
    // If project_id is provided, use the new project watchlist endpoint
    if (config.project_id) {
      const response = await fetch(`${API_BASE_URL}/projects/${config.project_id}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: config.added_by,
          repoUrl: config.repo_url,
          name: config.repo_url.split('/').pop() || 'Unknown',
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to add repository: ${response.statusText} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Repository added to project watchlist successfully:', data)
      
      return data
    }
    
    // Fallback to original activity endpoint
    const response = await fetch(`${API_BASE_URL}/activity/user-watchlist-added`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add repository: ${response.statusText} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('Repository added successfully:', data)
    
    return data
  } catch (error) {
    console.error('Error adding repository to watchlist:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to add repository to watchlist. Please try again.')
  }
}

/**
 * Remove a package from the watchlist
 */
export const removeFromWatchlist = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
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
  id: string, 
  updates: Partial<WatchlistItem>
): Promise<WatchlistItem> => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
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
export const fetchWatchlistItems = async (): Promise<any[]> => {
  try {
    // Use the new backend API to fetch user's watchlist
    const userWatchlist = await getUserWatchlist('user-123')
    
    console.log('Raw user watchlist data:', userWatchlist)
    
    // Transform the backend data to match the frontend WatchlistItem format
    const transformedItems = userWatchlist.map((item: any) => {
      console.log('🔄 Transforming item:', item.name, 'vulnerability_summary:', item.vulnerability_summary)
      const transformedItem = {
        id: item.id, // Use the UUID string directly - it's the user watchlist ID
        watchlist_id: item.watchlist_id, // KEEP THE WATCHLIST_ID!
        name: item.name,
        version: item.version || 'latest',
        type: 'production' as const, // Default to production for now
        risk: (item.risk_score ? (item.risk_score >= 70 ? 'low' : item.risk_score >= 40 ? 'medium' : 'high') : 'medium') as 'low' | 'medium' | 'high',
        activity: (item.activity_score ? 
          (item.activity_score >= 70 ? 'high' : item.activity_score >= 40 ? 'medium' : 'low') : 'medium') as 'low' | 'medium' | 'high',
        lastUpdate: item.last_updated || new Date().toISOString(),
        cves: item.notification_count || 0, // Use real alert count from backend
        maintainers: item.contributors || 0, // This is correct - backend returns contributors
        stars: item.stars ? item.stars.toString() : '0', // This is correct
        downloads: item.downloads || 0, // Add the missing downloads field
        createdAt: item.added_at,
        updatedAt: item.last_updated,
        status: item.status, // Include the status from the backend!
        // New enriched data fields
        activity_score: item.activity_score !== undefined && item.activity_score !== null ? item.activity_score : null,
        bus_factor: item.bus_factor || null,
        health_score: item.health_score || null,
        tracking_duration: item.tracking_duration || '0 days',
        notification_count: item.notification_count || 0,
        // Vulnerability data
        vulnerability_summary: item.vulnerability_summary || null
      }
      console.log('🔄 Transformed item vulnerability_summary:', transformedItem.vulnerability_summary)
      console.log('🔄 Full transformed item:', JSON.stringify(transformedItem, null, 2))
      return transformedItem
    })
    
    console.log('Transformed watchlist items:', transformedItems)
    
    return transformedItems
  } catch (error) {
    console.error('Error fetching watchlist items:', error)
    // Return empty array if there's an error, so the UI doesn't break
    return []
  }
}

/**
 * Check repository processing status
 */
export const checkRepositoryStatus = async (watchlistId: string): Promise<{
  status: 'processing' | 'ready' | 'error'
  message?: string
}> => {
  try {
    console.log(`🔍 Checking status for watchlist: ${watchlistId}`)
    
    const response = await fetch(`${API_BASE_URL}/activity/watchlist/${watchlistId}/status`)
    
    if (!response.ok) {
      console.log(`❌ Status check failed for ${watchlistId}: ${response.status}`)
      if (response.status === 404) {
        console.log(`⚠️ 404 - Watchlist not found, assuming ready`)
        return { status: 'ready', message: 'Repository is ready' }
      }
      console.log(`❌ HTTP error: ${response.status}`)
      return { status: 'error', message: 'Failed to check status' }
    }
    
    const data = await response.json()
    console.log(`✅ Status response for ${watchlistId}:`, data)
    
    const status = data.status || 'ready'
    console.log(`📊 Final status for ${watchlistId}: ${status}`)
    
    return {
      status: status,
      message: data.message || 'Status retrieved successfully'
    }
  } catch (error) {
    console.error('💥 Error checking repository status:', error)
    return { status: 'ready', message: 'Repository is ready' }
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

/**
 * Get recent commits for a watchlist
 */
export const getRecentCommits = async (
  watchlistId: string, 
  limit: number = 50
): Promise<{
  watchlist_id: string
  commits: Array<{
    id: string
    message: string
    author: string
    time: string
    avatar: string
    initials: string
    linesAdded: number
    linesDeleted: number
    filesChanged: number
    isSuspicious: boolean
    suspiciousReason: string
    sha: string
  }>
  total_count: number
  repository_name: string
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/activity/watchlist/${watchlistId}/commits?limit=${limit}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get recent commits: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting recent commits:', error)
    throw new Error('Failed to get recent commits. Please try again.')
  }
}

/**
 * Generate AI summary of recent commits
 */
export const generateCommitSummary = async (
  watchlistId: string,
  commitCount: number = 50
): Promise<{
  summary: string
  commitCount: number
  dateRange: string
  totalLinesAdded: number
  totalLinesDeleted: number
  totalFilesChanged: number
  authors: string[]
  generatedAt: string
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/activity/watchlist/${watchlistId}/commit-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commitCount,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to generate commit summary: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error generating commit summary:', error)
    throw new Error('Failed to generate commit summary. Please try again.')
  }
}

/**
 * Update alert settings for a user watchlist
 */
export const updateUserWatchlistAlerts = async (
  userWatchlistId: string,
  alerts: any
): Promise<void> => {
  try {
    console.log('Updating alert settings for user watchlist:', userWatchlistId)
    
    const response = await fetch(`${API_BASE_URL}/activity/user-watchlist-alerts/${userWatchlistId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alerts }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update alert settings: ${response.statusText} - ${errorText}`)
    }
    
    console.log('Alert settings updated successfully')
  } catch (error) {
    console.error('Error updating alert settings:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update alert settings. Please try again.')
  }
}

 