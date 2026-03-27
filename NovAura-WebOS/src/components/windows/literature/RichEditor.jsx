import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Highlighter, Type, Maximize2, Minimize2, Undo2, Redo2, X, Search,
  Replace, Heading1, Heading2, Heading3, Quote, Minus,
} from 'lucide-react';

function ToolBtn({ icon: Icon, onClick, active, title, small }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1 rounded transition-colors ${
        active ? 'bg-primary/30 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/10'
      } ${small ? 'w-5 h-5' : ''}`}
      title={title}
    >
      <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    </button>
  );
}

export default function RichEditor({
  tabs = [],
  activeTabId,
  onTabSelect,
  onTabClose,
  content = '',
  onContentChange,
  onSelectionChange,
  focusMode = false,
  onToggleFocusMode,
}) {
  const editorRef = useRef(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [fontSize, setFontSize] = useState('16');

  // Sync content into editor when file changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || '';
    }
  }, [activeTabId, content]);

  const exec = useCallback((cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }, []);

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || '';
    onContentChange?.(html);
  };

  const handleSelect = () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) {
      onSelectionChange?.(sel.toString());
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+F → find
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      setShowFindReplace(true);
    }
    // Ctrl+B → bold
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); exec('bold'); }
    // Ctrl+I → italic
    if (e.ctrlKey && e.key === 'i') { e.preventDefault(); exec('italic'); }
    // Ctrl+U → underline
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); exec('underline'); }
    // Ctrl+Z → undo
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); exec('undo'); }
    // Ctrl+Y → redo
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); exec('redo'); }
    // Tab → indent
    if (e.key === 'Tab') {
      e.preventDefault();
      exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  };

  const handleFind = () => {
    if (!findText) return;
    window.find(findText, false, false, true);
  };

  const handleReplace = () => {
    if (!findText) return;
    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === findText.toLowerCase()) {
      exec('insertText', replaceText);
    }
    handleFind();
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || !findText) return;
    const html = editorRef.current.innerHTML;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    editorRef.current.innerHTML = html.replace(regex, replaceText);
    handleInput();
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      {/* Tabs */}
      <div className="flex items-center bg-[#1a1a2e] border-b border-[#2a2a4a] overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] cursor-pointer border-r border-[#2a2a4a] min-w-0 ${
              tab.id === activeTabId
                ? 'bg-[#1e1e2e] text-white border-t-2 border-t-primary'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#222238]'
            }`}
            onClick={() => onTabSelect(tab.id)}
          >
            <FileIcon />
            <span className="truncate max-w-[100px]">{tab.name}</span>
            {tab.modified && <span className="text-primary">*</span>}
            <button
              onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}
              className="ml-1 hover:text-red-400 opacity-50 hover:opacity-100"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Format Toolbar */}
      {!focusMode && (
        <div className="flex items-center gap-0.5 px-2 py-1 bg-[#1a1a2e] border-b border-[#2a2a4a] flex-wrap">
          <ToolBtn icon={Undo2} onClick={() => exec('undo')} title="Undo (Ctrl+Z)" />
          <ToolBtn icon={Redo2} onClick={() => exec('redo')} title="Redo (Ctrl+Y)" />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolBtn icon={Bold} onClick={() => exec('bold')} title="Bold (Ctrl+B)" />
          <ToolBtn icon={Italic} onClick={() => exec('italic')} title="Italic (Ctrl+I)" />
          <ToolBtn icon={Underline} onClick={() => exec('underline')} title="Underline (Ctrl+U)" />
          <ToolBtn icon={Strikethrough} onClick={() => exec('strikeThrough')} title="Strikethrough" />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolBtn icon={Heading1} onClick={() => exec('formatBlock', 'h1')} title="Heading 1" />
          <ToolBtn icon={Heading2} onClick={() => exec('formatBlock', 'h2')} title="Heading 2" />
          <ToolBtn icon={Heading3} onClick={() => exec('formatBlock', 'h3')} title="Heading 3" />
          <ToolBtn icon={Quote} onClick={() => exec('formatBlock', 'blockquote')} title="Quote" />
          <ToolBtn icon={Minus} onClick={() => exec('insertHorizontalRule')} title="Divider" />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolBtn icon={AlignLeft} onClick={() => exec('justifyLeft')} title="Align Left" />
          <ToolBtn icon={AlignCenter} onClick={() => exec('justifyCenter')} title="Center" />
          <ToolBtn icon={AlignRight} onClick={() => exec('justifyRight')} title="Align Right" />
          <ToolBtn icon={AlignJustify} onClick={() => exec('justifyFull')} title="Justify" />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolBtn icon={List} onClick={() => exec('insertUnorderedList')} title="Bullet List" />
          <ToolBtn icon={ListOrdered} onClick={() => exec('insertOrderedList')} title="Numbered List" />
          <div className="w-px h-4 bg-gray-700 mx-1" />
          <ToolBtn
            icon={Highlighter}
            onClick={() => exec('hiliteColor', '#ffe066')}
            title="Highlight"
          />
          {/* Font size */}
          <select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              editorRef.current?.focus();
              exec('fontSize', '7');
              // Fix font size via CSS
              const fontEls = editorRef.current?.querySelectorAll('font[size="7"]');
              fontEls?.forEach((el) => {
                el.removeAttribute('size');
                el.style.fontSize = e.target.value + 'px';
              });
            }}
            className="bg-[#2a2a4a] text-gray-300 text-[10px] rounded px-1 py-0.5 border border-gray-700 outline-none"
          >
            {[12, 14, 16, 18, 20, 24, 28, 32, 36].map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
          <div className="flex-1" />
          <ToolBtn icon={Search} onClick={() => setShowFindReplace(!showFindReplace)} title="Find & Replace (Ctrl+F)" />
          <ToolBtn icon={focusMode ? Minimize2 : Maximize2} onClick={onToggleFocusMode} title="Focus Mode" />
        </div>
      )}

      {/* Find & Replace bar */}
      {showFindReplace && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#222238] border-b border-[#2a2a4a]">
          <Search className="w-3 h-3 text-gray-500" />
          <input
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFind()}
            placeholder="Find..."
            className="bg-[#1a1a2e] text-white text-[11px] px-2 py-0.5 rounded border border-gray-700 outline-none w-32"
          />
          <Replace className="w-3 h-3 text-gray-500" />
          <input
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace..."
            className="bg-[#1a1a2e] text-white text-[11px] px-2 py-0.5 rounded border border-gray-700 outline-none w-32"
          />
          <button onClick={handleFind} className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 bg-[#2a2a4a] rounded">Find</button>
          <button onClick={handleReplace} className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 bg-[#2a2a4a] rounded">Replace</button>
          <button onClick={handleReplaceAll} className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 bg-[#2a2a4a] rounded">All</button>
          <button onClick={() => setShowFindReplace(false)} className="text-gray-500 hover:text-white ml-auto">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Editor surface */}
      <div className="flex-1 overflow-auto flex justify-center py-8 px-4" style={{ background: '#2a2a3a' }}>
        <div
          className="w-full max-w-[700px] min-h-[800px] bg-white rounded shadow-xl"
          style={{ padding: '60px 72px', fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            className="outline-none text-gray-900 leading-relaxed"
            style={{
              fontSize: `${fontSize}px`,
              minHeight: '600px',
              lineHeight: '1.8',
              caretColor: '#7c3aed',
            }}
            spellCheck
          />
        </div>
      </div>
    </div>
  );
}

function FileIcon() {
  return <div className="w-2 h-2 rounded-sm bg-blue-400 flex-shrink-0" />;
}
