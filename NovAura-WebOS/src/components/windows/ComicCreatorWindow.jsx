import React, { useState, useRef, useCallback } from 'react';
import { Layout, Plus, Trash2, Type, MessageCircle, Zap, Image, Move, RotateCcw, Download, Palette } from 'lucide-react';

// ─── Comic Panel Layouts ────────────────────────────────────────────────────

const LAYOUTS = [
  { id: '1x1', name: 'Single', grid: [[1]], cols: 1, rows: 1 },
  { id: '1x2', name: '2 Strip', grid: [[1,2]], cols: 2, rows: 1 },
  { id: '2x1', name: '2 Stack', grid: [[1],[2]], cols: 1, rows: 2 },
  { id: '2x2', name: '4 Panel', grid: [[1,2],[3,4]], cols: 2, rows: 2 },
  { id: '3strip', name: '3 Strip', grid: [[1,2,3]], cols: 3, rows: 1 },
  { id: '2-1', name: 'Wide Top', grid: [[1,1],[2,3]], cols: 2, rows: 2 },
  { id: '1-2', name: 'Wide Bottom', grid: [[1,2],[3,3]], cols: 2, rows: 2 },
  { id: '3x2', name: '6 Panel', grid: [[1,2,3],[4,5,6]], cols: 3, rows: 2 },
  { id: '3x3', name: '9 Panel', grid: [[1,2,3],[4,5,6],[7,8,9]], cols: 3, rows: 3 },
  { id: 'action', name: 'Action', grid: [[1,1,2],[3,4,4]], cols: 3, rows: 2 },
];

const STYLES = [
  { id: 'manga', name: 'Manga', border: '2px solid #000', bg: '#ffffff', text: '#000000' },
  { id: 'western', name: 'Western', border: '3px solid #1a1a2e', bg: '#f5f0e8', text: '#1a1a2e' },
  { id: 'noir', name: 'Noir', border: '2px solid #333', bg: '#1a1a1a', text: '#e0e0e0' },
  { id: 'pop-art', name: 'Pop Art', border: '4px solid #ff006e', bg: '#fff200', text: '#ff006e' },
  { id: 'cyberpunk', name: 'Cyberpunk', border: '2px solid #00f0ff', bg: '#0a0020', text: '#00f0ff' },
  { id: 'watercolor', name: 'Watercolor', border: '1px solid #b8c6db', bg: '#f0e6d3', text: '#5c4a3a' },
];

const BUBBLE_TYPES = [
  { id: 'speech', name: 'Speech', shape: 'rounded-2xl', emoji: '💬' },
  { id: 'thought', name: 'Thought', shape: 'rounded-full', emoji: '💭' },
  { id: 'shout', name: 'Shout', shape: 'rounded-none', emoji: '💥' },
  { id: 'whisper', name: 'Whisper', shape: 'rounded-2xl border-dashed', emoji: '🤫' },
  { id: 'narration', name: 'Narration', shape: 'rounded-sm', emoji: '📝' },
];

const SFX_PRESETS = ['BOOM!', 'POW!', 'CRASH!', 'ZAP!', 'WHOOSH!', 'BANG!', 'SNAP!', 'WHAM!'];

const CHAR_POSES = [
  { id: 'standing', emoji: '🧍', name: 'Standing' },
  { id: 'action', emoji: '🏃', name: 'Action' },
  { id: 'sitting', emoji: '🧘', name: 'Sitting' },
  { id: 'pointing', emoji: '👉', name: 'Pointing' },
  { id: 'thinking', emoji: '🤔', name: 'Thinking' },
  { id: 'happy', emoji: '😄', name: 'Happy' },
  { id: 'angry', emoji: '😠', name: 'Angry' },
  { id: 'surprised', emoji: '😲', name: 'Surprised' },
  { id: 'sad', emoji: '😢', name: 'Sad' },
  { id: 'cool', emoji: '😎', name: 'Cool' },
];

