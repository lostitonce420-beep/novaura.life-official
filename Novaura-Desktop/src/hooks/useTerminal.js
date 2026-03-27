import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

export function useTerminal() {
  const [output, setOutput] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [exitCode, setExitCode] = useState(null)

  useEffect(() => {
    let unlisten
    
    listen('terminal-output', (event) => {
      const { stream, data } = event.payload
      setOutput(prev => [...prev, { stream, data, timestamp: Date.now() }])
    }).then(fn => {
      unlisten = fn
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  const execute = useCallback(async (cmd, args = [], cwd = null) => {
    setOutput([])
    setIsRunning(true)
    setExitCode(null)

    try {
      if (cwd) {
        // Streaming execution
        await invoke('execute_command_streaming', { cmd, args, cwd })
      } else {
        // Simple execution
        const result = await invoke('execute_command', { cmd, args, cwd })
        if (result.stdout) {
          setOutput(prev => [...prev, { stream: 'stdout', data: result.stdout }])
        }
        if (result.stderr) {
          setOutput(prev => [...prev, { stream: 'stderr', data: result.stderr }])
        }
        setExitCode(result.exit_code)
        setIsRunning(false)
      }
    } catch (err) {
      setOutput(prev => [...prev, { stream: 'stderr', data: err.message }])
      setIsRunning(false)
    }
  }, [])

  const clear = useCallback(() => {
    setOutput([])
    setExitCode(null)
  }, [])

  return {
    output,
    isRunning,
    exitCode,
    execute,
    clear
  }
}
