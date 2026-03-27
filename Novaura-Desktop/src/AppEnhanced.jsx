import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { useSystemResources, formatBytes, formatPercent } from './hooks/useSystemResources'
import { useStreamingAI } from './hooks/useStreamingAI'
import { useFileWatcher } from './hooks/useFileWatcher'
import { useTerminal } from './hooks/useTerminal'

// Enhanced Desktop shell for Novaura Web OS
function App() {
  const [systemInfo, setSystemInfo] = useState(null)
  const [ollamaStatus, setOllamaStatus] = useState('checking')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [notifications, setNotifications] = useState([])

  // Enhanced hooks
  const { resources } = useSystemResources(3000)
  const { response: aiResponse, isStreaming, generate: generateAI, clear: clearAI } = useStreamingAI()
  const { changes, isWatching, startWatching, stopWatching, clearChanges } = useFileWatcher()
  const { output: terminalOutput, isRunning, execute: executeTerminal, clear: clearTerminal } = useTerminal()

  useEffect(() => {
    initializeApp()
    
    // Listen for tray actions
    listen('tray-action', (event) => {
      const action = event.payload
      if (action === 'new_project') {
        createNewProject()
      } else if (action === 'open_chat') {
        setActiveTab('ai')
      }
    })
  }, [])

  const initializeApp = async () => {
    try {
      const info = await invoke('get_system_info')
      setSystemInfo(info)

      const ollamaRunning = await invoke('check_ollama_status')
      setOllamaStatus(ollamaRunning ? 'running' : 'not_running')
    } catch (error) {
      console.error('Initialization error:', error)
    }
  }

  const createNewProject = async () => {
    try {
      const appDir = await invoke('get_app_data_dir')
      const projectName = `Project_${Date.now()}`
      const projectPath = `${appDir}/projects/${projectName}`
      
      await invoke('create_directory', { path: projectPath })
      await invoke('store_engram', {
        content: `Created new project: ${projectName}`,
        category: 'event',
        tags: ['project', 'created'],
        context: 'desktop_shell',
        confidence: 1.0
      })
      
      addNotification('Project Created', `Created: ${projectName}`)
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const addNotification = (title, message) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, title, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const runAI = () => {
    clearAI()
    generateAI('llama3.1', 'Explain quantum computing in simple terms', 'You are a helpful assistant.')
  }

  const runTerminal = () => {
    clearTerminal()
    executeTerminal('echo', ['Hello from Novaura Desktop!'], null)
  }

  return (
    <div className="desktop-shell">
      {/* Notifications */}
      <div className="notifications">
        {notifications.map(n => (
          <div key={n.id} className="notification">
            <strong>{n.title}</strong>
            <p>{n.message}</p>
          </div>
        ))}
      </div>

      {/* Titlebar */}
      <div className="titlebar">
        <div className="titlebar-title">
          ⚡ Novaura Desktop {systemInfo?.app_version}
          {resources && (
            <span className="resource-mini">
              CPU: {formatPercent(resources.cpu_usage)} | 
              RAM: {formatPercent(resources.memory_percent)}
            </span>
          )}
        </div>
        <div className="titlebar-controls">
          <button className="titlebar-btn minimize" />
          <button className="titlebar-btn maximize" />
          <button className="titlebar-btn close" />
        </div>
      </div>

      {/* Main Content */}
      <div className="desktop-content">
        {/* Sidebar */}
        <div className="sidebar">
          <SidebarIcon icon="📊" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarIcon icon="🤖" label="AI Chat" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          <SidebarIcon icon="⌨️" label="Terminal" active={activeTab === 'terminal'} onClick={() => setActiveTab('terminal')} />
          <SidebarIcon icon="👁️" label="File Watch" active={activeTab === 'watcher'} onClick={() => setActiveTab('watcher')} />
          <SidebarIcon icon="💾" label="Resources" active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
          <SidebarIcon icon="⚙️" label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        {/* Main Area */}
        <div className="main-area">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="tab-content">
              <h1 className="welcome-title">Novaura Desktop ⚡</h1>
              <p className="welcome-subtitle">
                {systemInfo 
                  ? `Running on ${systemInfo.os} (${systemInfo.arch})`
                  : 'Loading...'
                }
              </p>

              <div className="quick-actions">
                <button className="quick-action-btn primary" onClick={createNewProject}>
                  + New Project
                </button>
                <button className="quick-action-btn" onClick={() => setActiveTab('ai')}>
                  🤖 AI Chat
                </button>
                <button className="quick-action-btn" onClick={() => setActiveTab('terminal')}>
                  ⌨️ Terminal
                </button>
              </div>

              <div className={`ollama-status ${ollamaStatus}`}>
                {ollamaStatus === 'checking' && '🔍 Checking local AI...'}
                {ollamaStatus === 'running' && '🟢 Local AI (Ollama) Ready'}
                {ollamaStatus === 'not_running' && '⚪ Install Ollama for offline AI'}
              </div>

              <EngramStats />
            </div>
          )}

          {/* AI Chat Tab */}
          {activeTab === 'ai' && (
            <div className="tab-content">
              <h2>🤖 AI Chat (Streaming)</h2>
              <div className="ai-controls">
                <button onClick={runAI} disabled={isStreaming} className="btn-primary">
                  {isStreaming ? 'Generating...' : 'Run Test Prompt'}
                </button>
                <button onClick={clearAI} className="btn-secondary">Clear</button>
              </div>
              <div className="ai-response">
                {aiResponse || 'Click "Run Test Prompt" to see streaming AI in action...'}
                {isStreaming && <span className="cursor">▊</span>}
              </div>
            </div>
          )}

          {/* Terminal Tab */}
          {activeTab === 'terminal' && (
            <div className="tab-content">
              <h2>⌨️ Terminal</h2>
              <div className="terminal-controls">
                <button onClick={runTerminal} disabled={isRunning} className="btn-primary">
                  Run Test Command
                </button>
                <button onClick={clearTerminal} className="btn-secondary">Clear</button>
              </div>
              <div className="terminal-output">
                {terminalOutput.length === 0 ? (
                  <span className="terminal-placeholder">Terminal ready...</span>
                ) : (
                  terminalOutput.map((line, i) => (
                    <div key={i} className={`terminal-line ${line.stream}`}>
                      <span className="terminal-prompt">{line.stream === 'stdout' ? '>' : '!'}</span>
                      {line.data}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* File Watcher Tab */}
          {activeTab === 'watcher' && (
            <div className="tab-content">
              <h2>👁️ File Watcher</h2>
              <div className="watcher-controls">
                <button 
                  onClick={() => startWatching('z:\\Novaura platform')} 
                  disabled={isWatching}
                  className="btn-primary"
                >
                  Start Watching
                </button>
                <button onClick={stopWatching} disabled={!isWatching} className="btn-secondary">
                  Stop
                </button>
                <button onClick={clearChanges} className="btn-secondary">Clear</button>
              </div>
              <div className="watcher-status">
                Status: {isWatching ? '🟢 Watching' : '⚪ Stopped'}
              </div>
              <div className="watcher-changes">
                {changes.length === 0 ? (
                  <span className="watcher-placeholder">No file changes detected...</span>
                ) : (
                  changes.slice().reverse().map((change, i) => (
                    <div key={i} className={`watcher-change ${change.kind}`}>
                      <span className="change-kind">{change.kind.toUpperCase()}</span>
                      <span className="change-path">{change.path}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="tab-content">
              <h2>💾 System Resources</h2>
              {resources ? (
                <div className="resources-grid">
                  <ResourceCard 
                    title="CPU Usage" 
                    value={formatPercent(resources.cpu_usage)}
                    percent={resources.cpu_usage}
                    color="#00d9ff"
                  />
                  <ResourceCard 
                    title="Memory" 
                    value={`${formatBytes(resources.memory_used)} / ${formatBytes(resources.memory_total)}`}
                    percent={resources.memory_percent}
                    color="#a855f7"
                  />
                  <ResourceCard 
                    title="Disk" 
                    value={`${formatBytes(resources.disk_used)} / ${formatBytes(resources.disk_total)}`}
                    percent={resources.disk_percent}
                    color="#10b981"
                  />
                </div>
              ) : (
                <div className="loading">Loading system resources...</div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-content">
              <h2>⚙️ Settings</h2>
              <div className="settings-list">
                <div className="setting-item">
                  <span>App Version</span>
                  <span>{systemInfo?.app_version || '--'}</span>
                </div>
                <div className="setting-item">
                  <span>OS</span>
                  <span>{systemInfo?.os || '--'}</span>
                </div>
                <div className="setting-item">
                  <span>Architecture</span>
                  <span>{systemInfo?.arch || '--'}</span>
                </div>
                <div className="setting-item">
                  <span>Ollama Status</span>
                  <span className={ollamaStatus}>{ollamaStatus === 'running' ? '✅ Running' : '❌ Not Running'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-indicator online"></span>
          <span>Ready</span>
        </div>
        <div className="status-item">
          {resources && (
            <>💾 {formatPercent(resources.memory_percent)} | 🔥 {formatPercent(resources.cpu_usage)}</>
          )}
        </div>
        <div className="status-item">
          {systemInfo?.os || '--'}
        </div>
      </div>

      <style>{`
        .desktop-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0a0a0f;
          color: #f4f6ff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        .notifications {
          position: fixed;
          top: 40px;
          right: 16px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .notification {
          background: rgba(76, 101, 255, 0.95);
          padding: 12px 16px;
          border-radius: 8px;
          min-width: 250px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .titlebar {
          height: 32px;
          background: rgba(15, 17, 26, 0.95);
          border-bottom: 1px solid #1e2130;
          display: flex;
          align-items: center;
          padding: 0 16px;
          -webkit-app-region: drag;
        }

        .titlebar-title {
          font-size: 13px;
          font-weight: 600;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .resource-mini {
          font-size: 11px;
          color: #6b7280;
          font-weight: 400;
        }

        .titlebar-controls {
          display: flex;
          gap: 8px;
          -webkit-app-region: no-drag;
        }

        .titlebar-btn {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }

        .titlebar-btn.close { background: #ff5f56; }
        .titlebar-btn.minimize { background: #ffbd2e; }
        .titlebar-btn.maximize { background: #27c93f; }

        .desktop-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .sidebar {
          width: 60px;
          background: rgba(10, 12, 20, 0.95);
          border-right: 1px solid #1e2130;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0;
          gap: 8px;
        }

        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: auto;
        }

        .tab-content {
          flex: 1;
          padding: 32px;
          overflow: auto;
        }

        .welcome-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #00d9ff, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 8px 0;
        }

        .welcome-subtitle {
          color: #a7b0c8;
          font-size: 1rem;
          margin: 0 0 24px 0;
        }

        .quick-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .quick-action-btn {
          padding: 10px 20px;
          background: rgba(76, 101, 255, 0.1);
          border: 1px solid rgba(76, 101, 255, 0.3);
          border-radius: 8px;
          color: #f4f6ff;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .quick-action-btn.primary {
          background: linear-gradient(135deg, #4c65ff, #7b8fff);
          border: none;
        }

        .quick-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(76, 101, 255, 0.3);
        }

        .btn-primary {
          padding: 8px 16px;
          background: linear-gradient(135deg, #4c65ff, #7b8fff);
          border: none;
          border-radius: 6px;
          color: #fff;
          cursor: pointer;
          font-size: 13px;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: #f4f6ff;
          cursor: pointer;
          font-size: 13px;
        }

        .ollama-status {
          font-size: 14px;
          padding: 8px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .ollama-status.running {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .ollama-status.not_running {
          color: #6b7280;
          background: rgba(107, 114, 128, 0.1);
        }

        .ai-controls, .terminal-controls, .watcher-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .ai-response {
          background: rgba(0, 0, 0, 0.3);
          padding: 16px;
          border-radius: 8px;
          min-height: 200px;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.6;
        }

        .cursor {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .terminal-output {
          background: #000;
          padding: 16px;
          border-radius: 8px;
          min-height: 300px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          overflow-y: auto;
        }

        .terminal-placeholder {
          color: #6b7280;
        }

        .terminal-line {
          margin: 2px 0;
        }

        .terminal-line.stdout { color: #f4f6ff; }
        .terminal-line.stderr { color: #ff6b6b; }

        .terminal-prompt {
          color: #4c65ff;
          margin-right: 8px;
        }

        .watcher-status {
          margin-bottom: 16px;
          font-size: 14px;
        }

        .watcher-changes {
          background: rgba(0, 0, 0, 0.2);
          padding: 16px;
          border-radius: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .watcher-placeholder {
          color: #6b7280;
        }

        .watcher-change {
          display: flex;
          gap: 12px;
          padding: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 12px;
        }

        .change-kind {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .watcher-change.create .change-kind { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .watcher-change.modify .change-kind { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
        .watcher-change.delete .change-kind { background: rgba(255, 107, 107, 0.2); color: #ff6b6b; }

        .change-path {
          color: #a7b0c8;
          font-family: monospace;
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .resource-card {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .resource-title {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .resource-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .resource-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .resource-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .settings-list {
          max-width: 400px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .setting-item span:first-child {
          color: #6b7280;
        }

        .status-bar {
          height: 28px;
          background: rgba(15, 17, 26, 0.95);
          border-top: 1px solid #1e2130;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          font-size: 12px;
          color: #6b7280;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .loading {
          color: #6b7280;
          text-align: center;
          padding: 40px;
        }
      `}</style>
    </div>
  )
}

// Sidebar Icon Component
function SidebarIcon({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`sidebar-icon ${active ? 'active' : ''}`}
      title={label}
    >
      {icon}
      <style>{`
        .sidebar-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: ${active ? 'linear-gradient(135deg, #4c65ff, #7b8fff)' : 'rgba(255, 255, 255, 0.05)'};
          border: none;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          alignItems: center;
          justifyContent: center;
          transition: all 0.2s;
        }
        
        .sidebar-icon:hover {
          transform: scale(1.05);
          background: ${active ? 'linear-gradient(135deg, #4c65ff, #7b8fff)' : 'rgba(76, 101, 255, 0.2)'};
        }
      `}</style>
    </button>
  )
}

// Resource Card Component
function ResourceCard({ title, value, percent, color }) {
  return (
    <div className="resource-card">
      <div className="resource-title">{title}</div>
      <div className="resource-value" style={{ color }}>{value}</div>
      <div className="resource-bar">
        <div 
          className="resource-bar-fill" 
          style={{ width: `${Math.min(percent, 100)}%`, background: color }}
        />
      </div>
    </div>
  )
}

// Engram Stats Component
function EngramStats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const stats = await invoke('get_engram_stats')
      setStats(stats)
    } catch (error) {
      console.error('Error loading engram stats:', error)
    }
  }

  if (!stats) return null

  return (
    <div style={{
      marginTop: '32px',
      padding: '16px 24px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
        Memory Engrams Stored
      </div>
      <div style={{ fontSize: '32px', fontWeight: '700', color: '#00d9ff' }}>
        {stats.total}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        {stats.by_category.map(([cat, count]) => (
          <span key={cat} style={{ margin: '0 8px' }}>
            {cat}: {count}
          </span>
        ))}
      </div>
    </div>
  )
}

export default App
