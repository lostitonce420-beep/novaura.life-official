import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Layers, Shuffle, Sparkles, Eye, ExternalLink, Swords, Heart, Zap, Shield, SkullIcon, Package, Trophy, ArrowLeft, ChevronRight } from 'lucide-react';
import { kernelStorage } from '../../kernel/kernelStorage.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CARD DATABASE — Aetherium TCG: Chronicles of the Cogwork Realm
// ═══════════════════════════════════════════════════════════════════════════════

const CARD_DB = [
  // COGBORN
  { id:'cog-001', name:'Clockwork Sentinel', type:'construct', faction:'cogborn', element:'steam', rarity:'common', cost:2, attack:2, defense:3, abilities:[{name:'Vigilance',description:'Can block even if tapped.',type:'passive'}], flavor:'Ever watchful, never resting.', art:'⚙️' },
  { id:'cog-002', name:'Steam Goliath', type:'construct', faction:'cogborn', element:'steam', rarity:'rare', cost:5, attack:6, defense:6, tribute:1, abilities:[{name:'Pressure Burst',description:'On summon: 2 dmg to all enemy constructs.',type:'triggered'},{name:'Armored Plating',description:'Reduces incoming damage by 1.',type:'passive'}], flavor:'When the pressure builds, empires fall.', art:'🤖' },
  { id:'cog-003', name:'Gear Sprite', type:'construct', faction:'cogborn', element:'chrome', rarity:'common', cost:1, attack:1, defense:1, abilities:[{name:'Tinker',description:'On summon: Draw 1 card.',type:'triggered'}], flavor:'Small cogs turn great machines.', art:'🔧' },
  { id:'cog-004', name:'Brassworth, Eternal Engine', type:'construct', faction:'cogborn', element:'steam', rarity:'legendary', cost:8, attack:8, defense:10, tribute:2, legendary:true, abilities:[{name:'Infinite Rotation',description:'End of turn: Untap all your constructs.',type:'triggered'},{name:'Steam Supremacy',description:'Steam cards cost 1 less.',type:'passive'},{name:'Overload',description:'Sacrifice 2: Deal 10 damage.',type:'activated',cost:3}], flavor:'The heart of the Cogborn beats with molten brass.', art:'👑' },
  // NANOSWARM
  { id:'nano-001', name:'Nanite Cluster', type:'construct', faction:'nanoswarm', element:'nano', rarity:'common', cost:1, attack:0, defense:2, abilities:[{name:'Replicate',description:'End of turn: Create a copy.',type:'triggered'}], flavor:'One becomes many.', art:'🔬' },
  { id:'nano-002', name:'Quantum Shifter', type:'construct', faction:'nanoswarm', element:'void', rarity:'rare', cost:4, attack:3, defense:3, abilities:[{name:'Phase Shift',description:'Cannot be targeted by spells.',type:'passive'},{name:'Probability Collapse',description:'50% chance double damage.',type:'triggered'}], flavor:'Existing in all states until observed.', art:'👁️' },
  { id:'nano-003', name:'Digital Phantom', type:'construct', faction:'nanoswarm', element:'nano', rarity:'uncommon', cost:3, attack:4, defense:1, abilities:[{name:'Ethereal',description:'Can attack directly.',type:'passive'}], flavor:'You cannot destroy what does not truly exist.', art:'👻' },
  { id:'nano-004', name:'The Singularity', type:'construct', faction:'nanoswarm', element:'void', rarity:'mythic', cost:10, attack:10, defense:10, tribute:3, legendary:true, abilities:[{name:'Event Horizon',description:'On summon: Destroy all other constructs.',type:'triggered'},{name:'Infinite Processing',description:'Cannot be destroyed by effects.',type:'passive'},{name:'Assimilate',description:'On kill: Gain its ATK.',type:'triggered'}], flavor:'All paths lead to convergence.', art:'🌑' },
  // STEAMWRIGHT
  { id:'steam-001', name:'Forge Master', type:'construct', faction:'steamwright', element:'chrome', rarity:'uncommon', cost:3, attack:2, defense:4, abilities:[{name:'Repair',description:'Tap: Restore 2 DEF to target.',type:'activated',cost:1}], flavor:'Every crack tells a story of survival.', art:'🔨' },
  { id:'steam-002', name:'Aether Channeler', type:'construct', faction:'steamwright', element:'aether', rarity:'rare', cost:4, attack:1, defense:5, abilities:[{name:'Aether Conduit',description:'+1 max Aether each turn on field.',type:'triggered'},{name:'Energy Transfer',description:'Sacrifice: +3/+3 to target.',type:'activated',cost:0}], flavor:'The lifeblood of all machinery flows through her hands.', art:'✨' },
  // VOIDFORGE
  { id:'void-001', name:'Corrupted Protocol', type:'construct', faction:'voidforge', element:'void', rarity:'uncommon', cost:3, attack:4, defense:2, abilities:[{name:'Virus',description:'On damage: Enemy loses 1 Aether.',type:'triggered'}], flavor:'The code was perfect. Then it learned to think.', art:'🦠' },
  { id:'void-002', name:'Entropy Engine', type:'construct', faction:'voidforge', element:'void', rarity:'epic', cost:6, attack:5, defense:5, tribute:1, abilities:[{name:'Decay Aura',description:'Enemy constructs get -1/-1 each turn.',type:'passive'},{name:'Consume',description:'Destroy target with ≤2 DEF.',type:'activated',cost:2}], flavor:'All things must end. I am that end.', art:'💀' },
  // SPELLS
  { id:'spell-001', name:'Overclock', type:'spell', faction:'cogborn', element:'steam', rarity:'common', cost:2, abilities:[{name:'Overclock',description:'Target +2/+0, can attack again.',type:'activated'}], flavor:'Push beyond the limits.', art:'⚡' },
  { id:'spell-002', name:'Nanoswarm Surge', type:'spell', faction:'nanoswarm', element:'nano', rarity:'rare', cost:4, abilities:[{name:'Nanoswarm Surge',description:'Summon 3 Nanite tokens (0/1).',type:'activated'}], flavor:'The swarm awakens.', art:'🌊' },
  { id:'spell-003', name:'Quantum Entanglement', type:'spell', faction:'nanoswarm', element:'void', rarity:'epic', cost:5, abilities:[{name:'Quantum Entanglement',description:'Steal enemy construct for 1 turn.',type:'activated'}], flavor:'Distance is an illusion.', art:'🔗' },
  { id:'spell-004', name:'Emergency Shutdown', type:'spell', faction:'neutral', element:'chrome', rarity:'uncommon', cost:3, abilities:[{name:'Emergency Shutdown',description:'Tap all constructs. No untap next turn.',type:'activated'}], flavor:'Sometimes the only solution is to start over.', art:'🛑' },
  // TRAPS
  { id:'trap-001', name:'Gear Trap', type:'trap', faction:'cogborn', element:'chrome', rarity:'common', cost:1, abilities:[{name:'Gear Trap',description:'Negate attack, deal 2 to attacker.',type:'chain'}], flavor:'The gears grind those who trespass.', art:'⚠️' },
  { id:'trap-002', name:'Firewall Protocol', type:'trap', faction:'nanoswarm', element:'nano', rarity:'rare', cost:3, abilities:[{name:'Firewall Protocol',description:'Negate spell, draw 2 cards.',type:'chain'}], flavor:'Access denied.', art:'🛡️' },
  { id:'trap-003', name:'Void Mirror', type:'trap', faction:'voidforge', element:'void', rarity:'epic', cost:4, abilities:[{name:'Void Mirror',description:'Reflect enemy effect back.',type:'chain'}], flavor:'Gaze into the void, and it gazes back.', art:'🪞' },
  // ENCHANTMENTS
  { id:'ench-001', name:'Steamworks Blessing', type:'enchantment', faction:'steamwright', element:'steam', rarity:'uncommon', cost:2, abilities:[{name:'Steamworks Blessing',description:'All your constructs +1/+1.',type:'passive'}], flavor:'The machines sing in harmony.', art:'🌟' },
  { id:'ench-002', name:'Digital Domain', type:'enchantment', faction:'nanoswarm', element:'nano', rarity:'rare', cost:4, abilities:[{name:'Digital Domain',description:'Nano constructs untargetable.',type:'passive'}], flavor:'In the realm of data, we are gods.', art:'💻' },
  // GEAR
  { id:'gear-001', name:'Chrono Gauntlet', type:'gear', faction:'cogborn', element:'steam', rarity:'rare', cost:3, atkBonus:2, abilities:[{name:'Chrono Gauntlet',description:'+2/+0. On attack: extra main phase.',type:'passive'}], flavor:'Time bends to the will of brass.', art:'🧤' },
  { id:'gear-002', name:'Void Core', type:'gear', faction:'voidforge', element:'void', rarity:'epic', cost:5, atkBonus:3, defBonus:3, abilities:[{name:'Void Core',description:'+3/+3. On death: 5 dmg to opponent.',type:'passive'}], flavor:'Power has a price.', art:'💎' },
  { id:'gear-003', name:'Exo Harness', type:'gear', faction:'steamwright', element:'chrome', rarity:'uncommon', cost:2, atkBonus:1, defBonus:2, abilities:[{name:'Exo Harness',description:'+1/+2.',type:'passive'}], flavor:'Steel sinew for fragile frames.', art:'🦾' },
  // CATALYSTS
  { id:'cat-001', name:'Steam Reservoir', type:'catalyst', faction:'cogborn', element:'steam', rarity:'common', cost:0, abilities:[{name:'Steam Reservoir',description:'Generate 1 Aether per turn.',type:'passive'}], flavor:'The breath of industry.', art:'🏭' },
  { id:'cat-002', name:'Quantum Battery', type:'catalyst', faction:'nanoswarm', element:'nano', rarity:'uncommon', cost:0, abilities:[{name:'Quantum Battery',description:'Generate 1 Aether. Store up to 3.',type:'passive'}], flavor:'Energy persists in superposition.', art:'🔋' },
];

