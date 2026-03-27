import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Import Tauri API
import { invoke } from '@tauri-apps/api/tauri'

// Make invoke available globally for Web OS integration
window.__TAURI_INVOKE__ = invoke

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
