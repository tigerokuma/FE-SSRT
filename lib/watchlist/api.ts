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
 * Mock vulnerability data for testing frontend functionality
 * This should be removed once the API is properly integrated
 */
const mockVulnerabilityData: Record<string, { osv_vulnerabilities: any[] }> = {
  "event-stream": {
    osv_vulnerabilities: [
      {
        "id": "GHSA-mh6f-8j2x-4483",
        "summary": "Critical severity vulnerability that affects event-stream and flatmap-stream",
        "severity": "CVSS_V3: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "details": "The NPM package `flatmap-stream` is considered malicious. A malicious actor added this package as a dependency to the NPM `event-stream` package in version `3.3.6`. Users of `event-stream` are encouraged to downgrade to the last non-malicious version, `3.3.4`, or upgrade to the latest 4.x version.\n\nUsers of `flatmap-stream` are encouraged to remove the dependency entirely.\n",
        "affected_versions": ["3.3.6", "4.0.0", "0"],
        "references": [
          {
            "type": "WEB",
            "url": "https://github.com/dominictarr/event-stream/issues/116"
          },
          {
            "type": "ADVISORY",
            "url": "https://github.com/advisories/GHSA-mh6f-8j2x-4483"
          },
          {
            "type": "PACKAGE",
            "url": "https://github.com/dominictarr/event-stream"
          }
        ]
      }
    ]
  },
  "react": {
    osv_vulnerabilities: [
      {
        "id": "GHSA-3vfh-xfqr-9f3m",
        "summary": "Medium severity vulnerability in React DOM that could lead to XSS attacks",
        "severity": "CVSS_V3: CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N",
        "details": "A vulnerability in React DOM allows attackers to potentially execute arbitrary code through carefully crafted user input. This affects versions of React DOM where user-controlled input is rendered without proper sanitization.\n\nUsers are advised to update to the latest version and ensure proper input validation.",
        "affected_versions": ["18.0.0", "19.0.0", "19.1.0"],
        "references": [
          {
            "type": "ADVISORY",
            "url": "https://github.com/advisories/GHSA-3vfh-xfqr-9f3m"
          },
          {
            "type": "WEB",
            "url": "https://react.dev/blog/2024/01/25/react-19-1-0"
          },
          {
            "type": "PACKAGE",
            "url": "https://github.com/facebook/react"
          }
        ]
      },
      {
        "id": "GHSA-7rjr-3q55-vv33",
        "summary": "Medium severity vulnerability in React core affecting state management",
        "severity": "CVSS_V3: CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N",
        "details": "A potential issue in React's state management system could allow for unexpected behavior in certain edge cases. This vulnerability affects how React handles state updates in concurrent features.\n\nThis is considered medium severity as it could lead to application instability but not direct security breaches.",
        "affected_versions": ["19.0.0", "19.1.0"],
        "references": [
          {
            "type": "ADVISORY",
            "url": "https://github.com/advisories/GHSA-7rjr-3q55-vv33"
          },
          {
            "type": "WEB",
            "url": "https://github.com/facebook/react/issues/12345"
          }
        ]
      }
    ]
  }
}

/**
 * Test function to check API response for event-stream
 * This will help us debug the vulnerability data issue
 */
export const testEventStreamSearch = async (): Promise<void> => {
  try {
    console.log('Testing event-stream search...')
    const response = await fetch(`${API_PROXY_PATH}/packages/search?name=event-stream`)
    
    if (!response.ok) {
      console.error('Test failed:', response.statusText)
      return
    }
    
    const data = await response.json()
    console.log('Test API response for event-stream:', JSON.stringify(data, null, 2))
    
    if (data.results && data.results.length > 0) {
      const eventStream = data.results.find((pkg: any) => pkg.name === 'event-stream')
      if (eventStream) {
        console.log('Event-stream package found:', eventStream)
        console.log('OSV vulnerabilities:', eventStream.osv_vulnerabilities)
        console.log('Vulnerability count:', eventStream.osv_vulnerabilities?.length || 0)
      } else {
        console.log('Event-stream package not found in results')
      }
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

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
    
    // TEMPORARY: Add mock vulnerability data for testing
    // This should be removed once the API is properly integrated
    if (data.results && data.results.length > 0) {
      data.results.forEach((pkg: any) => {
        if (mockVulnerabilityData[pkg.name]) {
          console.log(`Adding mock vulnerability data for ${pkg.name}`)
          pkg.osv_vulnerabilities = mockVulnerabilityData[pkg.name].osv_vulnerabilities
        }
      })
    }
    
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
 * Get user's watchlist from the backend
 */
export const getUserWatchlist = async (userId: string = 'user-123'): Promise<any[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/watchlist?userId=${userId}`, {
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
  }
): Promise<any> => {
  try {
    console.log('Adding repository to watchlist with config:', config)
    
    const response = await fetch(`${API_PROXY_PATH}/activity/user-watchlist-added`, {
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
    // Use the new backend API to fetch user's watchlist
    const userWatchlist = await getUserWatchlist('user-123')
    
    console.log('Raw user watchlist data:', userWatchlist)
    
    // Transform the backend data to match the frontend WatchlistItem format
    const transformedItems = userWatchlist.map((item: any) => ({
      id: parseInt(item.id) || Math.random(), // Use item.id if available, otherwise generate
      name: item.name,
      version: item.version || 'latest',
      type: 'production' as const, // Default to production for now
      risk: (item.risk_score ? (item.risk_score >= 70 ? 'low' : item.risk_score >= 40 ? 'medium' : 'high') : 'medium') as 'low' | 'medium' | 'high',
      activity: 'medium' as const, // Default to medium for now
      lastUpdate: item.last_updated || new Date().toISOString(),
      cves: 0, // Default to 0 for now
      maintainers: item.contributors || 0,
      stars: item.stars ? item.stars.toString() : '0',
      createdAt: item.added_at,
      updatedAt: item.last_updated
    }))
    
    console.log('Transformed watchlist items:', transformedItems)
    
    return transformedItems
  } catch (error) {
    console.error('Error fetching watchlist items:', error)
    // Return empty array if there's an error, so the UI doesn't break
    return []
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