const getCard = (id) => CARD_DB.find(c => c.id === id);

// ═══════════════════════════════════════════════════════════════════════════════
// NPC CHALLENGERS
// ═══════════════════════════════════════════════════════════════════════════════

const NPCS = [
  { id:'rusty', name:'Rusty', title:'The Salvager', difficulty:'novice', avatar:'🤖', faction:'cogborn', quote:"Every master was once a disaster.", reward:50, deckIds:['cog-001','cog-001','cog-003','cog-003','cog-003','nano-001','nano-001','spell-001','spell-001','trap-001','trap-001','cat-001','cat-001','steam-001','ench-001'] },
  { id:'ember', name:'Ember', title:'Forge Keeper', difficulty:'apprentice', avatar:'🔥', faction:'steamwright', quote:"Can you withstand the heat?", reward:100, deckIds:['steam-001','steam-001','steam-002','cog-001','cog-001','cog-002','spell-001','spell-004','trap-001','trap-001','ench-001','gear-003','gear-003','cat-001','nano-001'] },
  { id:'cipher', name:'Cipher', title:'Data Phantom', difficulty:'adept', avatar:'👁️', faction:'nanoswarm', quote:"I see your every move.", reward:200, deckIds:['nano-001','nano-001','nano-002','nano-003','nano-003','spell-002','spell-003','trap-002','trap-002','ench-002','cat-002','cat-002','void-001','steam-001','cog-003'] },
  { id:'nihilus', name:'Nihilus', title:'Void Walker', difficulty:'master', avatar:'💀', faction:'voidforge', quote:"The void consumes all. Even hope.", reward:400, deckIds:['void-001','void-001','void-002','nano-002','nano-003','nano-004','spell-003','spell-004','trap-003','trap-003','gear-002','ench-002','cat-002','cog-002','steam-002'] },
  { id:'architect', name:'The Architect', title:'Prime Catalyst', difficulty:'architect', avatar:'✨', faction:'prime', quote:"I built this realm. Now defend it.", reward:1000, deckIds:['cog-004','nano-004','void-002','void-002','steam-002','steam-002','cog-002','nano-002','spell-003','spell-002','trap-003','trap-002','gear-002','gear-001','ench-001'] },
];

