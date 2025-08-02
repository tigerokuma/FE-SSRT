// Package types from the new API contract
export interface Package {
  name: string
  description?: string
  version?: string
  downloads?: number
  stars?: number
  license?: string
  keywords?: string[]
  maintainers?: string[]
  last_updated?: string
  // Additional fields available in details view
  package_id?: string
  published?: string
  published_at?: string
  forks?: number
  repo_url?: string
  repo_name?: string
  contributors?: number
  risk_score?: number
  npm_url?: string
  homepage?: string
}

// API Result types for better error handling
export type ApiResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
  errorType: 'network' | 'not_found' | 'server_error' | 'unknown'
}

// Internal watchlist item representation
export interface WatchlistItem {
  id: string
  watchlist_id?: string // Backend watchlist ID for status checking
  name: string
  version: string
  type: 'production' | 'development' | 'peer' | 'optional'
  risk: 'low' | 'medium' | 'high'
  activity: 'low' | 'medium' | 'high'
  lastUpdate: string
  cves: number
  maintainers: number
  stars: string
  createdAt?: string
  updatedAt?: string
  // Additional fields from backend
  repo_url?: string
  description?: string
  downloads?: number
  forks?: number
  contributors?: number
  risk_score?: number
  last_updated?: string
  notes?: string
  alerts?: any
  added_at?: string
  status?: string
  
  // New fields for enhanced card display
  activity_score?: number // 0-100 activity score
  bus_factor?: number // number of key contributors
  health_score?: number // health score from HealthData
  health_trend?: 'improving' | 'declining' | 'stable' // health trend direction
  notification_count?: number // number of new alerts
  tracking_duration?: string // how long been tracking (e.g., "3 months")
  version_status?: 'latest' | 'behind' | 'pre-release' // version status
  is_processing?: boolean // whether package is being analyzed
  
  // Vulnerability data
  vulnerability_summary?: {
    total_count: number
    critical_count: number
    high_count: number
    medium_count: number
    low_count: number
    last_updated: string
  }
}

// Legacy alias for backward compatibility
export type DependencyData = WatchlistItem

// API response types
export interface SearchApiResponse {
  query: string
  results: Package[]
  count: number
  responseTime: string
}

// Watchlist API types
export interface AddToWatchlistRequest {
  package: Package
  type?: WatchlistItem['type']
}

export interface WatchlistApiResponse {
  success: boolean
  data?: WatchlistItem
  error?: string
}

// Hook state types
export interface UseWatchlistState {
  items: WatchlistItem[]
  isLoading: boolean
  isAdding: boolean
  error: string | null
}

// Watchlist operations
export interface WatchlistOperations {
  addItem: (pkg: Package, type?: WatchlistItem['type']) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateItem: (id: string, updates: Partial<WatchlistItem>) => Promise<void>
  refreshItems: () => Promise<void>
  clearError: () => void
} 