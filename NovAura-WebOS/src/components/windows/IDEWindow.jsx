import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  FolderOpen, Search, Bot, Settings, Play, Eye, EyeOff,
  Terminal, PanelRightClose, PanelRightOpen, PanelBottomClose, PanelBottomOpen,
  Save, FileDown, RotateCcw, Layout, Sparkles, ChevronDown, Users,
  Code2, Columns2, MonitorPlay, Download, Package, GitBranch,
  Bug, Rocket, Zap, Globe, ChevronLeft, ChevronRight,
  Radio, Wifi, MoreHorizontal, Cloud, Shield
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import FileExplorer from './builderbot/FileExplorer';
import AIPanel from './builderbot/AIPanel';
import EditorTabs from './builderbot/EditorTabs';
import TerminalPanel from './builderbot/TerminalPanel';
import PreviewPanel from './builderbot/PreviewPanel';
import StatusBar from './builderbot/StatusBar';
import useBuilderStore from './builderbot/useBuilderStore';
import CollabOverlay from '../CollabOverlay';
import useCollabSession from '../../hooks/useCollabSession';
import { runBuild, isWebProject } from './builderbot/BuildRunner';
import { packageAsDesktopApp, packageAsZip } from './builderbot/ExePackager';

// NEW: Import enhanced features
import GitPanel from './builderbot/GitPanel';
import GitEngine from './builderbot/GitEngine';
import PackageManagerPanel from './builderbot/PackageManagerPanel';
import DebuggerPanel from './builderbot/DebuggerPanel';
import { CodebaseAIEngine } from './builderbot/CodebaseAIEngine';
import { DeployEngine, DEPLOYMENT_TARGETS } from './builderbot/DeployEngine';
import { CollaborationEngine } from './builderbot/CollaborationEngine';
import SwarmPanel from './builderbot/SwarmPanel';

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED ACTIVITY BAR - Omni Builder Supreme
// ═══════════════════════════════════════════════════════════════════════════════

