export interface AlertTriggered {
  id: string
  user_watchlist_id: string
  watchlist_id: string
  commit_sha: string
  contributor: string
  metric: string
  value: number
  alert_level: string
  threshold_type: string
  threshold_value: number
  description: string
  details_json?: any
  created_at: string
  acknowledged_at?: string
  resolved_at?: string
  watchlist?: {
    package: {
      repo_name: string
      repo_url: string
    }
  }
}

export interface AlertsResponse {
  alerts: AlertTriggered[]
  count: number
  userWatchlistId: string
}

export class AlertsAPI {
  private baseUrl = '/api/backend'

  async getAlerts(userWatchlistId: string): Promise<AlertsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/activity/alerts/${userWatchlistId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching alerts:', error)
      throw error
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/activity/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      throw error
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/activity/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to resolve alert: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
      throw error
    }
  }
}

export const alertsAPI = new AlertsAPI() 