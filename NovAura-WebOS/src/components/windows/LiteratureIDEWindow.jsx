import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PanelRight, PanelBottomOpen, PanelBottomClose,
  BookOpen, Volume2, VolumeX, Search, FolderOpen,
  GitBranch, Settings as SettingsIcon, Map, FileText,
  ChevronRight, Target, Palette,
} from 'lucide-react';
import FileTree from './literature/FileTree';
import RichEditor from './literature/RichEditor';
import AIWritingPanel from './literature/AIWritingPanel';
import StoryBible from './literature/StoryBible';
import ProblemsPanel from './literature/ProblemsPanel';
import StatusBar from './literature/StatusBar';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const STORAGE_FILES = 'novaura_lit_files';
const STORAGE_BIBLE = 'novaura_lit_bible';
const STORAGE_SETTINGS = 'novaura_lit_settings';

function defaultFiles() {
  return {
    id: 'root', name: 'My Novel', type: 'folder', expanded: true,
    children: [
      { id: 'ch1', name: 'Chapter 1 — The Beginning', type: 'file', content: '<p>It was a dark and stormy night...</p>' },
      { id: 'ch2', name: 'Chapter 2 — The Journey', type: 'file', content: '' },
      {
        id: 'chars', name: 'Characters', type: 'folder', expanded: false,
        children: [
          { id: 'protag', name: 'Protagonist', type: 'file', content: '<h2>Character Sheet</h2><p><strong>Name:</strong> </p><p><strong>Age:</strong> </p><p><strong>Motivation:</strong> </p><p><strong>Flaw:</strong> </p><p><strong>Arc:</strong> </p>' },
        ],
      },
      {
        id: 'world', name: 'World Building', type: 'folder', expanded: false,
        children: [
          { id: 'lore', name: 'Lore & History', type: 'file', content: '' },
          { id: 'magic', name: 'Magic System', type: 'file', content: '' },
        ],
      },
      { id: 'outline', name: 'Outline', type: 'file', content: '<h1>Story Outline</h1><ul><li>Act 1: Setup</li><li>Act 2: Confrontation</li><li>Act 3: Resolution</li></ul>' },
      { id: 'notes', name: 'Notes', type: 'file', content: '' },
    ],
  };
}

function defaultBible() {
  return { characters: [], settings: [], rules: [], plotThreads: [] };
}

function findFileById(tree, id) {
  if (tree.id === id) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findFileById(child, id);
      if (found) return found;
    }
  }
  return null;
}

function updateFileContent(tree, id, content) {
  if (tree.id === id) return { ...tree, content };
  if (tree.children) {
    return { ...tree, children: tree.children.map((c) => updateFileContent(c, id, content)) };
  }
  return tree;
}

// Collect all files flat for searching
function flattenFiles(tree, path = '') {
  const result = [];
  const fullPath = path ? `${path}/${tree.name}` : tree.name;
  if (tree.type === 'file') result.push({ ...tree, path: fullPath });
  if (tree.children) tree.children.forEach((c) => result.push(...flattenFiles(c, fullPath)));
  return result;
}

// ── Activity Bar config ──────────────────────────────
const ACTIVITY_ITEMS = [
  { id: 'explorer', icon: FolderOpen, label: 'Explorer', position: 'top' },
  { id: 'search', icon: Search, label: 'Search', position: 'top' },
  { id: 'bible', icon: BookOpen, label: 'Story Bible', position: 'top' },
  { id: 'outline', icon: GitBranch, label: 'Outline', position: 'top' },
  { id: 'map', icon: Map, label: 'Story Map', position: 'top' },
  { id: 'settings', icon: SettingsIcon, label: 'Settings', position: 'bottom' },
];

// ── Inline panels ────────────────────────────────────

