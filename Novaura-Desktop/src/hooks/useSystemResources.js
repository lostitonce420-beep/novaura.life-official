import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

export function useSystemResources(pollInterval = 5000) {
  const [resources, setResources] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchResources = useCallback(async () => {
    try {
      const data = await invoke('get_resources')
      setResources(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResources()
    const interval = setInterval(fetchResources, pollInterval)
    return () => clearInterval(interval)
  }, [fetchResources, pollInterval])

  return { resources, loading, error, refresh: fetchResources }
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatPercent(value) {
  return (value || 0).toFixed(1) + '%'
}
