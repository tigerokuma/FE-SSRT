// Package types from the new API contract
export interface OsvVulnerability {
  id: string                    // Unique vulnerability identifier (e.g., "GHSA-mh6f-8j2x-4483")
  summary: string               // Human-readable summary
  severity?: string             // CVSS score and type (e.g., "CVSS_V3: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")
  details?: string              // Detailed description with markdown
  affected_versions?: string[]  // Version ranges affected (e.g., ["3.3.6", "4.0.0", "0"])
  // NEW: Enhanced version information
  fixed_versions?: string[]     // Versions where vulnerability is fixed
  introduced_versions?: string[] // Versions where vulnerability was introduced
  last_affected_versions?: string[] // Last versions affected
  // NEW: Patch status tracking
  is_patched?: boolean          // Whether vulnerability is patched
  patch_age_days?: number       // Days since patch was released
  // NEW: Timing information
  published?: string            // When vulnerability was first published (ISO date)
  modified?: string             // When vulnerability was last updated (ISO date)
  references?: {                // External links
    type: string                // "WEB", "ADVISORY", "PACKAGE", etc.
    url: string                 // URL to the reference
  }[]
}

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
  // NEW FIELD: OSV vulnerabilities
  osv_vulnerabilities?: OsvVulnerability[]
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
  // OSV vulnerabilities data
  vulnerabilities?: OsvVulnerability[]
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