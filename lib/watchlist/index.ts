// Main export file for the watchlist module
// This provides a clean @/watchlist import path for the entire module

// Types
export type {
  Package,
  WatchlistItem,
  DependencyData, // Legacy alias
  SearchApiResponse,
  AddToWatchlistRequest,
  WatchlistApiResponse,
  UseWatchlistState,
  WatchlistOperations,
} from './types'

// Utilities
export {
  formatNumber,
  formatDate,
  analyzeActivity,
  analyzeRisk,
  packageToWatchlistItem,
  deduplicatePackages,
  getNextId,
  filterByType,
  sortWatchlistItems,
} from './utils'

// API Functions
export {
  searchPackages,
  getPackageDetails,
  getPackageDetailsWithFull,
  getPackageForUseCase,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  fetchWatchlistItems,
  refreshPackageData,
  searchAndEnrichPackages,
  batchEnrichPackages,
  getPackageDetailsSafe,
} from './api'

// Hooks
export {
  useWatchlist,
  usePackageSearch,
} from './useWatchlist'

// UI Components
export * from '../../components/watchlist'

// Re-export everything for convenience
export * from './types'
export * from './utils'
export * from './api'
export * from './useWatchlist'
export * from '../../components/watchlist' 