function SearchPanel({ files, onOpenFile }) {
  const [query, setQuery] = useState('');
  const allFiles = useMemo(() => flattenFiles(files), [files]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allFiles.filter((f) => {
      const text = (f.content || '').replace(/<[^>]+>/g, '').toLowerCase();
      return f.name.toLowerCase().includes(q) || text.includes(q);
    }).map((f) => {
      const text = (f.content || '').replace(/<[^>]+>/g, '');
      const idx = text.toLowerCase().indexOf(q);
      const snippet = idx >= 0 ? '...' + text.slice(Math.max(0, idx - 30), idx + query.length + 30) + '...' : '';
      return { ...f, snippet };
    });
  }, [query, allFiles]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      <div className="px-3 py-2 border-b border-[#2a2a4a] text-[11px] uppercase tracking-wider text-gray-500">Search</div>
      <div className="px-2 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in files..."
          className="w-full bg-[#2a2a4a] text-white text-[11px] rounded px-2 py-1.5 border border-gray-700 outline-none placeholder:text-gray-600"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-auto">
        {results.length === 0 && query && (
          <p className="px-3 py-4 text-[11px] text-gray-600 text-center">No results</p>
        )}
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpenFile(r)}
            className="w-full px-3 py-2 text-left hover:bg-white/5 border-b border-[#2a2a4a]"
          >
            <p className="text-[11px] text-gray-200 truncate">{r.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{r.path}</p>
            {r.snippet && <p className="text-[10px] text-gray-600 mt-0.5 truncate">{r.snippet}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

function OutlinePanel({ content = '' }) {
  const headings = useMemo(() => {
    const result = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content || '<p></p>', 'text/html');
    doc.querySelectorAll('h1, h2, h3, h4, p, li').forEach((el, i) => {
      const tag = el.tagName.toLowerCase();
      const text = el.textContent?.trim();
      if (!text) return;
      if (tag === 'h1') result.push({ level: 1, text, id: i });
      else if (tag === 'h2') result.push({ level: 2, text, id: i });
      else if (tag === 'h3') result.push({ level: 3, text, id: i });
      else if (result.length < 50 && text.length > 20) {
        result.push({ level: 4, text: text.slice(0, 60) + (text.length > 60 ? '...' : ''), id: i });
      }
    });
    return result;
  }, [content]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      <div className="px-3 py-2 border-b border-[#2a2a4a] text-[11px] uppercase tracking-wider text-gray-500">
        Document Outline
      </div>
      <div className="flex-1 overflow-auto py-1">
        {headings.length === 0 ? (
          <p className="px-3 py-4 text-[11px] text-gray-600 text-center">
            Add headings (H1-H3) to see outline
          </p>
        ) : headings.map((h) => (
          <div
            key={h.id}
            className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-white/5 cursor-pointer"
            style={{ paddingLeft: `${h.level * 12 + 4}px` }}
          >
            {h.level <= 3 ? (
              <ChevronRight className="w-2.5 h-2.5 text-gray-500" />
            ) : (
              <FileText className="w-2.5 h-2.5 text-gray-600" />
            )}
            <span className={`text-[11px] truncate ${
              h.level === 1 ? 'text-gray-200 font-medium' :
              h.level === 2 ? 'text-gray-300' :
              h.level === 3 ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {h.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryMapPanel() {
  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      <div className="px-3 py-2 border-b border-[#2a2a4a] text-[11px] uppercase tracking-wider text-gray-500">
        Story Map
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 px-4">
        <Map className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-[11px] text-center mb-1">Visual Story Graph</p>
        <p className="text-[10px] text-center text-gray-700">
          Plot threads, character arcs, and timeline visualization — coming soon
        </p>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onUpdate }) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      <div className="px-3 py-2 border-b border-[#2a2a4a] text-[11px] uppercase tracking-wider text-gray-500">
        Settings
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Word goal */}
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Daily Word Goal</label>
          <input
            type="number"
            value={settings.wordGoal || 1000}
            onChange={(e) => onUpdate({ ...settings, wordGoal: parseInt(e.target.value) || 1000 })}
            className="w-full bg-[#2a2a4a] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
          />
        </div>
        {/* Font family */}
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Editor Font</label>
          <select
            value={settings.fontFamily || 'Georgia'}
            onChange={(e) => onUpdate({ ...settings, fontFamily: e.target.value })}
            className="w-full bg-[#2a2a4a] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
          >
            <option value="Georgia">Georgia (Serif)</option>
            <option value="'Times New Roman'">Times New Roman</option>
            <option value="'Courier New'">Courier New (Mono)</option>
            <option value="'Segoe UI'">Segoe UI (Sans)</option>
            <option value="'Inter'">Inter</option>
            <option value="system-ui">System Default</option>
          </select>
        </div>
        {/* Line height */}
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Line Height</label>
          <select
            value={settings.lineHeight || '1.8'}
            onChange={(e) => onUpdate({ ...settings, lineHeight: e.target.value })}
            className="w-full bg-[#2a2a4a] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
          >
            <option value="1.4">Compact (1.4)</option>
            <option value="1.6">Normal (1.6)</option>
            <option value="1.8">Relaxed (1.8)</option>
            <option value="2.0">Double (2.0)</option>
          </select>
        </div>
        {/* Editor theme */}
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Paper Theme</label>
          <select
            value={settings.paperTheme || 'white'}
            onChange={(e) => onUpdate({ ...settings, paperTheme: e.target.value })}
            className="w-full bg-[#2a2a4a] text-white text-[11px] rounded px-2 py-1 border border-gray-700 outline-none"
          >
            <option value="white">White</option>
            <option value="cream">Cream / Parchment</option>
            <option value="dark">Dark Paper</option>
            <option value="sepia">Sepia</option>
          </select>
        </div>
        {/* Auto-save */}
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-gray-500">Auto-save to browser</label>
          <div className="w-3 h-3 bg-green-500 rounded-full" title="Always on" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────

export default function LiteratureIDEWindow() {
  // ── State ────────────────────────────────────────
  const [files, setFiles] = useState(() => {
    try { const d = kernelStorage.getItem(STORAGE_FILES); return d ? JSON.parse(d) : defaultFiles(); }
    catch { return defaultFiles(); }
  });
  const [bible, setBible] = useState(() => {
    try { const d = kernelStorage.getItem(STORAGE_BIBLE); return d ? JSON.parse(d) : defaultBible(); }
    catch { return defaultBible(); }
  });
  const [settings, setSettings] = useState(() => {
    try { const d = kernelStorage.getItem(STORAGE_SETTINGS); return d ? JSON.parse(d) : {}; }
    catch { return {}; }
  });

  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [selectedText, setSelectedText] = useState('');

  // Activity bar + panels
  const [activeView, setActiveView] = useState('explorer');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const [leftWidth, setLeftWidth] = useState(220);
  const [rightWidth, setRightWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(180);

  const [speaking, setSpeaking] = useState(false);

  // ── Persist ──────────────────────────────────────
  useEffect(() => { kernelStorage.setItem(STORAGE_FILES, JSON.stringify(files)); }, [files]);
  useEffect(() => { kernelStorage.setItem(STORAGE_BIBLE, JSON.stringify(bible)); }, [bible]);
  useEffect(() => { kernelStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings)); }, [settings]);

  // ── Active file ──────────────────────────────────
  const activeFile = activeTabId ? findFileById(files, activeTabId) : null;

  const handleFileSelect = useCallback((file) => {
    if (file.type === 'folder') return;
    setOpenTabs((prev) => {
      if (prev.find((t) => t.id === file.id)) return prev;
      return [...prev, { id: file.id, name: file.name }];
    });
    setActiveTabId(file.id);
  }, []);

  const handleTabClose = useCallback((tabId) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  }, [activeTabId]);

  const handleContentChange = useCallback((html) => {
    if (!activeTabId) return;
    setFiles((prev) => updateFileContent(prev, activeTabId, html));
    setOpenTabs((prev) => prev.map((t) => t.id === activeTabId ? { ...t, modified: true } : t));
  }, [activeTabId]);

  const handleInsertText = useCallback((text) => {
    if (!activeTabId) return;
    const editor = document.querySelector('[contenteditable]');
    if (editor) {
      editor.focus();
      document.execCommand('insertHTML', false, `<p>${text.replace(/\n/g, '</p><p>')}</p>`);
    }
  }, [activeTabId]);

  // ── Word count ───────────────────────────────────
  const plainText = (activeFile?.content || '').replace(/<[^>]+>/g, '');
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;

  // ── TTS Read Aloud ───────────────────────────────
  const toggleReadAloud = () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
    } else if (selectedText || plainText) {
      const utterance = new SpeechSynthesisUtterance(selectedText || plainText);
      utterance.rate = 0.9;
      utterance.onend = () => setSpeaking(false);
      speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  // ── Resize handlers ──────────────────────────────
  const handleResize = (setter, direction, min, max) => (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let startVal;
    setter((v) => { startVal = v; return v; });
    const move = (e) => {
      const delta = direction === 'x' ? e.clientX - startX : startY - e.clientY;
      const sign = direction === 'x-right' ? -(e.clientX - startX) : delta;
      const val = direction === 'x-right' ? startVal + sign : startVal + delta;
      setter(Math.max(min, Math.min(max, val)));
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  // ── Activity bar click ───────────────────────────
  const handleActivityClick = (id) => {
    if (activeView === id && leftOpen) {
      setLeftOpen(false); // toggle off if clicking same icon
    } else {
      setActiveView(id);
      setLeftOpen(true);
    }
  };

  // ── Focus mode ───────────────────────────────────
  const effectiveLeftOpen = focusMode ? false : leftOpen;
  const effectiveRightOpen = focusMode ? false : rightOpen;
  const effectiveBottomOpen = focusMode ? false : bottomOpen;

  // ── Render left sidebar content ──────────────────
  const renderLeftPanel = () => {
    switch (activeView) {
      case 'explorer':
        return <FileTree files={files} activeFileId={activeTabId} onSelect={handleFileSelect} onUpdate={setFiles} />;
      case 'search':
        return <SearchPanel files={files} onOpenFile={handleFileSelect} />;
      case 'bible':
        return <StoryBible bible={bible} onUpdate={setBible} />;
      case 'outline':
        return <OutlinePanel content={activeFile?.content || ''} />;
      case 'map':
        return <StoryMapPanel />;
      case 'settings':
        return <SettingsPanel settings={settings} onUpdate={setSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-gray-300 select-none" style={{ fontSize: '13px' }}>
      {/* ── Top bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 h-8 bg-[#141428] border-b border-[#2a2a4a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-semibold text-gray-200">NovAura Literature IDE</span>
          {activeFile && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-600" />
              <span className="text-[11px] text-gray-400">{activeFile.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleReadAloud}
            className={`p-1 rounded hover:bg-white/10 ${speaking ? 'text-primary' : 'text-gray-500'}`}
            title="Read Aloud"
          >
            {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setBottomOpen(!bottomOpen)}
            className={`p-1 rounded hover:bg-white/10 ${bottomOpen ? 'text-primary' : 'text-gray-500'}`}
            title="Problems Panel"
          >
            {bottomOpen ? <PanelBottomClose className="w-3.5 h-3.5" /> : <PanelBottomOpen className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className={`p-1 rounded hover:bg-white/10 ${rightOpen ? 'text-primary' : 'text-gray-500'}`}
            title="AI Assistant"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main area (activity bar + panels) ───────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Activity Bar (far left icon strip) ─────── */}
        {!focusMode && (
          <div className="w-10 bg-[#141428] border-r border-[#2a2a4a] flex flex-col items-center flex-shrink-0">
            {/* Top icons */}
            <div className="flex flex-col items-center pt-1 gap-0.5 flex-1">
              {ACTIVITY_ITEMS.filter((a) => a.position === 'top').map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id && leftOpen;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleActivityClick(item.id)}
                    className={`w-10 h-9 flex items-center justify-center transition-colors relative group ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-300'
                    }`}
                    title={item.label}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r" />
                    )}
                    <Icon className="w-[18px] h-[18px]" />
                    {/* Tooltip */}
                    <div className="absolute left-11 px-2 py-1 bg-[#2a2a4a] text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Bottom icons */}
            <div className="flex flex-col items-center pb-1 gap-0.5">
              {ACTIVITY_ITEMS.filter((a) => a.position === 'bottom').map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id && leftOpen;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleActivityClick(item.id)}
                    className={`w-10 h-9 flex items-center justify-center transition-colors relative group ${
                      isActive ? 'text-white' : 'text-gray-600 hover:text-gray-300'
                    }`}
                    title={item.label}
                  >
                    {isActive && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r" />}
                    <Icon className="w-[18px] h-[18px]" />
                    <div className="absolute left-11 px-2 py-1 bg-[#2a2a4a] text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Left sidebar panel ─────────────────────── */}
        {effectiveLeftOpen && (
          <>
            <div style={{ width: leftWidth }} className="flex-shrink-0 overflow-hidden">
              {renderLeftPanel()}
            </div>
            <div
              className="w-1 bg-[#2a2a4a] hover:bg-primary/40 cursor-col-resize flex-shrink-0 transition-colors"
              onMouseDown={handleResize(setLeftWidth, 'x', 150, 400)}
            />
          </>
        )}

        {/* ── Center (editor + bottom panel) ─────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <RichEditor
                tabs={openTabs}
                activeTabId={activeTabId}
                onTabSelect={setActiveTabId}
                onTabClose={handleTabClose}
                content={activeFile.content}
                onContentChange={handleContentChange}
                onSelectionChange={setSelectedText}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode(!focusMode)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-[#1e1e2e] text-gray-600">
                <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm mb-1">No file open</p>
                <p className="text-xs">Select a file from the explorer to start writing</p>
              </div>
            )}
          </div>

          {effectiveBottomOpen && (
            <div
              className="h-1 bg-[#2a2a4a] hover:bg-primary/40 cursor-row-resize flex-shrink-0 transition-colors"
              onMouseDown={handleResize(setBottomHeight, 'y', 100, 400)}
            />
          )}
          {effectiveBottomOpen && (
            <div style={{ height: bottomHeight }} className="flex-shrink-0 overflow-hidden">
              <ProblemsPanel content={activeFile?.content || ''} storyBible={bible} />
            </div>
          )}
        </div>

        {/* ── Right sidebar (AI only) ────────────────── */}
        {effectiveRightOpen && (
          <>
            <div
              className="w-1 bg-[#2a2a4a] hover:bg-primary/40 cursor-col-resize flex-shrink-0 transition-colors"
              onMouseDown={handleResize(setRightWidth, 'x-right', 220, 450)}
            />
            <div style={{ width: rightWidth }} className="flex-shrink-0 overflow-hidden">
              <AIWritingPanel
                selectedText={selectedText}
                storyBible={bible}
                onInsertText={handleInsertText}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Status Bar ──────────────────────────────── */}
      <StatusBar
        wordCount={wordCount}
        charCount={charCount}
        wordGoal={settings.wordGoal || 1000}
        activeFileName={activeFile?.name || ''}
      />
    </div>
  );
}
