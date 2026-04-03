import React, { useState, useMemo } from 'react';
import { kernelStorage } from '../../kernel/kernelStorage.js';
import {
  Package, Layers, Swords, Code2, ImageIcon, BookOpen, ArrowLeftRight,
  Plus, Trash2, Search, Filter, Star, Zap, Shield, Heart, ChevronRight,
  Send, Check, X, Link, Clock, Users, Sparkles, Eye
} from 'lucide-react';


// ─── Import Aetherium card DB ─────────────────────────────────────────────────
// Same CARD_DB used in AetheriumTCGWindow so decks are always compatible
const CARD_DB = [
  { id:'cog-001', name:'Clockwork Sentinel', type:'construct', faction:'cogborn', element:'steam', rarity:'common', cost:2, attack:2, defense:3, abilities:[{name:'Vigilance',description:'Can block even if tapped.',type:'passive'}], flavor:'Ever watchful, never resting.', art:'⚙️' },
  { id:'cog-002', name:'Steam Goliath', type:'construct', faction:'cogborn', element:'steam', rarity:'rare', cost:5, attack:6, defense:6, tribute:1, abilities:[{name:'Pressure Burst',description:'On summon: 2 dmg to all enemy constructs.',type:'triggered'},{name:'Armored Plating',description:'Reduces incoming damage by 1.',type:'passive'}], flavor:'When the pressure builds, empires fall.', art:'🤖' },
  { id:'cog-003', name:'Gear Sprite', type:'construct', faction:'cogborn', element:'chrome', rarity:'common', cost:1, attack:1, defense:1, abilities:[{name:'Tinker',description:'On summon: Draw 1 card.',type:'triggered'}], flavor:'Small cogs turn great machines.', art:'🔧' },
  { id:'cog-004', name:'Brassworth, Eternal Engine', type:'construct', faction:'cogborn', element:'steam', rarity:'legendary', cost:8, attack:8, defense:10, tribute:2, legendary:true, abilities:[{name:'Infinite Rotation',description:'End of turn: Untap all your constructs.',type:'triggered'},{name:'Steam Supremacy',description:'Steam cards cost 1 less.',type:'passive'},{name:'Overload',description:'Sacrifice 2: Deal 10 damage.',type:'activated',cost:3}], flavor:'The heart of the Cogborn beats with molten brass.', art:'👑' },
  { id:'nano-001', name:'Nanite Cluster', type:'construct', faction:'nanoswarm', element:'nano', rarity:'common', cost:1, attack:0, defense:2, abilities:[{name:'Replicate',description:'End of turn: Create a copy.',type:'triggered'}], flavor:'One becomes many.', art:'🔬' },
  { id:'nano-002', name:'Quantum Shifter', type:'construct', faction:'nanoswarm', element:'void', rarity:'rare', cost:4, attack:3, defense:3, abilities:[{name:'Phase Shift',description:'Cannot be targeted by spells.',type:'passive'},{name:'Probability Collapse',description:'50% chance double damage.',type:'triggered'}], flavor:'Existing in all states until observed.', art:'👁️' },
  { id:'nano-003', name:'Digital Phantom', type:'construct', faction:'nanoswarm', element:'nano', rarity:'uncommon', cost:3, attack:4, defense:1, abilities:[{name:'Ethereal',description:'Can attack directly.',type:'passive'}], flavor:'You cannot destroy what does not truly exist.', art:'👻' },
  { id:'nano-004', name:'The Singularity', type:'construct', faction:'nanoswarm', element:'void', rarity:'mythic', cost:10, attack:10, defense:10, tribute:3, legendary:true, abilities:[{name:'Event Horizon',description:'On summon: Destroy all other constructs.',type:'triggered'},{name:'Infinite Processing',description:'Cannot be destroyed by effects.',type:'passive'},{name:'Assimilate',description:'On kill: Gain its ATK.',type:'triggered'}], flavor:'All paths lead to convergence.', art:'🌑' },
  { id:'steam-001', name:'Forge Master', type:'construct', faction:'steamwright', element:'chrome', rarity:'uncommon', cost:3, attack:2, defense:4, abilities:[{name:'Repair',description:'Tap: Restore 2 DEF to target.',type:'activated',cost:1}], flavor:'Every crack tells a story of survival.', art:'🔨' },
  { id:'steam-002', name:'Aether Channeler', type:'construct', faction:'steamwright', element:'aether', rarity:'rare', cost:4, attack:1, defense:5, abilities:[{name:'Aether Conduit',description:'+1 max Aether each turn on field.',type:'triggered'},{name:'Energy Transfer',description:'Sacrifice: +3/+3 to target.',type:'activated',cost:0}], flavor:'The lifeblood of all machinery flows through her hands.', art:'✨' },
  { id:'void-001', name:'Corrupted Protocol', type:'construct', faction:'voidforge', element:'void', rarity:'uncommon', cost:3, attack:4, defense:2, abilities:[{name:'Virus',description:'On damage: Enemy loses 1 Aether.',type:'triggered'}], flavor:'The code was perfect. Then it learned to think.', art:'🦠' },
  { id:'void-002', name:'Entropy Engine', type:'construct', faction:'voidforge', element:'void', rarity:'epic', cost:6, attack:5, defense:5, tribute:1, abilities:[{name:'Decay Aura',description:'Enemy constructs get -1/-1 each turn.',type:'passive'},{name:'Consume',description:'Destroy target with ≤2 DEF.',type:'activated',cost:2}], flavor:'All things must end. I am that end.', art:'💀' },
  { id:'spell-001', name:'Overclock', type:'spell', faction:'cogborn', element:'steam', rarity:'common', cost:2, abilities:[{name:'Overclock',description:'Target +2/+0, can attack again.',type:'activated'}], flavor:'Push beyond the limits.', art:'⚡' },
  { id:'spell-002', name:'Nanoswarm Surge', type:'spell', faction:'nanoswarm', element:'nano', rarity:'rare', cost:4, abilities:[{name:'Nanoswarm Surge',description:'Summon 3 Nanite tokens (0/1).',type:'activated'}], flavor:'The swarm awakens.', art:'🌊' },
  { id:'spell-003', name:'Quantum Entanglement', type:'spell', faction:'nanoswarm', element:'void', rarity:'epic', cost:5, abilities:[{name:'Quantum Entanglement',description:'Steal enemy construct for 1 turn.',type:'activated'}], flavor:'Distance is an illusion.', art:'🔗' },
  { id:'spell-004', name:'Emergency Shutdown', type:'spell', faction:'neutral', element:'chrome', rarity:'uncommon', cost:3, abilities:[{name:'Emergency Shutdown',description:'Tap all constructs. No untap next turn.',type:'activated'}], flavor:'Sometimes the only solution is to start over.', art:'🛑' },
  { id:'trap-001', name:'Gear Trap', type:'trap', faction:'cogborn', element:'chrome', rarity:'common', cost:1, abilities:[{name:'Gear Trap',description:'Negate attack, deal 2 to attacker.',type:'chain'}], flavor:'The gears grind those who trespass.', art:'⚠️' },
  { id:'trap-002', name:'Firewall Protocol', type:'trap', faction:'nanoswarm', element:'nano', rarity:'rare', cost:3, abilities:[{name:'Firewall Protocol',description:'Negate spell, draw 2 cards.',type:'chain'}], flavor:'Access denied.', art:'🛡️' },
  { id:'trap-003', name:'Void Mirror', type:'trap', faction:'voidforge', element:'void', rarity:'epic', cost:4, abilities:[{name:'Void Mirror',description:'Reflect enemy effect back.',type:'chain'}], flavor:'Gaze into the void, and it gazes back.', art:'🪞' },
  { id:'ench-001', name:'Steamworks Blessing', type:'enchantment', faction:'steamwright', element:'steam', rarity:'uncommon', cost:2, abilities:[{name:'Steamworks Blessing',description:'All your constructs +1/+1.',type:'passive'}], flavor:'The machines sing in harmony.', art:'🌟' },
  { id:'ench-002', name:'Digital Domain', type:'enchantment', faction:'nanoswarm', element:'nano', rarity:'rare', cost:4, abilities:[{name:'Digital Domain',description:'Nano constructs untargetable.',type:'passive'}], flavor:'In the realm of data, we are gods.', art:'💻' },
  { id:'gear-001', name:'Chrono Gauntlet', type:'gear', faction:'cogborn', element:'steam', rarity:'rare', cost:3, atkBonus:2, abilities:[{name:'Chrono Gauntlet',description:'+2/+0. On attack: extra main phase.',type:'passive'}], flavor:'Time bends to the will of brass.', art:'🧤' },
  { id:'gear-002', name:'Void Core', type:'gear', faction:'voidforge', element:'void', rarity:'epic', cost:5, atkBonus:3, defBonus:3, abilities:[{name:'Void Core',description:'+3/+3. On death: 5 dmg to opponent.',type:'passive'}], flavor:'Power has a price.', art:'💎' },
  { id:'gear-003', name:'Exo Harness', type:'gear', faction:'steamwright', element:'chrome', rarity:'uncommon', cost:2, atkBonus:1, defBonus:2, abilities:[{name:'Exo Harness',description:'+1/+2.',type:'passive'}], flavor:'Steel sinew for fragile frames.', art:'🦾' },
  { id:'cat-001', name:'Steam Reservoir', type:'catalyst', faction:'cogborn', element:'steam', rarity:'common', cost:0, abilities:[{name:'Steam Reservoir',description:'Generate 1 Aether per turn.',type:'passive'}], flavor:'The breath of industry.', art:'🏭' },
  { id:'cat-002', name:'Quantum Battery', type:'catalyst', faction:'nanoswarm', element:'nano', rarity:'uncommon', cost:0, abilities:[{name:'Quantum Battery',description:'Generate 1 Aether. Store up to 3.',type:'passive'}], flavor:'Energy persists in superposition.', art:'🔋' },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const RARITY_COLOR = { common:'text-slate-300', uncommon:'text-green-400', rare:'text-blue-400', epic:'text-purple-400', legendary:'text-amber-400', mythic:'text-rose-400' };
const RARITY_BG    = { common:'bg-slate-700', uncommon:'bg-green-900/60', rare:'bg-blue-900/60', epic:'bg-purple-900/60', legendary:'bg-amber-900/60', mythic:'bg-rose-900/60' };
const FACTION_COLOR= { cogborn:'text-orange-400', nanoswarm:'text-cyan-400', steamwright:'text-yellow-400', voidforge:'text-purple-400', neutral:'text-slate-400', prime:'text-emerald-400' };
const TYPE_ICON    = { construct:Swords, spell:Zap, trap:Shield, enchantment:Star, gear:Package, catalyst:Heart };

const TABS = [
  { id:'cards',  label:'Card Collection', icon:Swords },
  { id:'decks',  label:'My Decks',        icon:Layers },
  { id:'assets', label:'Assets',          icon:Code2  },
  { id:'trades', label:'Trades',          icon:ArrowLeftRight },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────
const load = (key, def) => { try { return JSON.parse(kernelStorage.getItem(key) ?? 'null') ?? def; } catch { return def; } };
const save = (key, val) => { try { kernelStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── Mini card component ──────────────────────────────────────────────────────
function MiniCard({ card, onClick, selected, inDeck, count }) {
  const TypeIcon = TYPE_ICON[card.type] || Package;
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg border transition-all text-left w-full
        ${selected ? 'border-cyan-400 bg-cyan-900/30' : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'}
        ${inDeck ? 'ring-1 ring-cyan-500/40' : ''}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl leading-none">{card.art}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">{card.name}</div>
          <div className={`text-[10px] ${RARITY_COLOR[card.rarity]}`}>{card.rarity} · {card.type}</div>
          <div className={`text-[10px] ${FACTION_COLOR[card.faction]}`}>{card.faction}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] bg-indigo-800 text-indigo-200 px-1 rounded">{card.cost}✦</span>
          {card.attack !== undefined && (
            <span className="text-[10px] text-slate-400">{card.attack}/{card.defense}</span>
          )}
        </div>
      </div>
      {inDeck && count > 0 && (
        <div className="absolute top-1 right-1 bg-cyan-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </div>
      )}
    </button>
  );
}

// ─── Card detail panel ────────────────────────────────────────────────────────
function CardDetail({ card, onClose, onAddToDeck, deckCount }) {
  if (!card) return null;
  const TypeIcon = TYPE_ICON[card.type] || Package;
  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <span className={`text-xs font-bold uppercase tracking-wider ${RARITY_COLOR[card.rarity]}`}>{card.rarity}</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center">
          <div className="text-5xl mb-2">{card.art}</div>
          <div className="text-white font-bold text-lg leading-tight">{card.name}</div>
          {card.legendary && <div className="text-amber-400 text-xs mt-1">✦ Legendary</div>}
          <div className={`text-sm mt-1 ${FACTION_COLOR[card.faction]}`}>{card.faction} · {card.element}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-indigo-900/40 rounded p-2">
            <div className="text-indigo-300 text-xs">Cost</div>
            <div className="text-white font-bold">{card.cost}✦</div>
          </div>
          {card.attack !== undefined && <>
            <div className="bg-red-900/40 rounded p-2">
              <div className="text-red-300 text-xs">ATK</div>
              <div className="text-white font-bold">{card.attack}</div>
            </div>
            <div className="bg-blue-900/40 rounded p-2">
              <div className="text-blue-300 text-xs">DEF</div>
              <div className="text-white font-bold">{card.defense}</div>
            </div>
          </>}
          {card.tribute && <div className="bg-amber-900/40 rounded p-2">
            <div className="text-amber-300 text-xs">Tribute</div>
            <div className="text-white font-bold">{card.tribute}</div>
          </div>}
        </div>
        <div className="space-y-2">
          {card.abilities.map((ab, i) => (
            <div key={i} className="bg-slate-800 rounded p-2">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-300 text-xs font-semibold">{ab.name}</span>
                <span className="text-slate-500 text-[10px] ml-auto">[{ab.type}]</span>
              </div>
              <div className="text-slate-300 text-xs">{ab.description}</div>
            </div>
          ))}
        </div>
        {card.flavor && (
          <div className="border-t border-slate-700 pt-2">
            <p className="text-slate-500 text-xs italic">"{card.flavor}"</p>
          </div>
        )}
      </div>
      {onAddToDeck && (
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={() => onAddToDeck(card.id)}
            className="w-full py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {deckCount > 0 ? `In Deck (${deckCount}) — Add Again` : 'Add to Deck'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CARD COLLECTION TAB ─────────────────────────────────────────────────────
function CardCollectionTab() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFaction, setFilterFaction] = useState('all');
  const [filterRarity, setFilterRarity] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => CARD_DB.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterFaction !== 'all' && c.faction !== filterFaction) return false;
    if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, filterType, filterFaction, filterRarity]);

  const selectedCard = CARD_DB.find(c => c.id === selected);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex flex-col flex-1 min-w-0">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 p-3 border-b border-slate-700 shrink-0">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search cards..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500" />
          </div>
          {[
            { label:'Type', val:filterType, set:setFilterType, opts:['all','construct','spell','trap','enchantment','gear','catalyst'] },
            { label:'Faction', val:filterFaction, set:setFilterFaction, opts:['all','cogborn','nanoswarm','steamwright','voidforge','neutral'] },
            { label:'Rarity', val:filterRarity, set:setFilterRarity, opts:['all','common','uncommon','rare','epic','legendary','mythic'] },
          ].map(f => (
            <select key={f.label} value={f.val} onChange={e=>f.set(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 px-2 py-1.5 outline-none focus:border-cyan-500">
              {f.opts.map(o => <option key={o} value={o}>{o === 'all' ? `All ${f.label}s` : o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
            </select>
          ))}
          <span className="text-slate-500 text-xs self-center">{filtered.length} cards</span>
        </div>
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
          {filtered.map(card => (
            <MiniCard key={card.id} card={card} onClick={() => setSelected(s => s === card.id ? null : card.id)} selected={selected === card.id} />
          ))}
          {filtered.length === 0 && <div className="col-span-2 text-center text-slate-500 text-sm py-12">No cards match your filters.</div>}
        </div>
      </div>
      {selectedCard && (
        <div className="w-52 shrink-0">
          <CardDetail card={selectedCard} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}

// ─── MY DECKS TAB ─────────────────────────────────────────────────────────────
function DecksTab() {
  const [decks, setDecks] = useState(() => load('aetherium_decks_v2', []));
  const [editing, setEditing] = useState(null); // deck id or 'new'
  const [deckName, setDeckName] = useState('');
  const [deckCards, setDeckCards] = useState([]); // array of card ids
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  const persist = (updated) => { setDecks(updated); save('aetherium_decks_v2', updated); };

  const startNew = () => { setDeckName('New Deck'); setDeckCards([]); setEditing('new'); };
  const startEdit = (deck) => { setDeckName(deck.name); setDeckCards([...deck.cardIds]); setEditing(deck.id); };

  const saveDeck = () => {
    if (!deckName.trim()) return;
    if (editing === 'new') {
      const deck = { id: `deck-${Date.now()}`, name: deckName.trim(), cardIds: deckCards, createdAt: new Date().toISOString() };
      persist([...decks, deck]);
    } else {
      persist(decks.map(d => d.id === editing ? { ...d, name: deckName.trim(), cardIds: deckCards, updatedAt: new Date().toISOString() } : d));
    }
    setEditing(null);
  };

  const deleteDeck = (id) => persist(decks.filter(d => d.id !== id));

  const addCard = (cardId) => {
    const count = deckCards.filter(id => id === cardId).length;
    if (count >= 3) return; // max 3 copies
    setDeckCards(prev => [...prev, cardId]);
  };
  const removeCard = (idx) => setDeckCards(prev => prev.filter((_, i) => i !== idx));

  const filtered = useMemo(() => CARD_DB.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  const countInDeck = (cardId) => deckCards.filter(id => id === cardId).length;

  if (editing !== null) {
    const deckCardObjects = deckCards.map(id => CARD_DB.find(c => c.id === id)).filter(Boolean);
    const selectedCardObj = CARD_DB.find(c => c.id === selectedCard);
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 shrink-0">
          <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          <input value={deckName} onChange={e => setDeckName(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white outline-none focus:border-cyan-500" />
          <span className="text-slate-500 text-xs">{deckCards.length} cards</span>
          <button onClick={saveDeck} className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1">
            <Check className="w-3 h-3" /> Save
          </button>
        </div>
        <div className="flex flex-1 min-h-0">
          {/* Card browser */}
          <div className="flex flex-col w-1/2 border-r border-slate-700 min-h-0">
            <div className="p-2 border-b border-slate-700 shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards..."
                  className="w-full pl-7 pr-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filtered.map(card => (
                <MiniCard key={card.id} card={card}
                  onClick={() => setSelectedCard(s => s === card.id ? null : card.id)}
                  selected={selectedCard === card.id}
                  inDeck={countInDeck(card.id) > 0}
                  count={countInDeck(card.id)} />
              ))}
            </div>
          </div>
          {/* Deck list or card detail */}
          {selectedCardObj ? (
            <div className="w-1/2">
              <CardDetail card={selectedCardObj} onClose={() => setSelectedCard(null)}
                onAddToDeck={addCard} deckCount={countInDeck(selectedCardObj.id)} />
            </div>
          ) : (
            <div className="flex flex-col w-1/2 min-h-0">
              <div className="px-3 py-2 border-b border-slate-700 shrink-0">
                <span className="text-xs text-slate-400">Deck — {deckCards.length}/40 cards (max 3 copies)</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {deckCardObjects.length === 0 && (
                  <div className="text-center text-slate-600 text-xs py-8">Click a card on the left to add it.</div>
                )}
                {deckCardObjects.map((card, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1.5">
                    <span className="text-lg">{card.art}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{card.name}</div>
                      <div className={`text-[10px] ${RARITY_COLOR[card.rarity]}`}>{card.rarity}</div>
                    </div>
                    <button onClick={() => removeCard(idx)} className="text-slate-600 hover:text-red-400 shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <span className="text-sm text-slate-300">{decks.length} saved deck{decks.length !== 1 ? 's' : ''}</span>
        <button onClick={startNew} className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 py-1.5 rounded">
          <Plus className="w-3 h-3" /> New Deck
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {decks.length === 0 && (
          <div className="text-center py-16">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No decks yet.</p>
            <p className="text-slate-600 text-xs mt-1">Build your first Aetherium deck.</p>
          </div>
        )}
        {decks.map(deck => {
          const factions = [...new Set(deck.cardIds.map(id => CARD_DB.find(c => c.id === id)?.faction).filter(Boolean))];
          return (
            <div key={deck.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-white font-semibold text-sm">{deck.name}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{deck.cardIds.length} cards</div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {factions.map(f => (
                      <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 ${FACTION_COLOR[f]}`}>{f}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(deck)} className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded">Edit</button>
                  <button onClick={() => deleteDeck(deck.id)} className="text-xs px-2 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ASSETS TAB ───────────────────────────────────────────────────────────────
function AssetsTab() {
  const [assets] = useState(() => load('novaura_assets', [
    { id:'a1', type:'code', name:'Auth Middleware', desc:'JWT + Firebase Auth middleware for Express', tags:['typescript','auth'], createdAt:'2026-03-15', size:'4.2kb' },
    { id:'a2', type:'project', name:'BuilderBot v1', desc:'Initial BuilderBot IDE scaffolding', tags:['react','vite'], createdAt:'2026-03-20', size:'—' },
  ]));
  const [filter, setFilter] = useState('all');

  const typeIcon = { code:Code2, project:Layers, image:ImageIcon, writing:BookOpen, other:Package };
  const typeColor = { code:'text-cyan-400', project:'text-purple-400', image:'text-pink-400', writing:'text-yellow-400', other:'text-slate-400' };

  const filtered = filter === 'all' ? assets : assets.filter(a => a.type === filter);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 shrink-0 flex-wrap">
        {['all','code','project','image','writing','other'].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${filter === t ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No assets yet.</p>
            <p className="text-slate-600 text-xs mt-1">Assets from BuilderBot and the platform will appear here.</p>
          </div>
        )}
        {filtered.map(asset => {
          const Icon = typeIcon[asset.type] || Package;
          return (
            <div key={asset.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="flex items-start gap-3">
                <div className="bg-slate-700 rounded p-1.5 shrink-0">
                  <Icon className={`w-4 h-4 ${typeColor[asset.type]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-white text-sm font-medium">{asset.name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{asset.desc}</div>
                    </div>
                    <button className="text-slate-500 hover:text-cyan-400 shrink-0 transition-colors" title="Share / Trade">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {asset.tags.map(t => <span key={t} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{t}</span>)}
                    <span className="text-[10px] text-slate-600 ml-auto">{asset.size} · {asset.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50 shrink-0">
        <p className="text-xs text-slate-500 text-center">
          Assets from BuilderBot, Literature IDE, and platform projects auto-sync here.
        </p>
      </div>
    </div>
  );
}

// ─── TRADES TAB ───────────────────────────────────────────────────────────────
function TradesTab() {
  const [trades, setTrades] = useState(() => load('novaura_trades', []));
  const [view, setView] = useState('inbox'); // inbox | compose
  const [offer, setOffer] = useState({ to: '', message: '', items: [] });

  const persist = (updated) => { setTrades(updated); save('novaura_trades', updated); };

  const sendTrade = () => {
    if (!offer.to.trim()) return;
    const t = { id:`trade-${Date.now()}`, to: offer.to.trim(), message: offer.message, items: offer.items, status:'pending', sentAt: new Date().toISOString(), direction:'out' };
    persist([t, ...trades]);
    setOffer({ to:'', message:'', items:[] });
    setView('inbox');
  };

  const accept = (id) => persist(trades.map(t => t.id === id ? { ...t, status:'accepted' } : t));
  const decline = (id) => persist(trades.map(t => t.id === id ? { ...t, status:'declined' } : t));
  const remove = (id) => persist(trades.filter(t => t.id !== id));

  const copyLink = (trade) => {
    const link = `${window.location.origin}/?trade=${trade.id}`;
    navigator.clipboard.writeText(link).catch(() => {});
  };

  const statusColor = { pending:'text-yellow-400', accepted:'text-green-400', declined:'text-red-400' };
  const statusIcon  = { pending: Clock, accepted: Check, declined: X };

  if (view === 'compose') {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 shrink-0">
          <button onClick={() => setView('inbox')} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          <span className="text-sm text-white font-medium">New Trade Request</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">To (username or @handle)</label>
            <input value={offer.to} onChange={e => setOffer(o => ({ ...o, to: e.target.value }))} placeholder="@pilot"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 placeholder-slate-600" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Message</label>
            <textarea value={offer.message} onChange={e => setOffer(o => ({ ...o, message: e.target.value }))} placeholder="What are you offering or requesting?"
              rows={3} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 placeholder-slate-600 resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-2">Items to offer</label>
            <div className="bg-slate-800/50 border border-slate-700 rounded p-3 text-xs text-slate-500 text-center">
              Item picker coming in next update — attach Aetherium cards, assets, or platform items.
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700 rounded p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><Link className="w-3 h-3" /> Or share a trade link</div>
            <div className="text-slate-600 text-xs">Generate a shareable link after sending — the other user clicks it to review and respond without needing to find you first.</div>
          </div>
        </div>
        <div className="p-3 border-t border-slate-700 shrink-0">
          <button onClick={sendTrade} disabled={!offer.to.trim()}
            className="w-full py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Send Trade Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 shrink-0">
        <span className="text-sm text-slate-300">{trades.filter(t=>t.status==='pending').length} pending</span>
        <button onClick={() => setView('compose')}
          className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 py-1.5 rounded">
          <Plus className="w-3 h-3" /> New Trade
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {trades.length === 0 && (
          <div className="text-center py-16">
            <ArrowLeftRight className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No trades yet.</p>
            <p className="text-slate-600 text-xs mt-1">Send trade requests to exchange cards and assets with other pilots.</p>
          </div>
        )}
        {trades.map(trade => {
          const SIcon = statusIcon[trade.status] || Clock;
          return (
            <div key={trade.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400">{trade.direction === 'out' ? '→' : '←'}</span>
                    <span className="text-white text-sm font-medium">{trade.to}</span>
                    <span className={`flex items-center gap-0.5 text-[10px] ml-auto ${statusColor[trade.status]}`}>
                      <SIcon className="w-3 h-3" /> {trade.status}
                    </span>
                  </div>
                  {trade.message && <p className="text-slate-400 text-xs">{trade.message}</p>}
                  <div className="text-slate-600 text-[10px] mt-1">{new Date(trade.sentAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {trade.direction === 'in' && trade.status === 'pending' && <>
                  <button onClick={() => accept(trade.id)} className="flex-1 py-1 bg-green-800 hover:bg-green-700 text-green-200 text-xs rounded flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button onClick={() => decline(trade.id)} className="flex-1 py-1 bg-red-900/60 hover:bg-red-800 text-red-300 text-xs rounded flex items-center justify-center gap-1">
                    <X className="w-3 h-3" /> Decline
                  </button>
                </>}
                <button onClick={() => copyLink(trade)} className="py-1 px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded flex items-center gap-1">
                  <Link className="w-3 h-3" /> Link
                </button>
                <button onClick={() => remove(trade.id)} className="py-1 px-2 bg-slate-700 hover:bg-red-900/50 text-slate-400 hover:text-red-300 text-xs rounded">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function InventoryWindow() {
  const [tab, setTab] = useState('cards');

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 shrink-0 bg-slate-900/80">
        <Package className="w-5 h-5 text-cyan-400" />
        <div>
          <h1 className="text-white font-bold text-sm leading-none">Inventory</h1>
          <p className="text-slate-500 text-[10px] mt-0.5">Cards · Decks · Assets · Trades</p>
        </div>
      </div>
      {/* Tab bar */}
      <div className="flex border-b border-slate-700 shrink-0">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors flex-1 justify-center
                ${tab === t.id ? 'text-cyan-400 border-b-2 border-cyan-500 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>
      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === 'cards'  && <CardCollectionTab />}
        {tab === 'decks'  && <DecksTab />}
        {tab === 'assets' && <AssetsTab />}
        {tab === 'trades' && <TradesTab />}
      </div>
    </div>
  );
}
