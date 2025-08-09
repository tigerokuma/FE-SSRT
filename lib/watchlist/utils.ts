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
  id: number, 
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
 */
export const getNextId = (items: WatchlistItem[]): number => {
  if (items.length === 0) return 1
  return Math.max(...items.map(item => item.id)) + 1
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
  sortBy: 'name' | 'risk' | 'activity' | 'lastUpdate' | 'vulnerabilities' = 'name',
  order: 'asc' | 'desc' = 'asc'
): WatchlistItem[] => {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'risk':
        const riskOrder = { low: 0, medium: 1, high: 2 }
        comparison = riskOrder[a.risk] - riskOrder[b.risk]
        break
      case 'activity':
        const activityOrder = { low: 0, medium: 1, high: 2 }
        comparison = activityOrder[a.activity] - activityOrder[b.activity]
        break
      case 'lastUpdate':
        comparison = new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime()
        break
      case 'vulnerabilities':
        const aVulnCount = getVulnerabilityCount(a.vulnerabilities)
        const bVulnCount = getVulnerabilityCount(b.vulnerabilities)
        comparison = aVulnCount - bVulnCount
        break
      default:
        comparison = a.name.localeCompare(b.name)
    }

    return order === 'asc' ? comparison : -comparison
  })

  return sorted
} 

// Vulnerability utilities
export function parseCvssSeverity(cvssString?: string): {
  level: 'critical' | 'high' | 'medium' | 'low' | 'unknown'
  score: number
  color: string
  icon: string
} {
  if (!cvssString) {
    return { level: 'unknown', score: 0, color: 'gray', icon: '❓' }
  }

  // Extract CVSS score from string like "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
  const scoreMatch = cvssString.match(/CVSS:3\.\d+\/.*\/C:([HMLN])\/I:([HMLN])\/A:([HMLN])/)
  if (!scoreMatch) {
    return { level: 'unknown', score: 0, color: 'gray', icon: '❓' }
  }

  // Convert CVSS metrics to numeric scores
  const metricScores = { H: 0.56, M: 0.45, L: 0.77, N: 0 }
  const confidentiality = metricScores[scoreMatch[1] as keyof typeof metricScores] || 0
  const integrity = metricScores[scoreMatch[2] as keyof typeof metricScores] || 0
  const availability = metricScores[scoreMatch[3] as keyof typeof metricScores] || 0

  // Calculate base score (simplified)
  const baseScore = Math.round((confidentiality + integrity + availability) * 10)

  // Determine severity level
  let level: 'critical' | 'high' | 'medium' | 'low' | 'unknown'
  let color: string
  let icon: string

  if (baseScore >= 9.0) {
    level = 'critical'
    color = 'red'
    icon = '🔴'
  } else if (baseScore >= 7.0) {
    level = 'high'
    color = 'orange'
    icon = '🟠'
  } else if (baseScore >= 4.0) {
    level = 'medium'
    color = 'yellow'
    icon = '🟡'
  } else if (baseScore >= 0.1) {
    level = 'low'
    color = 'green'
    icon = '🟢'
  } else {
    level = 'unknown'
    color = 'gray'
    icon = '❓'
  }

  return { level, score: baseScore, color, icon }
}

export function getVulnerabilityCount(vulnerabilities?: any[]): number {
  return vulnerabilities?.length || 0
}

export function hasVulnerabilities(vulnerabilities?: any[]): boolean {
  return getVulnerabilityCount(vulnerabilities) > 0
}

export function hasActiveVulnerabilities(vulnerabilities?: any[]): boolean {
  if (!vulnerabilities || vulnerabilities.length === 0) {
    return false
  }
  // Only count unpatched vulnerabilities as active threats
  return vulnerabilities.some(vuln => !vuln.is_patched)
}

export function getHighestSeverity(vulnerabilities?: any[]): {
  level: 'critical' | 'high' | 'medium' | 'low' | 'unknown'
  color: string
  icon: string
} {
  if (!vulnerabilities || vulnerabilities.length === 0) {
    return { level: 'unknown', color: 'gray', icon: '❓' }
  }

  const severityLevels = ['critical', 'high', 'medium', 'low'] as const
  const severityColors = { critical: 'red', high: 'orange', medium: 'yellow', low: 'green' }
  const severityIcons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }

  for (const level of severityLevels) {
    const hasLevel = vulnerabilities.some(vuln => {
      const parsed = parseCvssSeverity(vuln.severity)
      return parsed.level === level
    })
    if (hasLevel) {
      return {
        level,
        color: severityColors[level],
        icon: severityIcons[level]
      }
    }
  }

  return { level: 'unknown', color: 'gray', icon: '❓' }
} 