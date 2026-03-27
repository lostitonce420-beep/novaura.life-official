import React, { useState } from 'react';
import { Shirt, Palette, Save, Trash2, Eye, Download, Plus, Settings, Grid } from 'lucide-react';

const TYPES = ['top','bottom','dress','shoes','hat','coat','accessory','full-body'];
const CATEGORIES = ['casual','formal','athletic','fantasy','futuristic','historical','gothic'];
const FITS = ['fitted','loose','oversized','slim','relaxed'];
const PATTERNS = ['none','stripes','checkered','polka-dots','floral','geometric','gradient','camo'];
const PALETTE = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E2','#2C3E50','#1ABC9C','#E74C3C','#9B59B6','#F39C12','#00D9FF','#FF00FF','#00FFAA'];

const TYPE_EMOJI = { top:'👕', bottom:'👖', dress:'👗', shoes:'👟', hat:'🎩', coat:'🧥', accessory:'💍', 'full-body':'🦸' };

export default function ClothingCreatorWindow() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clothing_items') || '[]'); } catch { return []; }
  });
  const [current, setCurrent] = useState({
    name: 'New Item', type: 'top', category: 'casual', baseColor: '#4ECDC4',
    accentColor: '#FF6B6B', fit: 'fitted', pattern: 'none', patternColor: '#2C3E50',
    patternOpacity: 0.3, isPublic: false,
  });
  const [view, setView] = useState('editor'); // editor | wardrobe

  const saveItem = () => {
    if (!current.name.trim()) return;
    const item = { ...current, id: `item-${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [...items, item];
    setItems(updated);
    localStorage.setItem('clothing_items', JSON.stringify(updated));
    setCurrent({ ...current, name: 'New Item' });
  };

  const deleteItem = (id) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem('clothing_items', JSON.stringify(updated));
  };

  const loadItem = (item) => {
    setCurrent(item);
    setView('editor');
  };

  // Simple visual preview
  const Preview = ({ item, size = 'large' }) => {
    const s = size === 'large';
    return (
      <div className={`${s ? 'w-36 h-48' : 'w-16 h-20'} rounded-lg border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden`}
        style={{ background: `linear-gradient(135deg, ${item.baseColor}40, ${item.accentColor}20)` }}>
        {item.pattern !== 'none' && (
          <div className="absolute inset-0" style={{
            opacity: item.patternOpacity || 0.3,
            backgroundImage: item.pattern === 'stripes' ? `repeating-linear-gradient(45deg, ${item.patternColor}20, ${item.patternColor}20 ${s?4:2}px, transparent ${s?4:2}px, transparent ${s?8:4}px)`
              : item.pattern === 'checkered' ? `repeating-conic-gradient(${item.patternColor}20 0% 25%, transparent 0% 50%)`
              : item.pattern === 'polka-dots' ? `radial-gradient(circle, ${item.patternColor}30 ${s?2:1}px, transparent ${s?2:1}px)`
              : item.pattern === 'gradient' ? `linear-gradient(to bottom, ${item.baseColor}, ${item.accentColor})` : 'none',
            backgroundSize: item.pattern === 'checkered' ? `${s?12:6}px ${s?12:6}px`
              : item.pattern === 'polka-dots' ? `${s?10:5}px ${s?10:5}px` : undefined,
          }} />
        )}
        <span className={s ? 'text-5xl' : 'text-xl'}>{TYPE_EMOJI[item.type] || '👕'}</span>
        {s && <div className="text-[10px] text-white/70 mt-2 font-medium">{item.name}</div>}
        {s && <div className="text-[8px] text-white/40 capitalize">{item.category} · {item.fit}</div>}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-pink-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-semibold">Clothing Creator</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('editor')} className={`px-2 py-0.5 rounded text-[10px] ${view === 'editor' ? 'bg-pink-600/40 text-pink-300' : 'text-slate-400 hover:bg-slate-800'}`}>Editor</button>
          <button onClick={() => setView('wardrobe')} className={`px-2 py-0.5 rounded text-[10px] ${view === 'wardrobe' ? 'bg-pink-600/40 text-pink-300' : 'text-slate-400 hover:bg-slate-800'}`}>Wardrobe ({items.length})</button>
        </div>
      </div>

      {view === 'editor' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Controls */}
          <div className="w-48 border-r border-slate-800 p-3 space-y-3 overflow-y-auto shrink-0">
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">NAME</label>
              <input value={current.name} onChange={e => setCurrent({...current, name: e.target.value})}
                className="w-full px-2 py-1 bg-black/30 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-pink-500/50" />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">TYPE</label>
              <select value={current.type} onChange={e => setCurrent({...current, type: e.target.value})}
                className="w-full px-2 py-1 bg-black/30 border border-slate-700 rounded text-xs text-white focus:outline-none">
                {TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">CATEGORY</label>
              <select value={current.category} onChange={e => setCurrent({...current, category: e.target.value})}
                className="w-full px-2 py-1 bg-black/30 border border-slate-700 rounded text-xs text-white focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">FIT</label>
              <div className="flex flex-wrap gap-1">
                {FITS.map(f => (
                  <button key={f} onClick={() => setCurrent({...current, fit: f})}
                    className={`px-1.5 py-0.5 rounded text-[9px] capitalize ${current.fit === f ? 'bg-pink-600/40 text-pink-300' : 'bg-slate-800 text-slate-400'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">BASE COLOR</label>
              <div className="flex flex-wrap gap-1">
                {PALETTE.slice(0,8).map(c => (
                  <button key={c} onClick={() => setCurrent({...current, baseColor: c})}
                    className={`w-5 h-5 rounded-sm border-2 ${current.baseColor === c ? 'border-white' : 'border-slate-700'}`} style={{backgroundColor: c}} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">ACCENT</label>
              <div className="flex flex-wrap gap-1">
                {PALETTE.slice(8).map(c => (
                  <button key={c} onClick={() => setCurrent({...current, accentColor: c})}
                    className={`w-5 h-5 rounded-sm border-2 ${current.accentColor === c ? 'border-white' : 'border-slate-700'}`} style={{backgroundColor: c}} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block mb-1">PATTERN</label>
              <select value={current.pattern} onChange={e => setCurrent({...current, pattern: e.target.value})}
                className="w-full px-2 py-1 bg-black/30 border border-slate-700 rounded text-xs text-white focus:outline-none">
                {PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={saveItem} className="w-full py-1.5 bg-pink-600/60 hover:bg-pink-500/60 border border-pink-700 rounded text-xs text-pink-200 flex items-center justify-center gap-1">
              <Save className="w-3 h-3" /> Save to Wardrobe
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 flex items-center justify-center">
            <Preview item={current} />
          </div>
        </div>
      ) : (
        /* Wardrobe */
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No items saved yet. Create one in the Editor!</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map(item => (
                <div key={item.id} className="relative group">
                  <button onClick={() => loadItem(item)} className="w-full">
                    <Preview item={item} size="small" />
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-2.5 h-2.5 text-white" />
                  </button>
                  <div className="text-[9px] text-slate-400 text-center truncate mt-0.5">{item.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
