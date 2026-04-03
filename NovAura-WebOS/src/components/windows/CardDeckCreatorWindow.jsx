import React, { useState, useMemo } from 'react';
import { Layers, Download, Save, Shuffle, Eye, ArrowLeft, Plus, Trash2, Grid } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

const SUITS = [
  { id: 'hearts', name: 'Hearts', symbol: '♥', color: '#e74c3c' },
  { id: 'diamonds', name: 'Diamonds', symbol: '♦', color: '#e74c3c' },
  { id: 'clubs', name: 'Clubs', symbol: '♣', color: '#2c3e50' },
  { id: 'spades', name: 'Spades', symbol: '♠', color: '#2c3e50' },
];

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const THEMES = [
  { id: 'classic', name: 'Classic', emoji: '🎴', desc: 'Traditional red & black', primary: '#c0392b', secondary: '#2c3e50', back: 'linear-gradient(135deg, #c0392b, #8e44ad)',
    suits: SUITS },
  { id: 'royal', name: 'Royal Gold', emoji: '👑', desc: 'Luxurious gold on purple', primary: '#f1c40f', secondary: '#9b59b6', back: 'linear-gradient(135deg, #2c3e50, #4a0080, #2c3e50)',
    suits: [{ id: 'crowns', name: 'Crowns', symbol: '👑', color: '#f1c40f' }, { id: 'scepters', name: 'Scepters', symbol: '⚜️', color: '#f1c40f' }, { id: 'shields', name: 'Shields', symbol: '🛡️', color: '#9b59b6' }, { id: 'swords', name: 'Swords', symbol: '⚔️', color: '#9b59b6' }] },
  { id: 'nature', name: 'Nature', emoji: '🌿', desc: 'Earth tones & elements', primary: '#27ae60', secondary: '#8b4513', back: 'linear-gradient(135deg, #2d5016, #1a3a0a, #2d5016)',
    suits: [{ id: 'leaves', name: 'Leaves', symbol: '🍃', color: '#27ae60' }, { id: 'flowers', name: 'Flowers', symbol: '🌺', color: '#e91e63' }, { id: 'stones', name: 'Stones', symbol: '🪨', color: '#795548' }, { id: 'water', name: 'Water', symbol: '💧', color: '#2196f3' }] },
  { id: 'celestial', name: 'Celestial', emoji: '✨', desc: 'Stars & cosmic energy', primary: '#3498db', secondary: '#9b59b6', back: 'linear-gradient(135deg, #0a0a2e, #1a0a3e, #0a0a2e)',
    suits: [{ id: 'stars', name: 'Stars', symbol: '⭐', color: '#f1c40f' }, { id: 'moons', name: 'Moons', symbol: '🌙', color: '#bdc3c7' }, { id: 'suns', name: 'Suns', symbol: '☀️', color: '#f39c12' }, { id: 'comets', name: 'Comets', symbol: '☄️', color: '#3498db' }] },
  { id: 'animal', name: 'Animal Kingdom', emoji: '🦁', desc: 'Wildlife inspired', primary: '#e67e22', secondary: '#2c3e50', back: 'linear-gradient(135deg, #5d4037, #3e2723, #5d4037)',
    suits: [{ id: 'lions', name: 'Lions', symbol: '🦁', color: '#f39c12' }, { id: 'eagles', name: 'Eagles', symbol: '🦅', color: '#795548' }, { id: 'wolves', name: 'Wolves', symbol: '🐺', color: '#607d8b' }, { id: 'dragons', name: 'Dragons', symbol: '🐉', color: '#e74c3c' }] },
  { id: 'gothic', name: 'Gothic', emoji: '💀', desc: 'Dark & mysterious', primary: '#7f8c8d', secondary: '#2c3e50', back: 'linear-gradient(135deg, #1a1a1a, #2c2c2c, #1a1a1a)',
    suits: [{ id: 'skulls', name: 'Skulls', symbol: '💀', color: '#bdc3c7' }, { id: 'ravens', name: 'Ravens', symbol: '🐦‍⬛', color: '#34495e' }, { id: 'roses', name: 'Roses', symbol: '🥀', color: '#c0392b' }, { id: 'chains', name: 'Chains', symbol: '⛓️', color: '#95a5a6' }] },
  { id: 'neon', name: 'Neon Nights', emoji: '🌃', desc: 'Cyberpunk glow', primary: '#00ffcc', secondary: '#ff00ff', back: 'linear-gradient(135deg, #0a0a0a, #1a002e, #0a0a0a)',
    suits: [{ id: 'bolt', name: 'Bolts', symbol: '⚡', color: '#00ffcc' }, { id: 'pixel', name: 'Pixels', symbol: '🟪', color: '#ff00ff' }, { id: 'glitch', name: 'Glitch', symbol: '📡', color: '#00ff00' }, { id: 'circuit', name: 'Circuit', symbol: '🔋', color: '#ff6600' }] },
  { id: 'tarot', name: 'Tarot', emoji: '🔮', desc: 'Mystical divination', primary: '#9b59b6', secondary: '#f1c40f', back: 'linear-gradient(135deg, #1a0a2e, #2d1b69, #1a0a2e)',
    suits: [{ id: 'wands', name: 'Wands', symbol: '🪄', color: '#e74c3c' }, { id: 'cups', name: 'Cups', symbol: '🏆', color: '#3498db' }, { id: 'pentacles', name: 'Pentacles', symbol: '⭕', color: '#f1c40f' }, { id: 'swords2', name: 'Swords', symbol: '🗡️', color: '#bdc3c7' }] },
];

