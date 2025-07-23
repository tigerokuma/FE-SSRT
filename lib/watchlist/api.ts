import { WatchlistItem } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
/**
 * Add a package to the watchlist (new API contract)
 */
export const addToWatchlist = async (
  user_id: string,
  name: string,
  note?: string,
  alertsEnabled: boolean = false
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id, name, note, alertsEnabled }),
    })
    if (!response.ok) {
      throw new Error(`Failed to add to watchlist: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    throw new Error('Failed to add package to watchlist. Please try again.')
  }
}

/**
 * Get user's watchlist from the backend (new API contract)
 */
export const getUserWatchlist = async (user_id: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist?user_id=${user_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching user watchlist:', error)
    throw error
  }
}

/**
 * Remove a package from the watchlist (new API contract)
 */
export const removeFromWatchlist = async (id: string, user_id: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id }),
    })
    if (!response.ok) {
      throw new Error(`Failed to remove from watchlist: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    throw new Error('Failed to remove package from watchlist. Please try again.')
  }
}

/**
 * Update a watchlist item (new API contract)
 */
export const updateWatchlistItem = async (
  id: string,
  user_id: string,
  updates: { note?: string; alertsEnabled?: boolean }
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/watchlist/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id, ...updates }),
    })
    if (!response.ok) {
      throw new Error(`Failed to update watchlist item: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error updating watchlist item:', error)
    throw new Error('Failed to update watchlist item. Please try again.')
  }
}

/**
 * Fetch all watchlist items for a user (new API contract)
 */
export const fetchWatchlistItems = async (user_id: string): Promise<WatchlistItem[]> => {
  try {
    const items = await getUserWatchlist(user_id)
    // Transform the backend data to match the frontend WatchlistItem type
    return items.map((item: any) => ({
      id: parseInt(item.id) || Math.random(),
      name: item.watchlist?.package?.package_name || '',
      version: 'latest',
      type: 'production',
      risk: 'medium',
      activity: 'medium',
      lastUpdate: item.added_at || item.created_at || new Date().toISOString(),
      cves: 0,
      maintainers: 0,
      stars: '0',
      createdAt: item.created_at,
      updatedAt: item.added_at,
    }))
  } catch (error) {
    console.error('Error fetching watchlist items:', error)
    return []
  }
} 