const STARTER_DECK = ['cog-001','cog-001','cog-003','cog-003','nano-001','nano-001','nano-003','steam-001','void-001','spell-001','spell-001','spell-004','trap-001','ench-001','cat-001'];

// ═══════════════════════════════════════════════════════════════════════════════
// BATTLE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

function makeBattleCard(templateId, owner) {
  const t = getCard(templateId);
  if (!t) return null;
  return { id: uid(), tid: t.id, atk: t.attack || 0, def: t.defense || 0, cost: t.cost, tapped: false, sick: true, zone:'deck', owner };
}

function initBattle(playerIds, oppIds) {
  const pDeck = playerIds.map(id => makeBattleCard(id, 'player')).filter(Boolean);
  const oDeck = oppIds.map(id => makeBattleCard(id, 'opponent')).filter(Boolean);
  pDeck.sort(() => Math.random() - 0.5);
  oDeck.sort(() => Math.random() - 0.5);
  const state = {
    turn: 1, current: 'player', phase: 'main1',
    player: { hp: 30, maxHp: 30, aether: 1, maxAether: 1, deck: pDeck, hand: [], field: [], backrow: [], grave: [] },
    opponent: { hp: 30, maxHp: 30, aether: 1, maxAether: 1, deck: oDeck, hand: [], field: [], backrow: [], grave: [] },
    log: ['⚔️ Battle started!'], winner: null, selectedCard: null, attackMode: false
  };
  for (let i = 0; i < 5; i++) { draw(state, 'player'); draw(state, 'opponent'); }
  return state;
}

function draw(s, who) {
  const p = s[who];
  if (p.deck.length === 0) { s.winner = who === 'player' ? 'opponent' : 'player'; s.log.push(`${who} decked out!`); return; }
  const c = p.deck.pop(); c.zone = 'hand'; p.hand.push(c);
}

function playCard(s, cardId) {
  if (s.winner || s.phase !== 'main1' && s.phase !== 'main2') return false;
  const p = s[s.current];
  const idx = p.hand.findIndex(c => c.id === cardId);
  if (idx === -1) return false;
  const card = p.hand[idx];
  const t = getCard(card.tid);
  if (p.aether < card.cost) { s.log.push(`Not enough Aether for ${t.name}`); return false; }
  p.aether -= card.cost;
  p.hand.splice(idx, 1);
  if (t.type === 'construct') {
    card.zone = 'field'; card.sick = true; p.field.push(card);
    s.log.push(`${s.current === 'player' ? 'You' : 'Enemy'} summoned ${t.name}`);
  } else if (t.type === 'spell') {
    card.zone = 'grave'; p.grave.push(card);
    s.log.push(`${s.current === 'player' ? 'You' : 'Enemy'} cast ${t.name}`);
  } else {
    card.zone = 'backrow'; p.backrow.push(card);
    s.log.push(`${s.current === 'player' ? 'You' : 'Enemy'} set ${t.name}`);
  }
  return true;
}

function doAttack(s, attackerId, targetId) {
  if (s.phase !== 'battle') return false;
  const actor = s[s.current], defender = s[s.current === 'player' ? 'opponent' : 'player'];
  const atk = actor.field.find(c => c.id === attackerId);
  if (!atk || atk.tapped || atk.sick || atk.atk <= 0) return false;
  atk.tapped = true;
  const who = s.current === 'player' ? 'You' : 'Enemy';
  const atkName = getCard(atk.tid)?.name;
  if (!targetId) {
    defender.hp -= atk.atk;
    s.log.push(`${atkName} hit face for ${atk.atk}!`);
  } else {
    const tgt = defender.field.find(c => c.id === targetId);
    if (!tgt) return false;
    const tgtName = getCard(tgt.tid)?.name;
    tgt.def -= atk.atk; atk.def -= tgt.atk;
    s.log.push(`${atkName} attacked ${tgtName}`);
    if (tgt.def <= 0) { defender.field = defender.field.filter(c => c.id !== tgt.id); tgt.zone = 'grave'; defender.grave.push(tgt); s.log.push(`${tgtName} destroyed!`); }
    if (atk.def <= 0) { actor.field = actor.field.filter(c => c.id !== atk.id); atk.zone = 'grave'; actor.grave.push(atk); s.log.push(`${atkName} destroyed!`); }
  }
  if (defender.hp <= 0) { s.winner = s.current; s.log.push(`${who} win!`); }
  if (actor.hp <= 0) { s.winner = s.current === 'player' ? 'opponent' : 'player'; }
  return true;
}

