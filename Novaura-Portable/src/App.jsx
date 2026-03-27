import React, { useEffect, useState } from 'react'
import { getAppDirectory, getStorageStats } from './tauri-bridge'

/**
 * Novaura Portable App
 * 
 * This is the entry point that loads the Web OS with native capabilities.
 * It wraps the web-based OS with local storage, session persistence,
 * and native file system access.
 */
function App() {
  const [ready, setReady] = useState(false)
  const [appDir, setAppDir] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    // Initialize the app
    async function init() {
      try {
        // Get app directory
        const dir = await getAppDirectory()
        setAppDir(dir)

        // Get storage stats
        const s = await getStorageStats()
        setStats(s)

        setReady(true)
      } catch (error) {
        console.error('Failed to initialize:', error)
      }
    }

    init()
  }, [])

  if (!ready) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a1628 100%)',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 200,
          letterSpacing: '8px',
          background: 'linear-gradient(135deg, #00d9ff, #a855f7, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          NOVAURA
        </div>
        <div style={{
          fontSize: '14px',
          color: '#666',
          letterSpacing: '2px'
        }}>
          INITIALIZING LOCAL ENVIRONMENT
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Custom Titlebar */}
      <div data-tauri-drag-region style={{
        height: '32px',
        background: 'rgba(15, 15, 20, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        WebkitAppRegion: 'drag'
      }}>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 500,
          background: 'linear-gradient(135deg, #00d9ff, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          NOVAURA PORTABLE
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          Local Mode
        </div>
      </div>

      {/* Main Content - This would load the Web OS */}
      <div style={{
        height: 'calc(100vh - 32px)',
        display: 'flex'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '60px',
          background: 'rgba(15, 15, 20, 0.8)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: '12px'
        }}>
          <NavIcon icon="🖥️" label="Desktop" />
          <NavIcon icon="💬" label="AI" />
          <NavIcon icon="📁" label="Files" />
          <NavIcon icon="⚙️" label="Settings" />
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '32px',
          overflow: 'auto'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 200,
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #fff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Welcome to Novaura Portable
          </h1>
          <p style={{ color: '#666', marginBottom: '32px' }}>
            Your offline-first development environment
          </p>

          {/* Storage Info */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#fff' }}>
              Storage Stats
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <Stat label="Projects" value={stats?.total_projects || 0} />
              <Stat label="Open Projects" value={stats?.open_projects || 0} />
              <Stat label="Snapshots" value={stats?.total_snapshots || 0} />
              <Stat label="Storage Used" value={`${(stats?.storage_used_mb || 0).toFixed(1)} MB`} />
            </div>
          </div>

          {/* App Directory */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#fff' }}>
              Data Directory
            </h2>
            <code style={{
              display: 'block',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#00d9ff',
              wordBreak: 'break-all'
            }}>
              {appDir}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavIcon({ icon, label }) {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '20px'
    }} onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)'
    }} onMouseLeave={e => {
      e.currentTarget.style.background = 'transparent'
    }} title={label}>
      {icon}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 300, color: '#fff' }}>{value}</div>
    </div>
  )
}

export default App
