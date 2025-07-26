import { Package, WatchlistItem } from './types'

/**
 * Format numbers with appropriate suffixes (k, M, etc.)
 */
export const formatNumber = (num?: number): string => {
  if (!num) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

/**
 * Format date strings to human-readable format
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 1) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  } catch {
    return 'Unknown'
  }
}

/**
 * Analyze package activity level based on last update
 */
export const analyzeActivity = (lastUpdated?: string): WatchlistItem['activity'] => {
  if (!lastUpdated) return 'low'
  
  const date = new Date(lastUpdated)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays <= 30) return 'high'
  if (diffInDays <= 90) return 'medium'
  return 'low'
}

/**
 * Analyze package risk level based on various factors
 */
export const analyzeRisk = (pkg: Package): WatchlistItem['risk'] => {
  let riskScore = 0
  
  // Age factor (newer packages are riskier)
  if (pkg.last_updated) {
    const date = new Date(pkg.last_updated)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays > 365) riskScore += 2 // Old package
    else if (diffInDays > 180) riskScore += 1
  }
  
  // Popularity factor (less popular packages are riskier)
  const stars = pkg.stars || 0
  if (stars < 100) riskScore += 2
  else if (stars < 1000) riskScore += 1
  
  // Maintenance factor (fewer maintainers = riskier)
  const maintainerCount = pkg.maintainers?.length || 0
  if (maintainerCount === 0) riskScore += 2
  else if (maintainerCount === 1) riskScore += 1
  
  // Convert score to risk level
  if (riskScore >= 4) return 'high'
  if (riskScore >= 2) return 'medium'
  return 'low'
}

/**
 * Transform Package to WatchlistItem
 */
export const packageToWatchlistItem = (
  pkg: Package, 
  id: string, 
  type: WatchlistItem['type'] = 'production'
): WatchlistItem => {
  return {
    id,
    name: pkg.name,
    version: pkg.version || 'latest',
    type,
    risk: analyzeRisk(pkg),
    activity: analyzeActivity(pkg.last_updated),
    lastUpdate: formatDate(pkg.last_updated),
    cves: 0, // Would need additional API call to get CVE data
    maintainers: pkg.maintainers?.length || 0,
    stars: formatNumber(pkg.stars),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Deduplicate packages by name (keep first occurrence)
 */
export const deduplicatePackages = (packages: Package[]): Package[] => {
  const seen = new Set<string>()
  return packages.filter(pkg => {
    if (seen.has(pkg.name)) {
      return false
    }
    seen.add(pkg.name)
    return true
  })
}

/**
 * Generate next available ID for watchlist items
 * Note: This is now deprecated since we use UUIDs from the backend
 */
export const getNextId = (items: WatchlistItem[]): string => {
  // Generate a simple timestamp-based ID for local use
  return Date.now().toString()
}

/**
 * Filter watchlist items by type
 */
export const filterByType = (
  items: WatchlistItem[], 
  type: WatchlistItem['type']
): WatchlistItem[] => {
  return items.filter(item => item.type === type)
}

/**
 * Sort watchlist items by various criteria
 */
export const sortWatchlistItems = (
  items: WatchlistItem[],
  sortBy: 'name' | 'risk' | 'activity' | 'lastUpdate' = 'name',
  order: 'asc' | 'desc' = 'asc'
): WatchlistItem[] => {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'risk':
        const riskOrder = { low: 1, medium: 2, high: 3 }
        comparison = riskOrder[a.risk] - riskOrder[b.risk]
        break
      case 'activity':
        const activityOrder = { low: 1, medium: 2, high: 3 }
        comparison = activityOrder[a.activity] - activityOrder[b.activity]
        break
      case 'lastUpdate':
        comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime()
        break
    }
    
    return order === 'desc' ? -comparison : comparison
  })
  
  return sorted
} 