const BG_PRESETS = [
  { id: 'city', name: 'City', gradient: 'linear-gradient(to bottom, #2c3e50 0%, #3498db 40%, #2c3e50 100%)' },
  { id: 'sunset', name: 'Sunset', gradient: 'linear-gradient(to bottom, #e74c3c 0%, #f39c12 50%, #2c3e50 100%)' },
  { id: 'forest', name: 'Forest', gradient: 'linear-gradient(to bottom, #27ae60 0%, #1a5276 100%)' },
  { id: 'space', name: 'Space', gradient: 'linear-gradient(to bottom, #0a0020 0%, #1a0040 50%, #0a0a2e 100%)' },
  { id: 'ocean', name: 'Ocean', gradient: 'linear-gradient(to bottom, #3498db 0%, #1a5276 100%)' },
  { id: 'interior', name: 'Interior', gradient: 'linear-gradient(to bottom, #d4a843 0%, #8b7355 50%, #5d4e37 100%)' },
];

function createPanel(id) {
  return {
    id,
    background: null,
    characters: [],
    bubbles: [],
    sfx: [],
  };
}

function createPage(layoutId = '2x2') {
  const layout = LAYOUTS.find(l => l.id === layoutId);
  const panelCount = new Set(layout.grid.flat()).size;
  return {
    id: Date.now().toString(36),
    layoutId,
    panels: Array.from({ length: panelCount }, (_, i) => createPanel(i + 1)),
  };
}

function loadComicsLibrary() {
  try {
    const stored = localStorage.getItem('comics_library');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [createPage('2x2')];
}

function saveComicsLibrary(updater, setPages) {
  setPages(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    try { localStorage.setItem('comics_library', JSON.stringify(next)); } catch (e) {}
    return next;
  });
}

