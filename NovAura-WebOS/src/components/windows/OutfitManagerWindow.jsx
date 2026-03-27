import React, { useState, useMemo } from 'react';
import { Shirt, Plus, Trash2, Copy, ArrowLeft, Shuffle, Tag, Sun, Snowflake, Cloud, Leaf, Star, Sparkles, Edit3 } from 'lucide-react';

const OCCASIONS = ['casual', 'formal', 'sport', 'creative', 'party'];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all'];
const OCCASION_EMOJI = { casual: '👕', formal: '👔', sport: '🏃', creative: '🎨', party: '🎉' };
const SEASON_EMOJI = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️', all: '🌍' };

export default function OutfitManagerWindow() {
  const [outfits, setOutfits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('managed_outfits') || '[]'); } catch { return []; }
  });
  const [wardrobe] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clothing_items') || '[]'); } catch { return []; }
  });
  const [view, setView] = useState('list'); // list | create | detail
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  // Create form
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('casual');
  const [season, setSeason] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterCat, setFilterCat] = useState('all');

  const save = (updated) => { setOutfits(updated); localStorage.setItem('managed_outfits', JSON.stringify(updated)); };

  const createOutfit = () => {
    if (!name.trim()) return;
    const outfit = {
      id: `outfit-${Date.now()}`,
      name: name.trim(),
      occasion, season,
      itemIds: selectedItems,
      createdAt: new Date().toISOString(),
    };
    save([...outfits, outfit]);
    setName(''); setSelectedItems([]); setView('list');
  };

  const deleteOutfit = (id) => { save(outfits.filter(o => o.id !== id)); if (selectedOutfit?.id === id) setView('list'); };
  const duplicateOutfit = (outfit) => {
    const dupe = { ...outfit, id: `outfit-${Date.now()}`, name: `${outfit.name} (copy)`, createdAt: new Date().toISOString() };
    save([...outfits, dupe]);
  };

  const randomOutfit = () => {
    if (wardrobe.length < 2) return;
    const count = Math.min(wardrobe.length, 3 + Math.floor(Math.random() * 3));
    const shuffled = [...wardrobe].sort(() => Math.random() - 0.5);
    setSelectedItems(shuffled.slice(0, count).map(i => i.id || `item-${Math.random()}`));
    setName('Random Mix');
    setView('create');
  };

  const toggleItem = (itemId) => {
    setSelectedItems(prev => prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]);
  };

  const getItemById = (id) => wardrobe.find(w => w.id === id || `item-${wardrobe.indexOf(w)}` === id);

  const filteredWardrobe = useMemo(() => {
    return wardrobe.map((w, i) => ({ ...w, id: w.id || `item-${i}` }))
      .filter(w => filterCat === 'all' || w.type === filterCat);
  }, [wardrobe, filterCat]);

  const categories = useMemo(() => [...new Set(wardrobe.map(w => w.type).filter(Boolean))], [wardrobe]);

  // Detail view
  if (view === 'detail' && selectedOutfit) {
    const items = selectedOutfit.itemIds.map(id => wardrobe.find((w, i) => (w.id || `item-${i}`) === id)).filter(Boolean);
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-900/30 to-violet-900/30 border-b border-slate-800 shrink-0">
          <button onClick={() => setView('list')} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold truncate">{selectedOutfit.name}</span>
          <div className="flex gap-1 ml-auto">
            <button onClick={() => duplicateOutfit(selectedOutfit)} className="p-1 hover:bg-slate-800 rounded text-slate-400" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
            <button onClick={() => deleteOutfit(selectedOutfit.id)} className="p-1 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{OCCASION_EMOJI[selectedOutfit.occasion] || '👕'}</span>
            <div>
              <div className="text-xs text-slate-400 capitalize">{selectedOutfit.occasion} · {selectedOutfit.season}</div>
              <div className="text-[9px] text-slate-600">{items.length} items · {new Date(selectedOutfit.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {items.map((item, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40">
                <div className="w-full h-12 rounded mb-1.5" style={{
                  background: item.colors?.length > 1
                    ? `linear-gradient(135deg, ${item.colors.join(', ')})`
                    : item.colors?.[0] || item.color || '#666'
                }} />
                <div className="text-[10px] font-medium truncate">{item.name || item.type || 'Item'}</div>
                <div className="text-[8px] text-slate-500 capitalize">{item.type || 'clothing'}</div>
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">No items found in wardrobe for this outfit</div>
          )}
        </div>
      </div>
    );
  }

  // Create view
  if (view === 'create') {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-900/30 to-violet-900/30 border-b border-slate-800 shrink-0">
          <button onClick={() => setView('list')} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <Plus className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-semibold">New Outfit</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Outfit name..."
            className="w-full px-3 py-2 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-600/50" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[9px] text-slate-500 uppercase mb-1">Occasion</div>
              <div className="flex flex-wrap gap-1">
                {OCCASIONS.map(o => (
                  <button key={o} onClick={() => setOccasion(o)}
                    className={`px-2 py-1 rounded text-[9px] capitalize transition-all ${occasion === o ? 'bg-pink-500/30 text-pink-300 border border-pink-600/50' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                    {OCCASION_EMOJI[o]} {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 uppercase mb-1">Season</div>
              <div className="flex flex-wrap gap-1">
                {SEASONS.map(s => (
                  <button key={s} onClick={() => setSeason(s)}
                    className={`px-2 py-1 rounded text-[9px] capitalize transition-all ${season === s ? 'bg-violet-500/30 text-violet-300 border border-violet-600/50' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                    {SEASON_EMOJI[s]} {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[9px] text-slate-500 uppercase">Select Items ({selectedItems.length})</div>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] text-slate-400">
                <option value="all">All</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {filteredWardrobe.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-slate-500">No items in wardrobe. Create clothing first!</div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                {filteredWardrobe.map(item => (
                  <button key={item.id} onClick={() => toggleItem(item.id)}
                    className={`p-2 rounded border text-center transition-all ${selectedItems.includes(item.id) ? 'border-pink-500 bg-pink-900/20' : 'border-slate-800 bg-slate-900/30 hover:border-slate-600'}`}>
                    <div className="w-full h-6 rounded mb-1" style={{
                      background: item.colors?.length > 1 ? `linear-gradient(135deg, ${item.colors.join(', ')})` : item.colors?.[0] || item.color || '#666'
                    }} />
                    <div className="text-[8px] truncate">{item.name || item.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={createOutfit} disabled={!name.trim()}
            className="w-full py-2 bg-pink-600/50 hover:bg-pink-500/50 border border-pink-700 rounded-lg text-xs text-pink-200 font-medium disabled:opacity-30">
            Create Outfit
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-pink-900/30 to-violet-900/30 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-semibold">Outfit Manager</span>
          <span className="text-[10px] text-slate-500">{outfits.length} outfits</span>
        </div>
        <div className="flex gap-1">
          <button onClick={randomOutfit} disabled={wardrobe.length < 2}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-violet-400 disabled:opacity-30" title="Random Mix">
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setName(''); setSelectedItems([]); setView('create'); }}
            className="p-1.5 bg-pink-600/40 hover:bg-pink-500/40 rounded text-pink-300">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {outfits.length === 0 ? (
          <div className="text-center py-8">
            <Shirt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-xs text-slate-500 mb-3">No outfits yet</div>
            <button onClick={() => setView('create')} className="px-4 py-2 bg-pink-600/40 hover:bg-pink-500/40 rounded-lg text-xs text-pink-300">
              Create First Outfit
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {outfits.slice().reverse().map(outfit => (
              <button key={outfit.id} onClick={() => { setSelectedOutfit(outfit); setView('detail'); }}
                className="w-full text-left p-3 rounded-lg bg-slate-900/40 border border-slate-800 hover:border-pink-600/30 transition-all group">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{OCCASION_EMOJI[outfit.occasion] || '👕'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{outfit.name}</div>
                    <div className="text-[9px] text-slate-500 capitalize">{outfit.occasion} · {outfit.season} · {outfit.itemIds.length} items</div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span onClick={e => { e.stopPropagation(); duplicateOutfit(outfit); }} className="p-1 hover:bg-slate-800 rounded text-slate-500"><Copy className="w-3 h-3" /></span>
                    <span onClick={e => { e.stopPropagation(); deleteOutfit(outfit.id); }} className="p-1 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
