import { useState, useCallback, useRef, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

export function useStreamingAI() {
  const [response, setResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const unlistenRef = useRef(null)

  useEffect(() => {
    // Set up event listener for streaming responses
    let unlisten
    listen('ollama-stream', (event) => {
      const { chunk, done } = event.payload
      setResponse(prev => prev + chunk)
      if (done) {
        setIsStreaming(false)
      }
    }).then(fn => {
      unlisten = fn
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  const generate = useCallback(async (model, prompt, system = null) => {
    setResponse('')
    setIsStreaming(true)
    setError(null)

    try {
      await invoke('ollama_generate_stream', {
        model,
        prompt,
        system
      })
    } catch (err) {
      setError(err.message)
      setIsStreaming(false)
    }
  }, [])

  const stop = useCallback(() => {
    setIsStreaming(false)
    // Note: Stopping would require additional backend implementation
  }, [])

  const clear = useCallback(() => {
    setResponse('')
    setError(null)
  }, [])

  return {
    response,
    isStreaming,
    error,
    generate,
    stop,
    clear
  }
}