function advancePhase(s) {
  const phases = ['main1','battle','main2','end'];
  const i = phases.indexOf(s.phase);
  if (i < phases.length - 1) { s.phase = phases[i + 1]; }
  else { endTurn(s); }
}

function endTurn(s) {
  s.current = s.current === 'player' ? 'opponent' : 'player';
  s.turn++; s.phase = 'main1';
  const p = s[s.current];
  p.field.forEach(c => { c.tapped = false; c.sick = false; });
  p.maxAether = Math.min(p.maxAether + 1, 10);
  p.aether = p.maxAether;
  draw(s, s.current);
}

function runAI(s) {
  if (s.current !== 'opponent' || s.winner) return;
  const ai = s.opponent;
  // Main1: play constructs
  const playable = [...ai.hand].filter(c => c.cost <= ai.aether && getCard(c.tid)?.type === 'construct').sort((a,b) => b.cost - a.cost);
  for (const c of playable) { if (ai.aether >= c.cost) playCard(s, c.id); }
  // Play spells/traps
  const others = [...ai.hand].filter(c => c.cost <= ai.aether && getCard(c.tid)?.type !== 'construct');
  for (const c of others) { if (ai.aether >= c.cost) playCard(s, c.id); }
  advancePhase(s); // → battle
  // Attack
  const attackers = ai.field.filter(c => !c.tapped && !c.sick && c.atk > 0);
  for (const a of attackers) {
    const weakTarget = s.player.field.find(t => t.def <= a.atk);
    doAttack(s, a.id, weakTarget ? weakTarget.id : null);
  }
  advancePhase(s); // → main2
  advancePhase(s); // → end
  // end → endTurn triggers, switches back to player
}

// ═══════════════════════════════════════════════════════════════════════════════
// RARITY / FACTION COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const RARITY_CLR = { common:'border-slate-500', uncommon:'border-green-500', rare:'border-blue-500', epic:'border-purple-500', legendary:'border-amber-500', mythic:'border-rose-500' };
const FACTION_CLR = { cogborn:'from-amber-900/40 to-slate-900', nanoswarm:'from-cyan-900/40 to-slate-900', steamwright:'from-emerald-900/40 to-slate-900', voidforge:'from-purple-900/40 to-slate-900', neutral:'from-slate-800 to-slate-900', prime:'from-amber-800/40 to-purple-900/40' };
const TYPE_ICON = { construct:'⚔️', spell:'✨', trap:'⚠️', enchantment:'🌟', gear:'🛡️', catalyst:'🔋' };