export default function ComicCreatorWindow() {
  const [styleId, setStyleId] = useState('manga');
  const [pages, setPages] = useState(loadComicsLibrary);
  const [pageIdx, setPageIdx] = useState(0);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [tool, setTool] = useState('select'); // select | character | bubble | sfx | bg

  const style = STYLES.find(s => s.id === styleId);
  const page = pages[pageIdx];
  const layout = LAYOUTS.find(l => l.id === page.layoutId);
  const panel = selectedPanel !== null ? page.panels[selectedPanel] : null;

  const updatePanel = useCallback((panelIdx, patch) => {
    saveComicsLibrary(prev => prev.map((p, pi) => pi !== pageIdx ? p : {
      ...p,
      panels: p.panels.map((pn, i) => i !== panelIdx ? pn : { ...pn, ...patch }),
    }), setPages);
  }, [pageIdx]);

  const addCharacter = (pose) => {
    if (selectedPanel === null) return;
    updatePanel(selectedPanel, {
      characters: [...(panel?.characters || []), { id: Date.now(), pose, x: 50, y: 50 }],
    });
  };

  const addBubble = (type) => {
    if (selectedPanel === null) return;
    updatePanel(selectedPanel, {
      bubbles: [...(panel?.bubbles || []), { id: Date.now(), type, text: 'Hello!', x: 30, y: 20 }],
    });
  };

  const addSfx = (text) => {
    if (selectedPanel === null) return;
    updatePanel(selectedPanel, {
      sfx: [...(panel?.sfx || []), { id: Date.now(), text, x: 50, y: 30 }],
    });
  };

  const setBg = (bg) => {
    if (selectedPanel === null) return;
    updatePanel(selectedPanel, { background: bg });
  };

  const removeItem = (type, id) => {
    if (selectedPanel === null) return;
    updatePanel(selectedPanel, {
      [type]: panel[type].filter(item => item.id !== id),
    });
  };

  const updateBubbleText = (bubbleId, text) => {
    if (selectedPanel === null) return;
    updatePanel(selectedPanel, {
      bubbles: panel.bubbles.map(b => b.id === bubbleId ? { ...b, text } : b),
    });
  };

  const addPage = () => {
    saveComicsLibrary(prev => [...prev, createPage('2x2')], setPages);
    setPageIdx(pages.length);
    setSelectedPanel(null);
  };

  const changeLayout = (layoutId) => {
    const newLayout = LAYOUTS.find(l => l.id === layoutId);
    const panelCount = new Set(newLayout.grid.flat()).size;
    saveComicsLibrary(prev => prev.map((p, i) => i !== pageIdx ? p : {
      ...p,
      layoutId,
      panels: Array.from({ length: panelCount }, (_, j) => p.panels[j] || createPanel(j + 1)),
    }), setPages);
    setSelectedPanel(null);
  };

  // Render the grid layout
  const renderGrid = () => {
    const gridAreas = layout.grid.map((row, ri) => `"${row.map(c => `p${c}`).join(' ')}"`).join(' ');
    const panelIds = [...new Set(layout.grid.flat())];

    return (
      <div className="w-full aspect-[3/4] max-h-full" style={{
        display: 'grid',
        gridTemplateAreas: gridAreas,
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        gap: '4px',
        padding: '4px',
        background: style.text,
        borderRadius: '4px',
      }}>
        {panelIds.map((pid, idx) => {
          const p = page.panels[idx];
          const isSelected = selectedPanel === idx;
          return (
            <div key={pid} onClick={() => setSelectedPanel(idx)}
              style={{ gridArea: `p${pid}`, background: p?.background ? undefined : style.bg, border: isSelected ? '2px solid #00f0ff' : style.border, backgroundImage: p?.background || undefined, cursor: 'pointer' }}
              className="relative overflow-hidden rounded-sm flex items-center justify-center">
              {/* Characters */}
              {p?.characters?.map(ch => (
                <div key={ch.id} className="absolute text-2xl" style={{ left: `${ch.x}%`, top: `${ch.y}%`, transform: 'translate(-50%,-50%)' }}>
                  {CHAR_POSES.find(cp => cp.id === ch.pose)?.emoji || '🧍'}
                </div>
              ))}
              {/* Bubbles */}
              {p?.bubbles?.map(b => {
                const bt = BUBBLE_TYPES.find(bt => bt.id === b.type);
                return (
                  <div key={b.id} className={`absolute px-2 py-1 text-[8px] max-w-[60%] ${bt?.shape || 'rounded-2xl'}`}
                    style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%,-50%)', background: 'white', color: '#000', border: b.type === 'shout' ? '2px solid #e74c3c' : '1px solid #888' }}>
                    {b.text}
                  </div>
                );
              })}
              {/* SFX */}
              {p?.sfx?.map(s => (
                <div key={s.id} className="absolute font-black text-sm italic" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%,-50%) rotate(-5deg)', color: style.id === 'cyberpunk' ? '#ff006e' : '#e74c3c', textShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}>
                  {s.text}
                </div>
              ))}
              {/* Empty hint */}
              {!p?.characters?.length && !p?.bubbles?.length && !p?.sfx?.length && (
                <span className="text-xs opacity-30" style={{ color: style.text }}>Panel {idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-orange-900/40 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-orange-400" />
          <span className="font-semibold text-sm">Comic Creator</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>Page {pageIdx + 1}/{pages.length}</span>
          <button onClick={addPage} className="p-1 bg-slate-800 hover:bg-slate-700 rounded"><Plus className="w-3 h-3" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Tools */}
        <div className="w-52 border-r border-slate-800 p-2 space-y-3 overflow-y-auto shrink-0">
          {/* Style */}
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block font-medium">STYLE</label>
            <div className="grid grid-cols-2 gap-1">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyleId(s.id)}
                  className={`px-2 py-1 rounded text-[10px] transition-all ${styleId===s.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block font-medium">LAYOUT</label>
            <div className="grid grid-cols-5 gap-1">
              {LAYOUTS.map(l => (
                <button key={l.id} onClick={() => changeLayout(l.id)}
                  className={`p-1.5 rounded text-[8px] transition-all ${page.layoutId===l.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`} title={l.name}>
                  {l.name.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block font-medium">TOOLS</label>
            <div className="grid grid-cols-2 gap-1">
              {[['character','Characters','🧍'],['bubble','Bubbles','💬'],['sfx','SFX','💥'],['bg','Backgrounds','🎨']].map(([id,name,emoji]) => (
                <button key={id} onClick={() => setTool(id)}
                  className={`px-2 py-1.5 rounded text-[10px] transition-all flex items-center gap-1 ${tool===id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {emoji} {name}
                </button>
              ))}
            </div>
          </div>

          {/* Tool-specific options */}
          {selectedPanel !== null && tool === 'character' && (
            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">ADD CHARACTER</label>
              <div className="grid grid-cols-5 gap-1">
                {CHAR_POSES.map(cp => (
                  <button key={cp.id} onClick={() => addCharacter(cp.id)} title={cp.name}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-sm">{cp.emoji}</button>
                ))}
              </div>
            </div>
          )}

          {selectedPanel !== null && tool === 'bubble' && (
            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">ADD BUBBLE</label>
              <div className="space-y-1">
                {BUBBLE_TYPES.map(bt => (
                  <button key={bt.id} onClick={() => addBubble(bt.id)}
                    className="w-full px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-left flex items-center gap-2">
                    {bt.emoji} {bt.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedPanel !== null && tool === 'sfx' && (
            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">ADD SFX</label>
              <div className="grid grid-cols-2 gap-1">
                {SFX_PRESETS.map(s => (
                  <button key={s} onClick={() => addSfx(s)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-red-400">{s}</button>
                ))}
              </div>
            </div>
          )}

          {selectedPanel !== null && tool === 'bg' && (
            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">SET BACKGROUND</label>
              <div className="grid grid-cols-2 gap-1">
                {BG_PRESETS.map(bg => (
                  <button key={bg.id} onClick={() => setBg(bg.gradient)}
                    className="h-10 rounded text-[8px] text-white font-medium flex items-end justify-center pb-0.5"
                    style={{ background: bg.gradient }}>{bg.name}</button>
                ))}
                <button onClick={() => setBg(null)} className="h-10 rounded text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center">Clear</button>
              </div>
            </div>
          )}

          {/* Panel contents */}
          {panel && (panel.characters.length > 0 || panel.bubbles.length > 0 || panel.sfx.length > 0) && (
            <div>
              <label className="text-[10px] text-slate-400 mb-1 block font-medium">PANEL ITEMS</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {panel.characters.map(ch => (
                  <div key={ch.id} className="flex items-center justify-between bg-slate-900 rounded px-2 py-1 text-[10px]">
                    <span>{CHAR_POSES.find(cp=>cp.id===ch.pose)?.emoji} {CHAR_POSES.find(cp=>cp.id===ch.pose)?.name}</span>
                    <button onClick={() => removeItem('characters', ch.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-2.5 h-2.5" /></button>
                  </div>
                ))}
                {panel.bubbles.map(b => (
                  <div key={b.id} className="bg-slate-900 rounded px-2 py-1">
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span>{BUBBLE_TYPES.find(bt=>bt.id===b.type)?.emoji} {b.type}</span>
                      <button onClick={() => removeItem('bubbles', b.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-2.5 h-2.5" /></button>
                    </div>
                    <input value={b.text} onChange={e => updateBubbleText(b.id, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-white" />
                  </div>
                ))}
                {panel.sfx.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-slate-900 rounded px-2 py-1 text-[10px]">
                    <span className="font-bold text-red-400">{s.text}</span>
                    <button onClick={() => removeItem('sfx', s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-2.5 h-2.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-slate-900/30">
          <div className="w-full max-w-md">
            {renderGrid()}
          </div>
        </div>

        {/* Right: Page navigation */}
        <div className="w-20 border-l border-slate-800 p-2 overflow-y-auto shrink-0">
          <label className="text-[10px] text-slate-400 mb-2 block text-center">Pages</label>
          <div className="space-y-2">
            {pages.map((_, i) => (
              <button key={i} onClick={() => { setPageIdx(i); setSelectedPanel(null); }}
                className={`w-full aspect-[3/4] rounded border text-[10px] font-medium transition-all ${pageIdx===i ? 'border-orange-500 bg-orange-900/20 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={addPage} className="w-full aspect-[3/4] rounded border border-dashed border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
