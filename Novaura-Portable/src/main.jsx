import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initTauriBridge } from './tauri-bridge'

// Initialize Tauri bridge (loads session, restores window state)
initTauriBridge().then((session) => {
  console.log('🚀 Novaura Portable initialized')
  console.log('Session loaded:', session ? 'Yes' : 'No')
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