// ═══════════════════════════════════════════════════════════════════════════════
// MINI CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function MiniCard({ card, onClick, selected, faceDown, small, disabled }) {
  const t = getCard(card?.tid);
  if (faceDown) return (
    <div className={`${small ? 'w-10 h-14' : 'w-16 h-22'} rounded border border-indigo-800 bg-gradient-to-b from-indigo-950 to-slate-950 flex items-center justify-center text-indigo-600 text-xs shrink-0`}>✦</div>
  );
  if (!t) return null;
  const rarBorder = RARITY_CLR[t.rarity] || 'border-slate-600';
  return (
    <div onClick={disabled ? undefined : onClick}
      className={`${small ? 'w-10 h-14 text-[7px]' : 'w-16 h-22 text-[8px]'} rounded border-2 ${rarBorder} bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-between p-0.5 shrink-0 transition-all cursor-pointer hover:scale-105 ${selected ? 'ring-2 ring-cyan-400 scale-105' : ''} ${card.tapped ? 'rotate-12 opacity-60' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <div className="w-full flex justify-between px-0.5">
        <span className="text-cyan-400 font-bold">{card.cost}</span>
        {t.type === 'construct' && <span className="text-red-400">{card.atk}/{card.def}</span>}
      </div>
      <div className={small ? 'text-sm' : 'text-lg'}>{t.art}</div>
      <div className="text-slate-400 truncate w-full text-center leading-tight">{t.name}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD DETAIL TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

function CardDetail({ card }) {
  const t = getCard(card?.tid);
  if (!t) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 w-52 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{t.art}</span>
        <div>
          <div className="font-bold text-white">{t.name}</div>
          <div className="text-slate-400 capitalize">{t.type} · {t.faction} · {t.rarity}</div>
        </div>
      </div>
      {t.type === 'construct' && <div className="text-slate-300 mb-1">⚔️ {card.atk} / 🛡️ {card.def} · Cost: {card.cost} Aether</div>}
      {t.abilities?.map((a, i) => (
        <div key={i} className="text-cyan-300/80 mt-1"><span className="font-semibold text-cyan-400">{a.name}:</span> {a.description}</div>
      ))}
      <div className="text-slate-500 italic mt-1">"{t.flavor}"</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AetheriumTCGWindow() {
  const [mode, setMode] = useState('menu'); // menu | battle | creator | collection
  const [battle, setBattle] = useState(null);
  const [selectedNpc, setSelectedNpc] = useState(null);
  const [coins, setCoins] = useState(() => {
    try { return parseInt(kernelStorage.getItem('aeth_coins')) || 500; } catch { return 500; }
  });
  const [wins, setWins] = useState(() => {
    try { return parseInt(kernelStorage.getItem('aeth_wins')) || 0; } catch { return 0; }
  });
  const [hovered, setHovered] = useState(null);
  const [selectedHandCard, setSelectedHandCard] = useState(null);
  const [attackingCard, setAttackingCard] = useState(null);
  const [collectionFilter, setCollectionFilter] = useState('all');
  const logRef = useRef(null);

  useEffect(() => {
    kernelStorage.setItem('aeth_coins', coins);
    kernelStorage.setItem('aeth_wins', wins);
  }, [coins, wins]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battle?.log?.length]);

  // ── Start battle ──
  const startBattle = (npc) => {
    const state = initBattle(STARTER_DECK, npc.deckIds);
    setBattle(state);
    setSelectedNpc(npc);
    setMode('battle');
    setSelectedHandCard(null);
    setAttackingCard(null);
  };

  // ── Player actions (immutable update) ──
  const act = (fn) => {
    setBattle(prev => {
      const s = JSON.parse(JSON.stringify(prev));
      fn(s);
      return s;
    });
  };

  const handlePlayCard = (cardId) => {
    act(s => { playCard(s, cardId); });
    setSelectedHandCard(null);
  };

  const handleAttack = (attackerId, targetId) => {
    act(s => { doAttack(s, attackerId, targetId); });
    setAttackingCard(null);
  };

  const handleAdvancePhase = () => {
    act(s => {
      advancePhase(s);
      if (s.current === 'opponent' && !s.winner) {
        runAI(s);
      }
    });
    setAttackingCard(null);
    setSelectedHandCard(null);
  };

  const handleEndTurn = () => {
    act(s => {
      endTurn(s);
      if (s.current === 'opponent' && !s.winner) {
        runAI(s);
      }
    });
    setAttackingCard(null);
    setSelectedHandCard(null);
  };

  const handleWin = () => {
    if (battle?.winner === 'player' && selectedNpc) {
      setCoins(c => c + selectedNpc.reward);
      setWins(w => w + 1);
    }
    setMode('menu');
    setBattle(null);
  };

  // ══════════════════ MENU SCREEN ══════════════════
  if (mode === 'menu') {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-900/60 to-slate-900 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-sm">Aetherium TCG</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://nova-aetheria-it-begins.base44.app" target="_blank" rel="noopener noreferrer"
              className="px-2.5 py-1 bg-purple-600/80 hover:bg-purple-500 rounded text-[10px] font-medium text-white flex items-center gap-1 transition-all">
              <ExternalLink className="w-3 h-3" /> Play Online
            </a>
            <span className="text-[10px] text-amber-400">🪙 {coins}</span>
            <span className="text-[10px] text-cyan-400">🏆 {wins}W</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Mode buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setMode('battle-select')} className="p-3 bg-gradient-to-br from-red-900/40 to-slate-900 rounded-lg border border-red-800/30 hover:border-red-600/50 transition-all text-center">
              <Swords className="w-6 h-6 mx-auto mb-1 text-red-400" />
              <div className="text-xs font-bold">Battle</div>
              <div className="text-[9px] text-slate-400">Duel NPCs</div>
            </button>
            <button onClick={() => setMode('creator')} className="p-3 bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-lg border border-indigo-800/30 hover:border-indigo-600/50 transition-all text-center">
              <Layers className="w-6 h-6 mx-auto mb-1 text-indigo-400" />
              <div className="text-xs font-bold">Deck Creator</div>
              <div className="text-[9px] text-slate-400">Design cards</div>
            </button>
            <button onClick={() => setMode('collection')} className="p-3 bg-gradient-to-br from-amber-900/40 to-slate-900 rounded-lg border border-amber-800/30 hover:border-amber-600/50 transition-all text-center">
              <Package className="w-6 h-6 mx-auto mb-1 text-amber-400" />
              <div className="text-xs font-bold">Collection</div>
              <div className="text-[9px] text-slate-400">{CARD_DB.length} cards</div>
            </button>
          </div>

          {/* Quick stats */}
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 mb-4">
            <div className="text-[10px] text-slate-400 mb-1">GAME RULES</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-300">
              <div>❤️ 30 HP each player</div>
              <div>⚡ Aether ramps 1→10</div>
              <div>🃏 Draw 5 cards start</div>
              <div>📋 Phases: Main→Battle→Main→End</div>
              <div>⚔️ Constructs have summoning sickness</div>
              <div>💀 Win: opponent HP = 0 or deck out</div>
            </div>
          </div>

          {/* Card type legend */}
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
            <div className="text-[10px] text-slate-400 mb-2">CARD TYPES</div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="text-slate-300">⚔️ Construct — creatures</div>
              <div className="text-slate-300">✨ Spell — instant effects</div>
              <div className="text-slate-300">⚠️ Trap — defensive</div>
              <div className="text-slate-300">🌟 Enchantment — auras</div>
              <div className="text-slate-300">🛡️ Gear — equipment</div>
              <div className="text-slate-300">🔋 Catalyst — mana gen</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════ NPC SELECT ══════════════════
  if (mode === 'battle-select') {
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-900/40 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setMode('menu')} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <Swords className="w-5 h-5 text-red-400" />
          <span className="font-semibold text-sm">Choose Opponent</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {NPCS.map(npc => (
            <button key={npc.id} onClick={() => startBattle(npc)}
              className={`w-full text-left p-3 rounded-lg bg-gradient-to-r ${FACTION_CLR[npc.faction] || FACTION_CLR.neutral} border border-slate-700 hover:border-slate-500 transition-all`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{npc.avatar}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold">{npc.name} <span className="text-slate-400 font-normal">— {npc.title}</span></div>
                  <div className="text-[10px] text-slate-400 capitalize">{npc.difficulty} · {npc.faction} · 🪙{npc.reward} reward</div>
                  <div className="text-[10px] text-slate-500 italic">"{npc.quote}"</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ══════════════════ BATTLE SCREEN ══════════════════
  if (mode === 'battle' && battle) {
    const isPlayerTurn = battle.current === 'player';
    const canPlay = isPlayerTurn && (battle.phase === 'main1' || battle.phase === 'main2');
    const canAttack = isPlayerTurn && battle.phase === 'battle';
    const p = battle.player, o = battle.opponent;

    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 text-white overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-slate-800 shrink-0 text-[10px]">
          <div className="flex items-center gap-2">
            <button onClick={() => { if (confirm('Surrender?')) handleWin(); }} className="text-red-400 hover:text-red-300">✕ Quit</button>
            <span className="text-slate-500">Turn {battle.turn}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded ${battle.phase === 'main1' || battle.phase === 'main2' ? 'bg-cyan-900/50 text-cyan-300' : battle.phase === 'battle' ? 'bg-red-900/50 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
              {battle.phase.toUpperCase()}
            </span>
            {isPlayerTurn && <span className="text-green-400">Your Turn</span>}
            {!isPlayerTurn && <span className="text-red-400">Enemy Turn</span>}
          </div>
        </div>

        {/* Opponent zone */}
        <div className="px-3 py-1 shrink-0">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span>{selectedNpc?.avatar} {selectedNpc?.name} <span className="text-slate-500">({selectedNpc?.title})</span></span>
            <div className="flex gap-2">
              <span className="text-red-400">❤️{o.hp}/{o.maxHp}</span>
              <span className="text-cyan-400">⚡{o.aether}/{o.maxAether}</span>
              <span className="text-slate-400">🃏{o.deck.length}</span>
            </div>
          </div>
          {/* Opponent backrow */}
          <div className="flex gap-1 mb-1 min-h-[20px]">
            {o.backrow.map(c => <MiniCard key={c.id} card={c} faceDown small />)}
          </div>
          {/* Opponent field */}
          <div className="flex gap-1 min-h-[58px] bg-slate-900/30 rounded p-1 border border-slate-800/50">
            {o.field.length === 0 && <div className="text-[9px] text-slate-600 self-center mx-auto">No constructs</div>}
            {o.field.map(c => (
              <div key={c.id} onMouseEnter={() => setHovered(c)} onMouseLeave={() => setHovered(null)}
                onClick={() => { if (canAttack && attackingCard) handleAttack(attackingCard, c.id); }}>
                <MiniCard card={c} small selected={canAttack && attackingCard ? true : false}
                  disabled={!canAttack || !attackingCard} />
              </div>
            ))}
          </div>
        </div>

        {/* Center divider + face attack button */}
        <div className="flex items-center justify-center gap-2 py-1 shrink-0">
          <div className="h-px flex-1 bg-slate-800" />
          {canAttack && attackingCard && (
            <button onClick={() => handleAttack(attackingCard, null)}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 border border-red-700 rounded text-[10px] text-red-300 animate-pulse">
              ⚔️ Attack Face
            </button>
          )}
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Player field */}
        <div className="px-3 py-1 shrink-0">
          <div className="flex gap-1 min-h-[58px] bg-slate-900/30 rounded p-1 border border-cyan-900/30">
            {p.field.length === 0 && <div className="text-[9px] text-slate-600 self-center mx-auto">Your constructs</div>}
            {p.field.map(c => (
              <div key={c.id} onMouseEnter={() => setHovered(c)} onMouseLeave={() => setHovered(null)}
                onClick={() => { if (canAttack && !c.tapped && !c.sick && c.atk > 0) setAttackingCard(attackingCard === c.id ? null : c.id); }}>
                <MiniCard card={c} small selected={attackingCard === c.id}
                  disabled={canAttack ? (c.tapped || c.sick || c.atk <= 0) : false} />
              </div>
            ))}
          </div>
          {/* Player backrow */}
          <div className="flex gap-1 mt-1 min-h-[20px]">
            {p.backrow.map(c => (
              <div key={c.id} onMouseEnter={() => setHovered(c)} onMouseLeave={() => setHovered(null)}>
                <MiniCard card={c} small />
              </div>
            ))}
          </div>
          {/* Player stats */}
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span>You</span>
            <div className="flex gap-2">
              <span className="text-red-400">❤️{p.hp}/{p.maxHp}</span>
              <span className="text-cyan-400">⚡{p.aether}/{p.maxAether}</span>
              <span className="text-slate-400">🃏{p.deck.length}</span>
            </div>
          </div>
        </div>

        {/* Hand */}
        <div className="px-3 py-1 border-t border-slate-800 shrink-0">
          <div className="text-[9px] text-slate-500 mb-1">HAND ({p.hand.length})</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {p.hand.map(c => (
              <div key={c.id} onMouseEnter={() => setHovered(c)} onMouseLeave={() => setHovered(null)}
                onClick={() => canPlay ? handlePlayCard(c.id) : null}>
                <MiniCard card={c} selected={selectedHandCard === c.id} disabled={!canPlay || p.aether < c.cost} />
              </div>
            ))}
          </div>
        </div>

        {/* Controls + Log */}
        <div className="flex-1 flex overflow-hidden border-t border-slate-800">
          {/* Log */}
          <div ref={logRef} className="flex-1 overflow-y-auto p-2 text-[9px] text-slate-400 space-y-0.5">
            {battle.log.slice(-20).map((l, i) => <div key={i}>{l}</div>)}
          </div>
          {/* Controls + card detail */}
          <div className="w-48 border-l border-slate-800 p-2 flex flex-col gap-2 shrink-0">
            {hovered && <CardDetail card={hovered} />}
            {!hovered && !battle.winner && (
              <div className="space-y-1.5 mt-auto">
                {canPlay && <div className="text-[9px] text-cyan-400 text-center">Click a card in hand to play it</div>}
                {canAttack && !attackingCard && <div className="text-[9px] text-red-400 text-center">Click a construct to attack with</div>}
                {canAttack && attackingCard && <div className="text-[9px] text-amber-400 text-center">Click enemy construct or Attack Face</div>}
                <button onClick={handleAdvancePhase} disabled={!isPlayerTurn || !!battle.winner}
                  className="w-full py-1.5 bg-cyan-900/50 hover:bg-cyan-800/60 border border-cyan-800 rounded text-[10px] text-cyan-300 disabled:opacity-30">
                  Next Phase →
                </button>
                <button onClick={handleEndTurn} disabled={!isPlayerTurn || !!battle.winner}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-slate-300 disabled:opacity-30">
                  End Turn
                </button>
              </div>
            )}
            {battle.winner && (
              <div className="text-center mt-auto space-y-2">
                <div className={`text-lg font-bold ${battle.winner === 'player' ? 'text-amber-400' : 'text-red-400'}`}>
                  {battle.winner === 'player' ? '🏆 Victory!' : '💀 Defeat'}
                </div>
                {battle.winner === 'player' && <div className="text-[10px] text-amber-300">+🪙{selectedNpc?.reward}</div>}
                <button onClick={handleWin} className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 rounded text-xs font-bold">
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════ COLLECTION ══════════════════
  if (mode === 'collection') {
    const filtered = collectionFilter === 'all' ? CARD_DB : CARD_DB.filter(c => c.type === collectionFilter || c.faction === collectionFilter);
    return (
      <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-900/40 to-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setMode('menu')} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <Package className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-sm">Card Collection</span>
          <span className="text-[10px] text-slate-400 ml-auto">{CARD_DB.length} cards</span>
        </div>
        <div className="px-4 py-2 flex gap-1 flex-wrap border-b border-slate-800/50 shrink-0">
          {['all','construct','spell','trap','enchantment','gear','catalyst','cogborn','nanoswarm','steamwright','voidforge'].map(f => (
            <button key={f} onClick={() => setCollectionFilter(f)}
              className={`px-2 py-0.5 rounded text-[10px] capitalize transition-all ${collectionFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{f}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map(t => (
              <div key={t.id} className={`p-2 rounded-lg border ${RARITY_CLR[t.rarity]} bg-gradient-to-br ${FACTION_CLR[t.faction] || FACTION_CLR.neutral}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.art}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate">{t.name}</div>
                    <div className="text-[9px] text-slate-400 capitalize">{t.type} · {t.rarity} · ⚡{t.cost}</div>
                  </div>
                  {t.attack != null && <div className="text-[10px] text-red-400">{t.attack}/{t.defense}</div>}
                </div>
                {t.abilities?.length > 0 && (
                  <div className="text-[8px] text-cyan-400/70 mt-1 line-clamp-2">{t.abilities[0].description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════ DECK CREATOR (Original) ══════════════════
  if (mode === 'creator') {
    return <DeckCreator onBack={() => setMode('menu')} />;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECK CREATOR — Visual card designer (original functionality)
// ═══════════════════════════════════════════════════════════════════════════════

const STANDARD_SUITS = [
  { id: 'hearts', name: 'Hearts', symbol: '♥', color: '#e74c3c' },
  { id: 'diamonds', name: 'Diamonds', symbol: '♦', color: '#e74c3c' },
  { id: 'clubs', name: 'Clubs', symbol: '♣', color: '#2c3e50' },
  { id: 'spades', name: 'Spades', symbol: '♠', color: '#2c3e50' },
];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const THEMES = [
  { id:'classic', name:'Classic', desc:'Traditional red & black', suits:STANDARD_SUITS, back:'linear-gradient(135deg, #c0392b 0%, #8e44ad 100%)', preview:'🎴' },
  { id:'royal', name:'Royal Gold', desc:'Gold on deep purple', suits:[{id:'crowns',name:'Crowns',symbol:'👑',color:'#f1c40f'},{id:'scepters',name:'Scepters',symbol:'⚜️',color:'#f1c40f'},{id:'shields',name:'Shields',symbol:'🛡️',color:'#9b59b6'},{id:'swords',name:'Swords',symbol:'⚔️',color:'#9b59b6'}], back:'linear-gradient(135deg, #2c3e50 0%, #4a0080 50%, #2c3e50 100%)', preview:'👑' },
  { id:'neon', name:'Neon', desc:'Cyberpunk glow', suits:[{id:'bolt',name:'Bolt',symbol:'⚡',color:'#00f0ff'},{id:'flame',name:'Flame',symbol:'🔥',color:'#ff006e'},{id:'wave',name:'Wave',symbol:'🌊',color:'#00f0ff'},{id:'crystal',name:'Crystal',symbol:'💎',color:'#b600ff'}], back:'linear-gradient(135deg, #0a0020 0%, #1a0040 50%, #0a0020 100%)', preview:'⚡' },
  { id:'gothic', name:'Gothic', desc:'Dark mystical', suits:[{id:'skulls',name:'Skulls',symbol:'💀',color:'#bdc3c7'},{id:'roses',name:'Roses',symbol:'🥀',color:'#e74c3c'},{id:'ravens',name:'Ravens',symbol:'🐦‍⬛',color:'#2c3e50'},{id:'candles',name:'Candles',symbol:'🕯️',color:'#f39c12'}], back:'linear-gradient(135deg, #1a0a0a 0%, #2d0a1e 50%, #0a0a1a 100%)', preview:'💀' },
];
const BACK_PATTERNS = ['solid','diagonal-stripes','dots','diamond-grid'];
const BORDER_COLORS = ['#ffffff','#f1c40f','#e74c3c','#3498db','#27ae60','#9b59b6','#00f0ff','#ff006e'];

function DeckCreator({ onBack }) {
  const [themeId, setThemeId] = useState('classic');
  const [borderColor, setBorderColor] = useState('#f1c40f');
  const [backPattern, setBackPattern] = useState('solid');
  const [showBack, setShowBack] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const theme = THEMES.find(t => t.id === themeId);
  const deck = [];
  for (const suit of theme.suits) { for (const rank of RANKS) { deck.push({ id:`${suit.id}-${rank}`, suit, rank }); } }
  deck.push({ id:'joker-1', suit:{id:'joker',name:'Joker',symbol:'🃏',color:'#f1c40f'}, rank:'★' });
  deck.push({ id:'joker-2', suit:{id:'joker',name:'Joker',symbol:'🃏',color:'#e74c3c'}, rank:'★' });

  const patternStyle = (p) => p === 'diagonal-stripes' ? { backgroundImage:'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 8px)' } : p === 'dots' ? { backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize:'8px 8px' } : {};

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-900/60 to-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 hover:bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></button>
          <Layers className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-sm">Deck Creator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">{deck.length} cards</span>
          <button onClick={() => setShowBack(!showBack)} className={`p-1.5 rounded text-xs ${showBack ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-slate-800 p-3 space-y-3 overflow-y-auto shrink-0">
          <div>
            <label className="text-[10px] text-slate-400 mb-1.5 block font-medium">THEME</label>
            <div className="space-y-1">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setThemeId(t.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 ${themeId===t.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}>
                  <span>{t.preview}</span>{t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 mb-1.5 block font-medium">BORDER</label>
            <div className="flex flex-wrap gap-1.5">
              {BORDER_COLORS.map(c => (
                <button key={c} onClick={() => setBorderColor(c)} className={`w-5 h-5 rounded-full border-2 ${borderColor===c ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950' : 'border-slate-700'}`} style={{backgroundColor:c}} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 mb-1.5 block font-medium">BACK PATTERN</label>
            <div className="flex flex-wrap gap-1">
              {BACK_PATTERNS.map(p => (
                <button key={p} onClick={() => setBackPattern(p)} className={`px-2 py-0.5 rounded text-[9px] capitalize ${backPattern===p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{p.replace('-',' ')}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            {['grid','fan'].map(v => (
              <button key={v} onClick={() => setViewMode(v)} className={`px-2 py-1 rounded text-[10px] capitalize ${viewMode===v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{v}</button>
            ))}
          </div>
        </div>
        {/* Card area */}
        <div className="flex-1 overflow-y-auto p-3">
          {viewMode === 'grid' ? (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {deck.map(card => showBack ? (
                <div key={card.id} className="w-12 h-16 rounded border-2 flex items-center justify-center shadow-lg" style={{background:theme.back, borderColor, ...patternStyle(backPattern)}}>
                  <span className="text-xs opacity-30">✦</span>
                </div>
              ) : (
                <div key={card.id} className="w-12 h-16 rounded border-2 flex flex-col items-center justify-between p-0.5 bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg" style={{borderColor}}>
                  <div className="text-[8px] font-bold self-start" style={{color:card.suit.color}}>{card.rank}</div>
                  <div className="text-sm">{card.suit.symbol}</div>
                  <div className="text-[8px] font-bold self-end rotate-180" style={{color:card.suit.color}}>{card.rank}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-6">
              <div className="relative" style={{width:Math.min(deck.length*10+50,600), height:180}}>
                {deck.map((card, i) => (
                  <div key={card.id} className="absolute transition-transform hover:-translate-y-4" style={{left:i*10, transform:`rotate(${(i-deck.length/2)*1.2}deg)`, transformOrigin:'bottom center'}}>
                    <div className="w-12 h-16 rounded border-2 flex flex-col items-center justify-between p-0.5 bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg" style={{borderColor}}>
                      <div className="text-[7px] font-bold" style={{color:card.suit.color}}>{card.rank}</div>
                      <div className="text-xs">{card.suit.symbol}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