export default function CardDeckCreatorWindow() {
  const [decks, setDecks] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('aetherium_decks') || '[]'); } catch { return []; }
  });
  const [theme, setTheme] = useState(THEMES[0]);
  const [deckName, setDeckName] = useState('My Deck');
  const [includeJokers, setIncludeJokers] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showBack, setShowBack] = useState(false);
  const [view, setView] = useState('editor'); // editor | saved

  const saveDeck = (updated) => { setDecks(updated); kernelStorage.setItem('aetherium_decks', JSON.stringify(updated)); };

  const cards = useMemo(() => {
    const result = [];
    theme.suits.forEach(suit => {
      RANKS.forEach(rank => {
        result.push({ id: `${suit.id}-${rank}`, suit, rank });
      });
    });
    if (includeJokers) {
      result.push({ id: 'joker-1', suit: { id: 'joker', name: 'Joker', symbol: '🃏', color: theme.primary }, rank: '★', isJoker: true });
      result.push({ id: 'joker-2', suit: { id: 'joker', name: 'Joker', symbol: '🃏', color: theme.secondary }, rank: '★', isJoker: true });
    }
    return result;
  }, [theme, includeJokers]);

  const saveCurrent = () => {
    const deck = { id: `deck-${Date.now()}`, name: deckName, themeId: theme.id, includeJokers, cardCount: cards.length, createdAt: new Date().toISOString() };
    saveDeck([...decks, deck]);
  };

  const exportDeck = () => {
    const data = { name: deckName, theme: theme.id, includeJokers, cards: cards.length, suits: theme.suits.map(s => s.name) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.download = `${deckName}.json`; a.href = URL.createObjectURL(blob); a.click();
  };

  // Saved decks view
  if (view === 'saved') {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-amber-900/20 border-b border-slate-800 shrink-0">
          <button onClick={() => setView('editor')} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold">Saved Decks</span>
          <span className="text-[10px] text-slate-500">{decks.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {decks.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-xs text-slate-500">No saved decks</div>
            </div>
          ) : (
            <div className="space-y-2">
              {decks.slice().reverse().map(d => {
                const t = THEMES.find(th => th.id === d.themeId) || THEMES[0];
                return (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800 group">
                    <span className="text-xl">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{d.name}</div>
                      <div className="text-[9px] text-slate-500">{t.name} · {d.cardCount} cards · {new Date(d.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => saveDeck(decks.filter(x => x.id !== d.id))}
                      className="p-1 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-900/30 to-amber-900/20 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold">Deck Creator</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setView('saved')} className="p-1 hover:bg-slate-800 rounded text-slate-400" title="Saved Decks"><Grid className="w-3.5 h-3.5" /></button>
          <button onClick={exportDeck} className="p-1 hover:bg-slate-800 rounded text-slate-400" title="Export"><Download className="w-3.5 h-3.5" /></button>
          <button onClick={saveCurrent} className="px-2 py-0.5 bg-purple-600/50 hover:bg-purple-500/50 rounded text-[10px] text-purple-200"><Save className="w-3 h-3 inline mr-1" />Save</button>
        </div>
      </div>

      {/* Config */}
      <div className="px-3 py-2 border-b border-slate-800/50 space-y-2 shrink-0">
        <input value={deckName} onChange={e => setDeckName(e.target.value)} placeholder="Deck name..."
          className="w-full px-2.5 py-1.5 bg-black/30 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-600/50" />
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t)}
              className={`shrink-0 px-2 py-1 rounded text-[9px] transition-all ${theme.id === t.id ? 'bg-purple-500/30 text-purple-200 border border-purple-600/50' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-600'}`}>
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{theme.desc} · {cards.length} cards</span>
          <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
            <input type="checkbox" checked={includeJokers} onChange={e => setIncludeJokers(e.target.checked)}
              className="w-3 h-3 rounded border-slate-600" />
            Jokers
          </label>
        </div>
      </div>

      {/* Card preview */}
      {selectedCard && (
        <div className="px-3 py-2 border-b border-slate-800/50 flex items-center gap-3 shrink-0">
          <div className="w-14 h-20 rounded-lg border-2 flex flex-col items-center justify-center shrink-0 transition-all"
            style={{
              background: showBack ? theme.back : '#0f172a',
              borderColor: selectedCard.suit.color,
            }}>
            {!showBack && (
              <>
                <span className="text-lg font-bold" style={{ color: selectedCard.suit.color }}>{selectedCard.rank}</span>
                <span className="text-sm">{selectedCard.suit.symbol}</span>
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">{selectedCard.isJoker ? 'Joker' : `${selectedCard.rank} of ${selectedCard.suit.name}`}</div>
            <div className="text-[9px] text-slate-500">{theme.name} theme</div>
          </div>
          <button onClick={() => setShowBack(!showBack)} className="text-[10px] text-slate-400 hover:text-white">
            <Eye className="w-3.5 h-3.5 inline mr-0.5" />{showBack ? 'Front' : 'Back'}
          </button>
        </div>
      )}

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-7 gap-1">
          {cards.map(card => (
            <button key={card.id} onClick={() => { setSelectedCard(card); setShowBack(false); }}
              className={`aspect-[2/3] rounded border flex flex-col items-center justify-center transition-all hover:scale-105 ${selectedCard?.id === card.id ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-slate-700 hover:border-slate-500'}`}
              style={{ background: '#0f172a' }}>
              <span className="text-[10px] font-bold" style={{ color: card.suit.color }}>{card.rank}</span>
              <span className="text-[8px]">{card.suit.symbol}</span>
            </button>
          ))}
        </div>

        {/* Suits legend */}
        <div className="flex justify-center gap-3 mt-3 pt-2 border-t border-slate-800/50">
          {theme.suits.map(s => (
            <div key={s.id} className="flex items-center gap-1">
              <span className="text-sm">{s.symbol}</span>
              <span className="text-[8px] text-slate-500">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
