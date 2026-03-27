import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  FolderOpen, Search, Bot, Settings, Play, Eye, EyeOff,
  Terminal, PanelRightClose, PanelRightOpen, PanelBottomClose, PanelBottomOpen,
  Save, FileDown, RotateCcw, Layout, Sparkles, ChevronDown, Users,
  Code2, Columns2, MonitorPlay, Download, Package,
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

// ── Left activity bar icons (file/nav only — AI lives on the right) ──
const ACTIVITY_ITEMS = [
  { id: 'explorer', icon: FolderOpen, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'collab', icon: Users, label: 'Collaboration' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

// ── Template picker ─────────────────────────────────────────
const TEMPLATES = [
  { id: 'blank', name: 'Blank', desc: 'Empty project' },
  { id: 'landing', name: 'Landing Page', desc: 'HTML/CSS/JS landing page' },
  { id: 'react', name: 'React App', desc: 'React with JSX' },
  { id: 'api', name: 'API Server', desc: 'Express.js REST API' },
  { id: 'game', name: 'Canvas Game', desc: 'HTML5 canvas game' },
  { id: 'python', name: 'Python', desc: 'Python 3 app (runs in browser)' },
  { id: 'c_app', name: 'C Program', desc: 'C with GCC (cloud compiled)' },
  { id: 'rust', name: 'Rust', desc: 'Rust program (cloud compiled)' },
  { id: 'go_app', name: 'Go', desc: 'Go program (cloud compiled)' },
  { id: 'java', name: 'Java', desc: 'Java program (cloud compiled)' },
];

// ── Search panel ────────────────────────────────────────────
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
        {query && results.length === 0 && (
          <p className="px-3 py-4 text-gray-500 text-center">No results</p>
        )}
      </div>
    </div>
  );
}

