import React, { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { X, FileCode } from 'lucide-react';
import useBuilderStore from './useBuilderStore';

// ── File icon color by extension ────────────────────────────
function tabColor(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    js: 'text-yellow-400', jsx: 'text-cyan-400', ts: 'text-blue-400', tsx: 'text-blue-300',
    html: 'text-orange-400', css: 'text-purple-400', scss: 'text-pink-400',
    json: 'text-green-400', md: 'text-gray-300', py: 'text-green-300',
  };
  return map[ext] || 'text-gray-400';
}

export default function EditorTabs() {
  const {
    openTabs, activeTab, setActiveTab, closeTab,
    findNode, updateFileContent, saveFile, saveAll, detectLang, dirty,
  } = useBuilderStore();
  const editorRef = useRef(null);

  const activeNode = activeTab ? findNode(activeTab) : null;

  const handleMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Register Ctrl+S → save current file
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        const state = useBuilderStore.getState();
        if (state.activeTab) saveFile(state.activeTab);
      },
    });

    // Register Ctrl+Shift+S → save all
    editor.addAction({
      id: 'save-all',
      label: 'Save All Files',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
      run: () => saveAll(),
    });

    // Theme customization
    monaco.editor.defineTheme('novaura', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00f0ff' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: 'ff7b72' },
        { token: 'type', foreground: 'bb9af7' },
        { token: 'function', foreground: 'd2a8ff' },
      ],
      colors: {
        'editor.background': '#0d0d1a',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f7844',
        'editorCursor.foreground': '#00f0ff',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#00f0ff',
        'editor.selectionHighlightBackground': '#3fb95020',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
      },
    });
    monaco.editor.setTheme('novaura');

    editor.focus();
  }, [saveFile, saveAll]);

  const handleChange = useCallback((value) => {
    if (activeTab && value !== undefined) {
      updateFileContent(activeTab, value);
    }
  }, [activeTab, updateFileContent]);

  if (openTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
        <FileCode className="w-12 h-12 text-gray-600" />
        <p className="text-sm">No files open</p>
        <p className="text-xs text-gray-600">Open a file from the explorer or create a new one</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center bg-[#0d0d1a] overflow-x-auto scrollbar-none cybeni-toolbar">
        {openTabs.map((tabId) => {
          const node = findNode(tabId);
          if (!node) return null;
          const isActive = tabId === activeTab;
          const isDirty = dirty[tabId];

          return (
            <div
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`group flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-white/5 min-w-0 shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#0d0d1a] text-gray-200 cybeni-tab-active'
                  : 'bg-[#080812] text-gray-500 hover:text-gray-300'
              }`}
            >
              <FileCode className={`w-3 h-3 shrink-0 ${tabColor(node.name)}`} />
              <span className="truncate max-w-[120px]">{node.name}</span>
              {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}
                className="ml-1 p-0.5 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Monaco editor */}
      <div className="flex-1">
        {activeNode && (
          <Editor
            key={activeTab}
            height="100%"
            language={detectLang(activeNode.name)}
            value={activeNode.content || ''}
            onChange={handleChange}
            onMount={handleMount}
            theme="novaura"
            options={{
              minimap: { enabled: true, size: 'proportional', maxColumn: 80 },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              bracketPairColorization: { enabled: true },
              renderLineHighlight: 'all',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              padding: { top: 8 },
              suggest: { showKeywords: true, showSnippets: true },
              quickSuggestions: true,
              parameterHints: { enabled: true },
              folding: true,
              foldingStrategy: 'indentation',
              formatOnPaste: true,
              renderWhitespace: 'selection',
              guides: { bracketPairs: true },
            }}
          />
        )}
      </div>
    </div>
  );
}
