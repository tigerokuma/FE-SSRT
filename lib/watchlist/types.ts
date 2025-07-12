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

// Internal watchlist item representation
export interface WatchlistItem {
  id: number
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
  removeItem: (id: number) => Promise<void>
  updateItem: (id: number, updates: Partial<WatchlistItem>) => Promise<void>
  refreshItems: () => Promise<void>
  clearError: () => void
} 