// ── Settings panel ──────────────────────────────────────────
function SettingsPanel() {
  const { loadTemplate, projectName } = useBuilderStore();
  const [showTemplates, setShowTemplates] = useState(false);

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
          <div className="mt-1 space-y-1">
            {TEMPLATES.map((t) => (
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

      <div>
        <label className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:border-primary/30 transition-colors cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> Import Project
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const data = JSON.parse(ev.target.result);
                  if (data.name && data.files) {
                    const store = useBuilderStore.getState();
                    // Rebuild tree from flat files
                    const children = data.files.map((f, i) => ({
                      id: `imp${Date.now()}${i}`,
                      name: f.path.split('/').pop(),
                      type: 'file',
                      content: f.content,
                    }));
                    store.setProjectName(data.name);
                    useBuilderStore.setState({
                      tree: { id: 'root', name: 'project', type: 'folder', expanded: true, children },
                      openTabs: [],
                      activeTab: null,
                    });
                    store._persist();
                    if (children[0]) store.openFile(children[0].id);
                    toast.success(`Imported: ${data.name}`);
                  }
                } catch {
                  toast.error('Invalid project file');
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}

// ── Resizable divider ───────────────────────────────────────
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
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
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

// ── Main IDE Layout ─────────────────────────────────────────
export default function IDEWindow() {
  const { sidebarPanel, setSidebarPanel, showTerminal, toggleTerminal, saveAll, projectName, flattenFiles, runProject, addTerminalLine } = useBuilderStore();
  const [centerMode, setCenterMode] = useState('split'); // 'code' | 'split' | 'preview'

  // Real-time collaboration
  const userId = useRef(`user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).current;
  const collab = useCollabSession(userId, 'You');

  const handleCreateSession = useCallback(async () => {
    const files = flattenFiles().map(f => ({ path: f.path, name: f.name, content: f.content || '' }));
    await collab.create(projectName || 'Untitled', files);
  }, [collab, projectName, flattenFiles]);

  // Run project — switch to split, open terminal, trigger compile
  const handleRun = useCallback(async () => {
    const files = flattenFiles();
    runProject(); // opens terminal, logs compile info

    if (isWebProject(files)) {
      // Web projects render in preview
      if (centerMode === 'code') setCenterMode('split');
    } else {
      // Non-web: run via BuildRunner (Python WASM, compiled via API)
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

  // Export project as ZIP
  const handleExportZip = useCallback(() => {
    const files = flattenFiles();
    const result = packageAsZip(files, projectName);
    toast.success(`Exported ${result.fileCount} files as ${result.fileName}`);
  }, [flattenFiles, projectName]);

  // Package as desktop EXE
  const handlePackageDesktop = useCallback(() => {
    const files = flattenFiles();
    const result = packageAsDesktopApp(files, projectName);
    toast.success(`Desktop package ready: ${result.fileName} (${result.fileCount} files)`);
    addTerminalLine({ type: 'system', text: `Desktop package downloaded: ${result.fileName}` });
    addTerminalLine({ type: 'info', text: 'Extract the ZIP, run "npm install && npm run package" to build your .exe' });
  }, [flattenFiles, projectName, addTerminalLine]);

  // Listen for console output from preview iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'cybeni-console') {
        addTerminalLine({ type: e.data.level || 'log', text: e.data.text });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [addTerminalLine]);

  const containerRef = useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [aiWidth, setAiWidth] = useState(320);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [showAI, setShowAI] = useState(true);

  const handleSidebarDrag = useCallback((x) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const newW = x - rect.left - 42; // 42px activity bar
    setSidebarWidth(Math.max(150, Math.min(400, newW)));
  }, []);

  const handleAIDrag = useCallback((x) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const newW = rect.right - x;
    setAiWidth(Math.max(250, Math.min(500, newW)));
  }, []);

  const handleTerminalDrag = useCallback((y) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const newH = rect.bottom - y - 24; // 24px status bar
    setTerminalHeight(Math.max(100, Math.min(400, newH)));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+B → toggle sidebar
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); setSidebarPanel(sidebarPanel ? null : 'explorer'); }
      // Ctrl+J → toggle terminal
      if (e.ctrlKey && e.key === 'j') { e.preventDefault(); toggleTerminal(); }
      // Ctrl+Shift+P → toggle AI
      if (e.ctrlKey && e.shiftKey && e.key === 'P') { e.preventDefault(); setShowAI((v) => !v); }
      // Ctrl+Enter → run project
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleRun(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarPanel, setSidebarPanel, toggleTerminal, handleRun]);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#0d0d1a] text-gray-300 overflow-hidden rounded-lg cybeni-container">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-[#0a0a14] shrink-0 cybeni-toolbar">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-gray-300 tracking-wide">Cybeni IDE</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" onClick={saveAll} title="Save All (Ctrl+Shift+S)" className="hover:bg-white/10 hover:text-primary">
            <Save className="w-3.5 h-3.5" />
          </Button>

          {/* Run button */}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleRun}
            title="Run Project (Ctrl+Enter)"
            className="hover:bg-green-500/20 text-green-400 hover:text-green-300 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
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
                    ? 'text-primary bg-primary/15 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
                title={mode.label}
              >
                <mode.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Export & Package */}
          <Button size="icon-sm" variant="ghost" onClick={handleExportZip} title="Export as ZIP" className="hover:bg-white/10 hover:text-primary">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={handlePackageDesktop} title="Package as Desktop App (.exe)" className="hover:bg-white/10 hover:text-amber-400">
            <Package className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-4 bg-white/10" />

          <Button size="icon-sm" variant="ghost" onClick={toggleTerminal} title="Toggle Terminal (Ctrl+J)" className={`hover:bg-white/10 ${showTerminal ? 'text-primary' : ''}`}>
            <Terminal className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setShowAI(!showAI)} title="Toggle AI (Ctrl+Shift+P)" className={`hover:bg-white/10 ${showAI ? 'text-primary' : ''}`}>
            {showAI ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity bar */}
        <div className="w-[42px] bg-[#080812] flex flex-col items-center py-2 gap-1 shrink-0 cybeni-activity-bar">
          {/* Top: nav items */}
          {ACTIVITY_ITEMS.map((item) => {
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom: AI toggle */}
          <button
            onClick={() => setShowAI((v) => !v)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              showAI
                ? 'text-primary bg-primary/15 border-l-2 border-primary'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            title="Cybeni AI (Ctrl+Shift+P)"
          >
            <Bot className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Sidebar panel */}
        {sidebarPanel && (
          <>
            <div className="shrink-0 overflow-hidden" style={{ width: sidebarWidth }}>
              {sidebarPanel === 'explorer' && <FileExplorer />}
              {sidebarPanel === 'search' && <SearchPanel />}
              {sidebarPanel === 'collab' && (
                <CollabOverlay
                  collab={collab}
                  userId={userId}
                  onCreateSession={handleCreateSession}
                />
              )}
              {sidebarPanel === 'settings' && <SettingsPanel />}
            </div>
            <Divider direction="vertical" onDrag={handleSidebarDrag} />
          </>
        )}

        {/* Center: Editor / Split / Preview + Terminal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Main view area */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Code editor — shown in 'code' and 'split' modes */}
            {centerMode !== 'preview' && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <EditorTabs />
              </div>
            )}

            {/* Divider between editor and preview in split mode */}
            {centerMode === 'split' && (
              <Divider direction="vertical" onDrag={() => {}} />
            )}

            {/* Live preview — shown in 'split' and 'preview' modes */}
            {centerMode !== 'code' && (
              <div className={`overflow-hidden ${centerMode === 'split' ? 'w-[45%] shrink-0' : 'flex-1'}`}>
                <PreviewPanel />
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <>
              <Divider direction="horizontal" onDrag={handleTerminalDrag} />
              <div className="shrink-0 overflow-hidden" style={{ height: terminalHeight }}>
                <TerminalPanel />
              </div>
            </>
          )}
        </div>

        {/* AI Panel (right) */}
        {showAI && (
          <>
            <Divider direction="vertical" onDrag={handleAIDrag} />
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
