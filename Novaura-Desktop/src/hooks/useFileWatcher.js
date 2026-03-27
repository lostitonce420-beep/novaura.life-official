import { useEffect, useCallback, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

export function useFileWatcher() {
  const [changes, setChanges] = useState([])
  const [isWatching, setIsWatching] = useState(false)

  useEffect(() => {
    let unlisten
    
    listen('file-change', (event) => {
      const { path, kind } = event.payload
      setChanges(prev => [...prev.slice(-49), { path, kind, timestamp: Date.now() }])
    }).then(fn => {
      unlisten = fn
    })

    return () => {
      if (unlisten) unlisten()
      stopWatching()
    }
  }, [])

  const startWatching = useCallback(async (path) => {
    try {
      await invoke('start_file_watching', { path })
      setIsWatching(true)
    } catch (err) {
      console.error('Failed to start file watching:', err)
    }
  }, [])

  const stopWatching = useCallback(async () => {
    try {
      await invoke('stop_file_watching')
      setIsWatching(false)
    } catch (err) {
      console.error('Failed to stop file watching:', err)
    }
  }, [])

  const clearChanges = useCallback(() => {
    setChanges([])
  }, [])

  return {
    changes,
    isWatching,
    startWatching,
    stopWatching,
    clearChanges
  }
}
