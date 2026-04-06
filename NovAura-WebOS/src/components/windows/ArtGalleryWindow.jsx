import React, { useState } from 'react';
import { Image, Search, Filter, Grid, List, Star, Download, Eye, Heart, ArrowLeft } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

// Art Gallery - Loads from backend API or local storage
// No demo data - only real uploaded assets

const ART_TYPES = ['all', 'featured', 'background', 'sprite', 'animation', 'procedural', 'clothing', 'avatar', 'hand-drawn'];

export default function ArtGalleryWindow() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [liked, setLiked] = useState(new Set());
  const [tab, setTab] = useState('community'); // community | mine
  const [communityPieces, setCommunityPieces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load community pieces from backend
  useEffect(() => {
    const loadAssets = async () => {
      try {
        setIsLoading(true);
        const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://us-central1-novaura-systems.cloudfunctions.net/api').replace(/\/$/, '');
        const response = await fetch(`${BACKEND_URL}/assets`);
        if (response.ok) {
          const data = await response.json();
          setCommunityPieces(data.assets || []);
        }
      } catch (err) {
        console.error('Failed to load assets:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAssets();
  }, []);

  const customArt = (() => { try { return JSON.parse(kernelStorage.getItem('art_gallery_custom') || '[]'); } catch { return []; } })();

  const allPieces = tab === 'mine'
    ? customArt.map(a => ({ id: a.id, title: a.title, type: 'hand-drawn', tags: ['custom'], author: 'You', featured: false, likes: 0, art: '🎨', color: 'from-cyan-900/40 to-slate-900', dataUrl: a.dataUrl }))
    : communityPieces;

  const filtered = allPieces.filter(p => {
    if (filter === 'featured') return p.featured;
    if (filter !== 'all' && p.type !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.tags.some(t => t.includes(search.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'newest') return String(b.id).localeCompare(String(a.id));
    return a.title.localeCompare(b.title);
  });

  const toggleLike = (id) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Detail view
  if (selected) {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border-b border-slate-800 shrink-0">
          <button onClick={() => setSelected(null)} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium">{selected.title}</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className={`w-64 h-64 rounded-2xl bg-gradient-to-br ${selected.color} border border-slate-700 flex items-center justify-center`}>
            <span className="text-8xl">{selected.art}</span>
          </div>
        </div>
        <div className="px-4 py-3 bg-black/30 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">{selected.title}</div>
              <div className="text-[10px] text-slate-400">by {selected.author} · {selected.type}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleLike(selected.id)}
                className={`p-2 rounded-lg transition-all ${liked.has(selected.id) ? 'bg-red-600/30 text-red-400' : 'bg-slate-800 text-slate-400 hover:text-red-400'}`}>
                <Heart className={`w-4 h-4 ${liked.has(selected.id) ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {selected.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-800 rounded-full text-[9px] text-slate-400">{t}</span>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gradient-to-r from-pink-900/30 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-semibold">Art Gallery</span>
            <button onClick={() => setTab('community')} className={`text-[10px] px-1.5 py-0.5 rounded ${tab === 'community' ? 'bg-pink-600/30 text-pink-300' : 'text-slate-500'}`}>Community</button>
            <button onClick={() => setTab('mine')} className={`text-[10px] px-1.5 py-0.5 rounded ${tab === 'mine' ? 'bg-pink-600/30 text-pink-300' : 'text-slate-500'}`}>My Art ({customArt.length})</button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><Grid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><List className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-3 py-2 space-y-2 border-b border-slate-800/50 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search gallery..."
            className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ART_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-2 py-0.5 rounded text-[10px] capitalize transition-all ${filter === t ? 'bg-pink-600/40 text-pink-300' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700'}`}>
              {t === 'featured' ? '⭐ Featured' : t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500">Sort:</span>
          {['popular','newest','alpha'].map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`text-[10px] capitalize ${sortBy === s ? 'text-pink-400' : 'text-slate-500 hover:text-slate-300'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Gallery */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading && tab === 'community' && (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500 text-xs">Loading assets...</div>
          </div>
        )}
        
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Image className="w-10 h-10 mb-3 opacity-30" />
            <div className="text-xs">{tab === 'mine' ? 'No custom art yet' : 'No assets in gallery'}</div>
          </div>
        )}

        {!isLoading && filtered.length > 0 && viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map(piece => (
              <button key={piece.id} onClick={() => setSelected(piece)}
                className={`rounded-lg bg-gradient-to-br ${piece.color} border border-slate-800 hover:border-slate-600 transition-all overflow-hidden text-left group`}>
                <div className="h-20 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform overflow-hidden">
                  {piece.dataUrl ? <img src={piece.dataUrl} alt={piece.title} className="w-full h-full object-cover" /> : piece.art}
                </div>
                <div className="px-2 py-1.5 bg-black/40">
                  <div className="text-[11px] font-medium truncate">{piece.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 capitalize">{piece.type}</span>
                    <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                      <Heart className={`w-2.5 h-2.5 ${liked.has(piece.id) ? 'text-red-400 fill-current' : ''}`} />
                      {piece.likes + (liked.has(piece.id) ? 1 : 0)}
                    </span>
                  </div>
                  {piece.featured && <Star className="w-2.5 h-2.5 text-amber-400 fill-current inline" />}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(piece => (
              <button key={piece.id} onClick={() => setSelected(piece)}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/50 transition-all text-left">
                <span className="text-2xl">{piece.art}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{piece.title}</div>
                  <div className="text-[9px] text-slate-400 capitalize">{piece.type} · by {piece.author}</div>
                </div>
                <div className="text-[9px] text-slate-500 flex items-center gap-0.5">
                  <Heart className={`w-2.5 h-2.5 ${liked.has(piece.id) ? 'text-red-400 fill-current' : ''}`} />
                  {piece.likes}
                </div>
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">No pieces found</div>
        )}
      </div>
    </div>
  );
}