const ACTIVITY_ITEMS = [
  { id: 'explorer', icon: FolderOpen, label: 'Explorer', category: 'core' },
  { id: 'search', icon: Search, label: 'Search', category: 'core' },
  { id: 'git', icon: GitBranch, label: 'Source Control', category: 'core', badge: 'git' },
  { id: 'debug', icon: Bug, label: 'Debug', category: 'core' },
  { id: 'packages', icon: Package, label: 'Packages', category: 'tools' },
  { id: 'deploy', icon: Rocket, label: 'Deploy', category: 'tools' },
  { id: 'ai', icon: Zap, label: 'AI Actions', category: 'ai' },
  { id: 'swarm', icon: Users, label: 'Agent Swarm', category: 'ai' },
  { id: 'collab', icon: Radio, label: 'Collaboration', category: 'collab' },
  { id: 'settings', icon: Settings, label: 'Settings', category: 'core' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// OMNI BUILDER - Main IDE Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function IDEWindow() {
  // ── Store hooks ──────────────────────────────────
  const { 
    sidebarPanel, setSidebarPanel, 
    showTerminal, toggleTerminal, 
    saveAll, projectName, 
    flattenFiles, runProject, 
    addTerminalLine, tree, activeTab,
    setProjectName
  } = useBuilderStore();

  // ── Layout state ─────────────────────────────────
  const [centerMode, setCenterMode] = useState('split'); // 'code' | 'split' | 'preview'
  const [showAI, setShowAI] = useState(true);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showDeployPanel, setShowDeployPanel] = useState(false);

  // ── Refs for containers ─────────────────────────
  const containerRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [aiWidth, setAiWidth] = useState(320);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [debuggerHeight, setDebuggerHeight] = useState(200);

  // ── Git integration ─────────────────────────────
  const [gitEngine, setGitEngine] = useState(null);
  const [gitStatus, setGitStatus] = useState({ modified: 0, added: 0 });
  const [currentBranch, setCurrentBranch] = useState('main');

  // ── Deployment ──────────────────────────────────
  const [deployEngine] = useState(() => new DeployEngine());
  const [deployTargets, setDeployTargets] = useState([]);

  // ── Collaboration ───────────────────────────────
  const [collabEngine, setCollabEngine] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLiveShare, setIsLiveShare] = useState(false);

  // ── Codebase AI ─────────────────────────────────
  const [codebaseAI, setCodebaseAI] = useState(null);
  const [codebaseSummary, setCodebaseSummary] = useState(null);

  // ── Debugger ────────────────────────────────────
  const [isDebugging, setIsDebugging] = useState(false);
  const [breakpoints, setBreakpoints] = useState([]);
  const [debugVariables, setDebugVariables] = useState({
    local: { count: 42, message: 'Hello World', items: [1, 2, 3] },
    global: { config: { debug: true, port: 3000 } }
  });
  const [debugConsole, setDebugConsole] = useState([]);

  // ── Real-time collaboration ─────────────────────
  const userId = useRef(`user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).current;
  const collab = useCollabSession(userId, 'You');

  // ═══════════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    // Initialize Git
    const git = new GitEngine({ 
      dir: '/project',
      author: { name: 'Cybeni User', email: 'user@cybeni.dev' }
    });
    setGitEngine(git);

    // Initialize Codebase AI
    const ai = new CodebaseAIEngine();
    setCodebaseAI(ai);

    // Check if repo exists
    git.isRepo().then(isRepo => {
      if (!isRepo) {
        git.init().then(() => {
          toast.success('Git repository initialized');
        });
      } else {
        updateGitStatus(git);
      }
    });

    // Load deployment targets
    const connected = deployEngine.getConnectedTargets();
    setDeployTargets(connected);

    // Initialize collaboration
    const collabEng = new CollaborationEngine({
      userId: userId,
      userName: 'You',
      sessionId: null
    });
    setCollabEngine(collabEng);

    // Listen for file changes to update git status
    const interval = setInterval(() => {
      if (git) updateGitStatus(git);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update codebase AI when files change
  useEffect(() => {
    if (codebaseAI && tree) {
      const files = flattenFiles();
      codebaseAI.files = files;
      
      // Debounced indexing
      const timeout = setTimeout(() => {
        codebaseAI.indexCodebase().then(() => {
          setCodebaseSummary(codebaseAI.getSummary());
        });
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [tree, activeTab]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // GIT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  const updateGitStatus = async (git) => {
    try {
      const status = await git.getStatus();
      const branch = await git.getCurrentBranch();
      
      setGitStatus({
        modified: status.filter(s => s.status === 'modified').length,
        added: status.filter(s => s.status === 'added').length
      });
      setCurrentBranch(branch);
    } catch (err) {
      // Git not initialized yet
    }
  };

  const handleGitCommit = async (message, files) => {
    if (!gitEngine) return;
    
    try {
      await gitEngine.commit(message, files);
      toast.success('Changes committed');
      updateGitStatus(gitEngine);
    } catch (err) {
      toast.error('Commit failed: ' + err.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEPLOYMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleDeploy = async (targetId) => {
    const files = flattenFiles();
    
    try {
      const deployment = await deployEngine.deploy(files, {
        target: targetId,
        projectName: projectName || 'cybeni-project',
        framework: detectFramework(files)
      });

      toast.success(`Deployed to ${deployment.url}`);
      addTerminalLine({ type: 'info', text: `Deployed: ${deployment.url}` });
    } catch (err) {
      toast.error('Deployment failed: ' + err.message);
    }
  };

  const detectFramework = (files) => {
    const hasFile = (name) => files.some(f => f.name === name);
    
    if (hasFile('next.config.js')) return 'nextjs';
    if (hasFile('vue.config.js')) return 'vue';
    if (hasFile('angular.json')) return 'angular';
    if (hasFile('package.json')) {
      const pkg = files.find(f => f.name === 'package.json');
      if (pkg?.content?.includes('react')) return 'react';
    }
    return 'static';
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // COLLABORATION
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleCreateSession = useCallback(async () => {
    const files = flattenFiles().map(f => ({ 
      path: f.path, 
      name: f.name, 
      content: f.content || '' 
    }));
    await collab.create(projectName || 'Untitled', files);
    setIsLiveShare(true);
    toast.success('Live share session created!');
  }, [collab, projectName, flattenFiles]);

  const startCollaboration = async () => {
    if (!collabEngine) return;
    
    // Generate session ID
    const sessionId = `cybeni-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    
    try {
      await collabEngine.connect(sessionId);
      setIsLiveShare(true);
      toast.success('Collaboration session started');
      
      // Listen for participants
      collabEngine.on('participant-join', (user) => {
        setParticipants(prev => [...prev, user]);
        toast.info(`${user.userName} joined the session`);
      });
      
      collabEngine.on('participant-leave', (user) => {
        setParticipants(prev => prev.filter(p => p.userId !== user.userId));
        toast.info(`${user.userName} left the session`);
      });
    } catch (err) {
      toast.error('Failed to start collaboration: ' + err.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEBUGGER
  // ═══════════════════════════════════════════════════════════════════════════════

  const startDebugging = () => {
    setIsDebugging(true);
    setShowDebugger(true);
    addTerminalLine({ type: 'info', text: 'Debugger started' });
    
    // Simulate debug session
    setDebugConsole(prev => [...prev, {
      type: 'info',
      message: 'Debugger attached to process',
      timestamp: Date.now()
    }]);
  };

  const stopDebugging = () => {
    setIsDebugging(false);
    addTerminalLine({ type: 'info', text: 'Debugger stopped' });
  };

  const stepOver = () => {
    setDebugConsole(prev => [...prev, {
      type: 'info',
      message: 'Step over',
      timestamp: Date.now()
    }]);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // AI CODEBASE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  const runAIRefactor = async (instruction) => {
    if (!codebaseAI) return;
    
    toast.info('AI analyzing codebase...');
    
    try {
      const changes = await codebaseAI.aiRefactor(instruction);
      
      // Apply changes
      changes.forEach(change => {
        if (change.path && change.newContent) {
          // Update file in store
          // This would need to be implemented in useBuilderStore
          toast.success(`Updated ${change.path}`);
        }
      });
    } catch (err) {
      toast.error('Refactoring failed: ' + err.message);
    }
  };

  const analyzeArchitecture = async () => {
    if (!codebaseAI) return;
    
    toast.info('Analyzing architecture...');
    
    try {
      const analysis = await codebaseAI.analyzeArchitecture();
      
      // Show results in panel or modal
      console.log('Architecture analysis:', analysis);
      toast.success('Architecture analysis complete');
    } catch (err) {
      toast.error('Analysis failed: ' + err.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // BUILD & RUN
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleRun = useCallback(async () => {
    const files = flattenFiles();
    runProject();

    if (isWebProject(files)) {
      if (centerMode === 'code') setCenterMode('split');
    } else {
      const result = await runBuild(files, (log) => addTerminalLine(log));
      if (result.stdout) {
        result.stdout.split('\n').forEach(line => {
          if (line) addTerminalLine({ type: 'log', text: line });
        });
      }
      if (result.stderr) {
        result.stderr.split('\n').forEach(line => {
          if (line) addTerminalLine({ type: 'error', text: line });
        });
      }
      addTerminalLine({
        type: result.exitCode === 0 ? 'info' : 'error',
        text: `Process exited with code ${result.exitCode} (${result.duration}ms)`,
      });
    }
  }, [centerMode, runProject, flattenFiles, addTerminalLine]);

  const handleExportZip = useCallback(() => {
    const files = flattenFiles();
    const result = packageAsZip(files, projectName);
    toast.success(`Exported ${result.fileCount} files as ${result.fileName}`);
  }, [flattenFiles, projectName]);

  const handlePackageDesktop = useCallback(() => {
    const files = flattenFiles();
    const result = packageAsDesktopApp(files, projectName);
    toast.success(`Desktop package ready: ${result.fileName} (${result.fileCount} files)`);
    addTerminalLine({ type: 'system', text: `Desktop package downloaded: ${result.fileName}` });
    addTerminalLine({ type: 'info', text: 'Extract the ZIP, run "npm install && npm run package" to build your .exe' });
  }, [flattenFiles, projectName, addTerminalLine]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER SIDEBAR PANEL
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderSidebarPanel = () => {
    switch (sidebarPanel) {
      case 'explorer':
        return <FileExplorer />;
      case 'search':
        return <SearchPanel />;
      case 'git':
        return <GitPanel 
          gitEngine={gitEngine} 
          files={flattenFiles()}
          onCommit={handleGitCommit}
        />;
      case 'packages':
        return <PackageManagerPanel 
          projectPath="/project"
          onInstall={(pkg) => addTerminalLine({ type: 'info', text: `Installed ${pkg.name}@${pkg.version}` })}
          onUninstall={(name) => addTerminalLine({ type: 'info', text: `Uninstalled ${name}` })}
        />;
      case 'deploy':
        return <DeployPanel 
          deployEngine={deployEngine}
          onDeploy={handleDeploy}
          projectName={projectName}
        />;
      case 'ai':
        return <AIActionsPanel 
          onRefactor={runAIRefactor}
          onAnalyze={analyzeArchitecture}
          codebaseSummary={codebaseSummary}
        />;
      case 'swarm':
        return <SwarmPanel 
          onFilesGenerated={(files) => {
            // Import files into the project
            Object.entries(files).forEach(([path, content]) => {
              // This would need to be implemented in useBuilderStore
              toast.success(`Generated: ${path}`);
            });
          }}
        />;
      case 'collab':
        return <CollabPanel 
          participants={participants}
          isLiveShare={isLiveShare}
          onStartSession={startCollaboration}
          collabEngine={collabEngine}
        />;
      case 'settings':
        return <SettingsPanel />;
      case 'debug':
        return <DebuggerPanel 
          isDebugging={isDebugging}
          onStartDebug={startDebugging}
          onStopDebug={stopDebugging}
          onStepOver={stepOver}
          breakpoints={breakpoints}
          variables={debugVariables}
          consoleOutput={debugConsole}
        />;
      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#0d0d1a] text-gray-300 overflow-hidden rounded-lg cybeni-container">
      
      {/* Top toolbar - Omni Builder Supreme */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-[#0a0a14] shrink-0 cybeni-toolbar">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-gray-300 tracking-wide">Cybeni IDE</span>
          
          {/* Branch indicator */}
          {currentBranch && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-[10px]">
              <GitBranch className="w-3 h-3 text-primary" />
              {currentBranch}
              {(gitStatus.modified + gitStatus.added) > 0 && (
                <span className="ml-1 px-1 bg-yellow-400/20 text-yellow-400 rounded">
                  {gitStatus.modified + gitStatus.added}
                </span>
              )}
            </div>
          )}

          {/* Live share indicator */}
          {isLiveShare && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded text-[10px] text-green-400">
              <Radio className="w-3 h-3 animate-pulse" />
              Live
              {participants.length > 0 && ` (${participants.length + 1})`}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Quick actions */}
          <Button size="icon-sm" variant="ghost" onClick={saveAll} title="Save All" className="hover:bg-white/10 hover:text-primary">
            <Save className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleRun}
            title="Run Project"
            className="hover:bg-green-500/20 text-green-400 hover:text-green-300"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </Button>

          <div className="w-px h-4 bg-white/10" />

          {/* View mode selector */}
          <div className="flex items-center bg-white/5 rounded-md p-0.5 gap-0.5">
            {[
              { id: 'code', icon: Code2, label: 'Code' },
              { id: 'split', icon: Columns2, label: 'Split' },
              { id: 'preview', icon: MonitorPlay, label: 'Preview' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setCenterMode(mode.id)}
                className={`p-1 rounded transition-all ${
                  centerMode === mode.id
                    ? 'text-primary bg-primary/15'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                title={mode.label}
              >
                <mode.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Export & Deploy */}
          <Button size="icon-sm" variant="ghost" onClick={handleExportZip} title="Export as ZIP" className="hover:bg-white/10">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button 
            size="icon-sm" 
            variant="ghost" 
            onClick={() => setShowDeployPanel(!showDeployPanel)} 
            title="Deploy" 
            className="hover:bg-white/10 text-purple-400"
          >
            <Rocket className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={handlePackageDesktop} title="Package as Desktop App" className="hover:bg-white/10 text-amber-400">
            <Package className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-4 bg-white/10" />

          {/* Toggle panels */}
          <Button 
            size="icon-sm" 
            variant="ghost" 
            onClick={() => setShowDebugger(!showDebugger)} 
            title="Toggle Debugger" 
            className={`hover:bg-white/10 ${showDebugger ? 'text-red-400' : ''}`}
          >
            <Bug className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={toggleTerminal} title="Toggle Terminal" className={`hover:bg-white/10 ${showTerminal ? 'text-primary' : ''}`}>
            <Terminal className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setShowAI(!showAI)} title="Toggle AI" className={`hover:bg-white/10 ${showAI ? 'text-primary' : ''}`}>
            {showAI ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Activity Bar */}
        <div className="w-[42px] bg-[#080812] flex flex-col items-center py-2 gap-1 shrink-0 cybeni-activity-bar">
          {/* Core tools */}
          <div className="flex flex-col items-center gap-1">
            {ACTIVITY_ITEMS.filter(item => item.category === 'core').map((item) => {
              const isActive = sidebarPanel === item.id;
              const hasBadge = item.badge === 'git' && (gitStatus.modified + gitStatus.added) > 0;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setSidebarPanel(isActive ? null : item.id)}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'text-primary bg-primary/15 border-l-2 border-primary'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {hasBadge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* AI & Tools */}
          <div className="flex flex-col items-center gap-1">
            {ACTIVITY_ITEMS.filter(item => ['ai', 'tools', 'collab'].includes(item.category)).map((item) => {
              const isActive = sidebarPanel === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setSidebarPanel(isActive ? null : item.id)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'text-primary bg-primary/15 border-l-2 border-primary'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                  title={item.label}
                >
                  <item.icon className="w-4.5 h-4.5" />
                </button>
              );
            })}
          </div>

          <div className="w-5 h-px bg-white/10 my-1" />

          {/* Settings */}
          {ACTIVITY_ITEMS.filter(item => item.category === 'core' && item.id === 'settings').map((item) => {
            const isActive = sidebarPanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSidebarPanel(isActive ? null : item.id)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'text-primary bg-primary/15 border-l-2 border-primary'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
                title={item.label}
              >
                <item.icon className="w-4.5 h-4.5" />
              </button>
            );
          })}
        </div>

        {/* Sidebar Panel */}
        {sidebarPanel && (
          <>
            <div className="shrink-0 overflow-hidden" style={{ width: sidebarWidth }}>
              {renderSidebarPanel()}
            </div>
            <Divider direction="vertical" onDrag={(x) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const newW = x - rect.left - 42;
              setSidebarWidth(Math.max(150, Math.min(400, newW)));
            }} />
          </>
        )}

        {/* Center: Editor / Split / Preview */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Code editor */}
            {centerMode !== 'preview' && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <EditorTabs />
              </div>
            )}

            {/* Split divider */}
            {centerMode === 'split' && <Divider direction="vertical" onDrag={() => {}} />}

            {/* Live preview */}
            {centerMode !== 'code' && (
              <div className={`overflow-hidden ${centerMode === 'split' ? 'w-[45%] shrink-0' : 'flex-1'}`}>
                <PreviewPanel />
              </div>
            )}
          </div>

          {/* Debugger Panel */}
          {showDebugger && (
            <>
              <Divider direction="horizontal" onDrag={() => {}} />
              <div className="shrink-0 overflow-hidden" style={{ height: debuggerHeight }}>
                <DebuggerPanel 
                  isDebugging={isDebugging}
                  onStartDebug={startDebugging}
                  onStopDebug={stopDebugging}
                  onStepOver={stepOver}
                  breakpoints={breakpoints}
                  variables={debugVariables}
                  consoleOutput={debugConsole}
                />
              </div>
            </>
          )}

          {/* Terminal */}
          {showTerminal && (
            <>
              <Divider direction="horizontal" onDrag={() => {}} />
              <div className="shrink-0 overflow-hidden" style={{ height: terminalHeight }}>
                <TerminalPanel />
              </div>
            </>
          )}
        </div>

        {/* AI Panel (right) */}
        {showAI && (
          <>
            <Divider direction="vertical" onDrag={() => {}} />
            <div className="shrink-0 overflow-hidden cybeni-ai-panel" style={{ width: aiWidth }}>
              <AIPanel />
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Divider({ direction = 'vertical', onDrag }) {
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;

    const handleMove = (ev) => {
      if (!dragging.current) return;
      onDrag(direction === 'vertical' ? ev.clientX : ev.clientY);
    };

    const handleUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize';
  }, [direction, onDrag]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`${
        direction === 'vertical'
          ? 'w-[3px] cursor-col-resize cybeni-divider-v'
          : 'h-[3px] cursor-row-resize cybeni-divider-h'
      } shrink-0`}
    />
  );
}

function SearchPanel() {
  const { flattenFiles, openFile } = useBuilderStore();
  const [query, setQuery] = useState('');

  const files = flattenFiles();
  const results = query.trim()
    ? files
        .map((f) => {
          const lines = (f.content || '').split('\n');
          const matches = [];
          lines.forEach((line, i) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              matches.push({ lineNum: i + 1, text: line.trim() });
            }
          });
          return matches.length > 0 ? { file: f, matches } : null;
        })
        .filter(Boolean)
    : [];

  return (
    <div className="flex flex-col h-full text-xs">
      <div className="px-3 py-2 border-b border-white/10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in files..."
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-primary/40"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto px-1 py-1 scrollbar-thin">
        {results.map((r, i) => (
          <div key={i} className="mb-2">
            <div className="px-2 py-1 text-gray-400 font-medium truncate">{r.file.path}</div>
            {r.matches.slice(0, 5).map((m, j) => (
              <button
                key={j}
                onClick={() => openFile(r.file.id)}
                className="w-full text-left px-4 py-0.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 truncate"
              >
                <span className="text-gray-600 mr-2">{m.lineNum}:</span>
                {m.text}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const { loadTemplate, projectName } = useBuilderStore();
  const [showTemplates, setShowTemplates] = useState(false);

  const TEMPLATES = [
    { id: 'blank', name: 'Blank', desc: 'Empty project', category: 'Frontend' },
    { id: 'landing', name: 'Landing Page', desc: 'HTML/CSS/JS landing page', category: 'Frontend' },
    { id: 'portfolio', name: 'Portfolio', desc: 'Developer portfolio site', category: 'Frontend' },
    { id: 'react', name: 'React App', desc: 'React with JSX', category: 'Frontend' },
    { id: 'nextjs', name: 'Next.js', desc: 'Next.js App Router', category: 'Frontend' },
    { id: 'vue', name: 'Vue 3', desc: 'Vue 3 + Vite', category: 'Frontend' },
    { id: 'todo_app', name: 'Todo App', desc: 'Todo list with localStorage', category: 'App' },
    { id: 'api', name: 'API Server', desc: 'Express.js REST API', category: 'Backend' },
    { id: 'python', name: 'Python', desc: 'Python 3 app (runs in browser)', category: 'Language' },
  ];

  return (
    <div className="flex flex-col h-full text-xs px-3 py-3 gap-3">
      <div className="text-gray-300 font-semibold uppercase tracking-wider text-[10px]">Project Settings</div>

      <div>
        <label className="text-gray-400 text-[10px] block mb-1">Project: {projectName}</label>
      </div>

      <div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:border-primary/30 transition-colors"
        >
          <span className="flex items-center gap-2"><Layout className="w-3.5 h-3.5" /> Load Template</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
        </button>
        {showTemplates && (
          <div className="mt-1 space-y-3 max-h-80 overflow-y-auto">
            {['Frontend', 'App', 'Backend', 'Language'].map(category => {
              const categoryTemplates = TEMPLATES.filter(t => t.category === category);
              if (categoryTemplates.length === 0) return null;
              return (
                <div key={category}>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{category}</div>
                  <div className="space-y-1">
                    {categoryTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (confirm(`Load "${t.name}" template? This will replace your current project.`)) {
                            loadTemplate(t.id);
                            toast.success(`Loaded: ${t.name}`);
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-primary/10 text-gray-300 hover:text-primary transition-colors"
                      >
                        <div className="font-medium">{t.name}</div>
                        <div className="text-[10px] text-gray-500">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-2">
        <button
          onClick={() => {
            const state = useBuilderStore.getState();
            const files = state.flattenFiles();
            const data = { name: state.projectName, files: files.map((f) => ({ path: f.path, content: f.content })) };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${state.projectName.replace(/\s+/g, '-').toLowerCase()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Project exported');
          }}
          className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:border-primary/30 transition-colors"
        >
          <FileDown className="w-3.5 h-3.5" /> Export Project
        </button>
      </div>
    </div>
  );
}

// Deploy Panel
function DeployPanel({ deployEngine, onDeploy, projectName }) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployments, setDeployments] = useState([]);

  const handleDeploy = async () => {
    if (!selectedTarget) return;
    
    setIsDeploying(true);
    try {
      await onDeploy(selectedTarget);
      // Refresh deployment history
      const history = deployEngine.getDeploymentHistory(selectedTarget);
      setDeployments(history);
    } catch (err) {
      console.error('Deploy failed:', err);
    }
    setIsDeploying(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-purple-400" />
          <span className="text-[11px] uppercase tracking-wider text-gray-500">Deploy</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-[10px] text-gray-500 mb-2">Select platform</p>
        
        <div className="space-y-2">
          {Object.values(DEPLOYMENT_TARGETS).map(target => (
            <button
              key={target.id}
              onClick={() => setSelectedTarget(target.id)}
              className={`w-full p-2 rounded border text-left transition-colors ${
                selectedTarget === target.id
                  ? 'border-purple-400/50 bg-purple-400/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{target.icon}</span>
                <div className="flex-1">
                  <p className="text-[11px] font-medium">{target.name}</p>
                  <p className="text-[9px] text-gray-500">{target.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedTarget && (
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full mt-3 flex items-center justify-center gap-1 px-3 py-2 bg-purple-400/20 text-purple-400 rounded text-[10px] hover:bg-purple-400/30 disabled:opacity-50"
          >
            {isDeploying ? (
              <><RotateCcw className="w-3 h-3 animate-spin" /> Deploying...</>
            ) : (
              <><Rocket className="w-3 h-3" /> Deploy to {DEPLOYMENT_TARGETS[selectedTarget.toUpperCase()]?.name}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// AI Actions Panel
function AIActionsPanel({ onRefactor, onAnalyze, codebaseSummary }) {
  const [refactorInput, setRefactorInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefactor = async () => {
    if (!refactorInput.trim()) return;
    setIsProcessing(true);
    await onRefactor(refactorInput);
    setIsProcessing(false);
    setRefactorInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-[11px] uppercase tracking-wider text-gray-500">AI Actions</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Codebase Summary */}
        {codebaseSummary && (
          <div className="p-2 bg-[#252540] rounded">
            <p className="text-[10px] text-gray-500 mb-1">Codebase</p>
            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <span className="text-gray-400">{codebaseSummary.files} files</span>
              <span className="text-gray-400">{codebaseSummary.lines} lines</span>
              <span className="text-gray-400">{codebaseSummary.functions} functions</span>
              <span className="text-gray-400">{codebaseSummary.components} components</span>
            </div>
          </div>
        )}

        {/* Refactor */}
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Multi-file Refactor</p>
          <textarea
            value={refactorInput}
            onChange={(e) => setRefactorInput(e.target.value)}
            placeholder="Describe what to refactor..."
            className="w-full bg-[#252540] text-gray-300 text-[10px] rounded px-2 py-1 border border-gray-700 outline-none resize-none h-16"
          />
          <button
            onClick={handleRefactor}
            disabled={isProcessing || !refactorInput.trim()}
            className="w-full mt-1 px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded text-[10px] hover:bg-yellow-400/30 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Refactor'}
          </button>
        </div>

        {/* Analyze */}
        <button
          onClick={onAnalyze}
          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-white/10 text-gray-300 rounded text-[10px] hover:bg-white/15"
        >
          <Shield className="w-3 h-3" /> Analyze Architecture
        </button>
      </div>
    </div>
  );
}

// Collab Panel
function CollabPanel({ participants, isLiveShare, onStartSession, collabEngine }) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-300">
      <div className="px-3 py-2 border-b border-[#2a2a4a]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-400" />
          <span className="text-[11px] uppercase tracking-wider text-gray-500">Collaboration</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!isLiveShare ? (
          <div className="text-center py-8">
            <Radio className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-[11px] text-gray-500 mb-2">Start live collaboration</p>
            <button
              onClick={onStartSession}
              className="px-3 py-1.5 bg-green-400/20 text-green-400 rounded text-[10px] hover:bg-green-400/30"
            >
              Start Session
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-green-400/10 rounded">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-400">Live Session Active</span>
            </div>

            <p className="text-[10px] text-gray-500 mb-1">Participants</p>
            <div className="space-y-1">
              {participants.map(p => (
                <div key={p.userId} className="flex items-center gap-2 p-1.5 rounded bg-[#252540]">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{ backgroundColor: p.userColor }}
                  >
                    {p.userName[0]}
                  </div>
                  <span className="text-[10px]">{p.userName}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
