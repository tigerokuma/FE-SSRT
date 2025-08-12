import { useState, useEffect } from 'react'
import { alertsAPI, AlertTriggered, AlertsResponse } from './api'

export interface UseAlertsOptions {
  userWatchlistId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseAlertsReturn {
  alerts: AlertTriggered[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  acknowledgeAlert: (alertId: string) => Promise<void>
  resolveAlert: (alertId: string) => Promise<void>
}

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const { userWatchlistId, autoRefresh = false, refreshInterval = 30000 } = options
  
  const [alerts, setAlerts] = useState<AlertTriggered[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    if (!userWatchlistId) {
      setAlerts([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response: AlertsResponse = await alertsAPI.getAlerts(userWatchlistId)
      setAlerts(response.alerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await alertsAPI.acknowledgeAlert(alertId)
      // Update the alert in the local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged_at: new Date().toISOString() }
          : alert
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert')
      throw err
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      await alertsAPI.resolveAlert(alertId)
      // Update the alert in the local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved_at: new Date().toISOString() }
          : alert
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert')
      throw err
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchAlerts()
  }, [userWatchlistId])

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !userWatchlistId) return

    const interval = setInterval(fetchAlerts, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, userWatchlistId, refreshInterval])

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
  }
} 