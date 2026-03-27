import React, { useState, useCallback } from 'react';
import { Heart, Shield, Coins, Package, MapPin, Sword, Zap } from 'lucide-react';

const LOCATIONS = {
  'market-square': {
    name: 'Market Square',
    desc: 'Steam-powered carriages rattle across cobblestones. Vendors hawk clockwork trinkets under a haze of brass-tinted smog.',
    icon: '🏪',
    choices: [
      { text: 'Visit the Tinker\'s Shop', to: 'tinker-shop' },
      { text: 'Enter the Steamworks Tavern', to: 'tavern' },
      { text: 'Head to the Airship Docks', to: 'docks' },
      { text: 'Descend into the Undercity', to: 'undercity', req: { stat: 'courage', min: 3 } },
    ],
  },
  'tinker-shop': {
    name: 'Tinker\'s Shop',
    desc: 'Gears click and whirr. An old woman with brass goggles peers at you through a magnifying monocle. "Looking for something… special?"',
    icon: '⚙️',
    choices: [
      { text: 'Buy a Shock Gauntlet (10 coins)', action: 'buy', item: 'Shock Gauntlet', cost: 10, stat: 'attack', bonus: 2 },
      { text: 'Buy a Plated Vest (8 coins)', action: 'buy', item: 'Plated Vest', cost: 8, stat: 'defense', bonus: 2 },
      { text: 'Buy a Healing Tonic (5 coins)', action: 'buy', item: 'Healing Tonic', cost: 5, heal: 25 },
      { text: 'Ask about the Gilded Cage', to: 'tinker-lore' },
      { text: 'Return to Market Square', to: 'market-square' },
    ],
  },
  'tinker-lore': {
    name: 'Tinker\'s Shop',
    desc: 'She leans close. "The Gilded Cage? That\'s what they call the Governor\'s tower. Prettiest prison you ever saw. They say he keeps an Aether Core up there — powers the whole city. But cross him and you\'ll see the bars behind the gold."',
    icon: '⚙️',
    choices: [
      { text: 'Back to shopping', to: 'tinker-shop' },
      { text: 'Leave the shop', to: 'market-square' },
    ],
  },
  'tavern': {
    name: 'Steamworks Tavern',
    desc: 'Pipe organ music mixes with laughter. A scarred woman in a captain\'s coat sits alone in the corner, watching the door.',
    icon: '🍺',
    choices: [
      { text: 'Talk to the Captain', to: 'captain' },
      { text: 'Gamble with the locals (5 coins)', action: 'gamble', cost: 5 },
      { text: 'Rest and recover', action: 'rest' },
      { text: 'Return to Market Square', to: 'market-square' },
    ],
  },
  'captain': {
    name: 'Captain Vex',
    desc: '"You look like someone who wants out of this cage. I\'m putting together a crew for a run at the Governor\'s tower. The Aether Core inside could power a fleet of airships — or set this whole city free. You in?"',
    icon: '🏴‍☠️',
    choices: [
      { text: '"I\'m in. What\'s the plan?"', to: 'heist-plan', flag: 'joined_vex' },
      { text: '"Sounds dangerous. I need to prepare first."', to: 'tavern' },
      { text: 'Leave quietly', to: 'market-square' },
    ],
  },
  'heist-plan': {
    name: 'The Plan',
    desc: 'Vex spreads a blueprint on the table. "Three ways in. The sewers — dirty but quiet. The airship landing pad — fast but exposed. Or the front gate, if you\'ve got the nerve and the firepower. Meet me at the docks when you\'re ready."',
    icon: '📜',
    choices: [
      { text: 'Head to the Docks', to: 'docks' },
      { text: 'Prepare more first', to: 'market-square' },
    ],
  },
  'docks': {
    name: 'Airship Docks',
    desc: 'Massive zeppelins strain against their moorings. The Governor\'s tower looms above — a gilded spire wreathed in steam and lightning.',
    icon: '🚢',
    choices: [
      { text: 'Storm the front gate', to: 'front-gate', req: { stat: 'attack', min: 4 } },
      { text: 'Sneak through the sewers', to: 'sewers', req: { stat: 'courage', min: 2 } },
      { text: 'Take an airship to the landing pad', to: 'landing-pad', req: { flag: 'joined_vex' } },
      { text: 'Return to Market Square', to: 'market-square' },
    ],
  },
  'undercity': {
    name: 'The Undercity',
    desc: 'Dripping tunnels lit by bioluminescent fungi. Rusted automatons patrol the corridors. A rebel hideout glows in the distance.',
    icon: '🕳️',
    choices: [
      { text: 'Fight an Automaton', action: 'combat', enemy: 'Rusted Automaton', enemyHp: 30, enemyAtk: 4, reward: 15 },
      { text: 'Sneak past to the rebel camp', to: 'rebels', req: { stat: 'courage', min: 2 } },
      { text: 'Scavenge for parts', action: 'scavenge' },
      { text: 'Return to the surface', to: 'market-square' },
    ],
  },
  'rebels': {
    name: 'Rebel Camp',
    desc: 'A ragtag crew of engineers and fighters. Their leader, a young man with a mechanical arm, nods at you. "Another one who sees through the gilding."',
    icon: '⚔️',
    choices: [
      { text: 'Train with the rebels (+1 attack)', action: 'train', stat: 'attack' },
      { text: 'Learn rebel tactics (+1 courage)', action: 'train', stat: 'courage' },
      { text: 'Accept a rebel mission', to: 'rebel-mission' },
      { text: 'Return to Undercity', to: 'undercity' },
    ],
  },
  'rebel-mission': {
    name: 'Rebel Mission',
    desc: '"There\'s a supply convoy passing through the sewers tonight. Intercept it, and we\'ll have enough parts to build a jammer that can disable the tower\'s defenses."',
    icon: '📋',
    choices: [
      { text: 'Ambush the convoy', action: 'combat', enemy: 'Convoy Guards', enemyHp: 40, enemyAtk: 5, reward: 20, flag: 'jammer_parts' },
      { text: 'Too risky right now', to: 'rebels' },
    ],
  },
  'sewers': {
    name: 'The Sewers',
    desc: 'Waist-deep in murky water. The distant hum of the Aether Core vibrates through the walls. Something moves in the darkness ahead.',
    icon: '🌊',
    choices: [
      { text: 'Fight the Sewer Beast', action: 'combat', enemy: 'Sewer Beast', enemyHp: 35, enemyAtk: 6, reward: 12 },
      { text: 'Use the jammer on the defenses', to: 'tower-interior', req: { flag: 'jammer_parts' } },
      { text: 'Press forward carefully', to: 'tower-base' },
      { text: 'Retreat to the docks', to: 'docks' },
    ],
  },
  'front-gate': {
    name: 'The Front Gate',
    desc: 'Two massive automaton guards flank the golden gates. Electricity arcs between their horns.',
    icon: '🚪',
    choices: [
      { text: 'Fight the Gate Guardians', action: 'combat', enemy: 'Gate Guardians', enemyHp: 50, enemyAtk: 7, reward: 25 },
      { text: 'Fall back', to: 'docks' },
    ],
    onCombatWin: 'tower-interior',
  },
  'landing-pad': {
    name: 'Tower Landing Pad',
    desc: 'Vex lands the airship hard on the pad. "Go! I\'ll keep the engines running!" Alarms blare as clockwork soldiers pour from the doors.',
    icon: '🛬',
    choices: [
      { text: 'Fight through the soldiers', action: 'combat', enemy: 'Clockwork Soldiers', enemyHp: 45, enemyAtk: 6, reward: 20 },
      { text: 'Escape on the airship', to: 'docks' },
    ],
    onCombatWin: 'tower-interior',
  },
  'tower-base': {
    name: 'Tower Base',
    desc: 'You emerge inside the tower\'s lower floors. Ornate golden walls hide humming machinery. Stairs spiral upward into blinding light.',
    icon: '🏛️',
    choices: [
      { text: 'Climb to the Aether Core', to: 'tower-interior' },
      { text: 'Search for valuables', action: 'scavenge' },
    ],
  },
  'tower-interior': {
    name: 'The Gilded Cage',
    desc: 'The heart of the tower. A massive Aether Core pulses with blue-white energy, suspended in a cage of golden filigree. The Governor stands before it — half man, half machine. "You think you can just TAKE what I\'ve built?"',
    icon: '👑',
    choices: [
      { text: 'Fight the Governor', action: 'combat', enemy: 'Governor Ashford', enemyHp: 60, enemyAtk: 8, reward: 50 },
      { text: 'Try to reason with him', to: 'negotiate', req: { stat: 'courage', min: 5 } },
    ],
    onCombatWin: 'victory-fight',
  },
  'negotiate': {
    name: 'Negotiation',
    desc: '"You see it too, don\'t you?" you say. "The cage isn\'t just for the city. It\'s for you too." The Governor\'s mechanical eye flickers. For a moment, the man beneath the machine surfaces.',
    icon: '🤝',
    choices: [
      { text: 'Offer to share the Aether Core\'s power', to: 'victory-peace' },
      { text: 'Demand he step down', to: 'tower-interior' },
    ],
  },
  'victory-fight': {
    name: 'Victory — Revolution',
    desc: 'The Governor crumbles. You seize the Aether Core. As its energy floods through the city, the golden bars dissolve. The cage is broken. The people pour into the streets, free at last. Captain Vex salutes from the airship above. A new era begins.',
    icon: '🏆',
    ending: true,
  },
  'victory-peace': {
    name: 'Victory — Liberation',
    desc: 'The Governor releases the Core\'s locks. Aether energy flows freely through the city for the first time. The golden walls remain, but the bars are gone. Together, you begin rebuilding — not a cage, but a beacon. Sometimes the bravest thing isn\'t breaking chains, but opening doors.',
    icon: '🕊️',
    ending: true,
  },
};

const INITIAL_STATE = {
  hp: 100, maxHp: 100,
  coins: 20,
  attack: 3, defense: 2, courage: 1,
  inventory: [],
  flags: {},
  location: 'market-square',
  log: [{ type: 'narrative', text: 'You arrive in a city of brass and steam. They call it a marvel. You call it a cage.' }],
  inCombat: null,
  enemyHp: 0,
  gameOver: false,
};

export default function GildedCageGame() {
  const [state, setState] = useState({ ...INITIAL_STATE, inventory: [], flags: {}, log: [...INITIAL_STATE.log] });

  const addLog = useCallback((entry) => {
    setState(prev => ({ ...prev, log: [...prev.log.slice(-30), entry] }));
  }, []);

  const handleChoice = useCallback((choice) => {
    setState(prev => {
      const s = { ...prev, log: [...prev.log] };

      // Check requirements
      if (choice.req) {
        if (choice.req.stat && (s[choice.req.stat] || 0) < choice.req.min) {
          s.log.push({ type: 'fail', text: `Requires ${choice.req.stat} ${choice.req.min}+ (you have ${s[choice.req.stat] || 0})` });
          return s;
        }
        if (choice.req.flag && !s.flags[choice.req.flag]) {
          s.log.push({ type: 'fail', text: 'You don\'t have what\'s needed for this yet.' });
          return s;
        }
      }

      // Set flags
      if (choice.flag) s.flags = { ...s.flags, [choice.flag]: true };

      // Buy item
      if (choice.action === 'buy') {
        if (s.coins < choice.cost) {
          s.log.push({ type: 'fail', text: 'Not enough coins!' });
          return s;
        }
        if (choice.heal) {
          s.coins -= choice.cost;
          s.hp = Math.min(s.maxHp, s.hp + choice.heal);
          s.log.push({ type: 'gain', text: `Used ${choice.item}. Healed ${choice.heal} HP.` });
        } else {
          s.coins -= choice.cost;
          s.inventory = [...s.inventory, choice.item];
          s[choice.stat] = (s[choice.stat] || 0) + choice.bonus;
          s.log.push({ type: 'gain', text: `Bought ${choice.item}! +${choice.bonus} ${choice.stat}` });
        }
        return s;
      }

      // Gamble
      if (choice.action === 'gamble') {
        if (s.coins < choice.cost) {
          s.log.push({ type: 'fail', text: 'Not enough coins!' });
          return s;
        }
        s.coins -= choice.cost;
        if (Math.random() > 0.45) {
          const winnings = choice.cost * 2 + Math.floor(Math.random() * 5);
          s.coins += winnings;
          s.log.push({ type: 'gain', text: `Won ${winnings} coins!` });
        } else {
          s.log.push({ type: 'damage', text: `Lost ${choice.cost} coins. Better luck next time.` });
        }
        return s;
      }

      // Rest
      if (choice.action === 'rest') {
        const heal = 15 + Math.floor(Math.random() * 10);
        s.hp = Math.min(s.maxHp, s.hp + heal);
        s.log.push({ type: 'gain', text: `Rested and recovered ${heal} HP.` });
        return s;
      }

      // Train
      if (choice.action === 'train') {
        s[choice.stat] = (s[choice.stat] || 0) + 1;
        s.log.push({ type: 'gain', text: `Training complete! +1 ${choice.stat} (now ${s[choice.stat]})` });
        return s;
      }

      // Scavenge
      if (choice.action === 'scavenge') {
        const found = Math.floor(Math.random() * 8) + 3;
        s.coins += found;
        s.log.push({ type: 'gain', text: `Scavenged ${found} coins worth of parts.` });
        if (Math.random() > 0.7) {
          s.courage = (s.courage || 0) + 1;
          s.log.push({ type: 'gain', text: 'The experience steeled your nerves. +1 courage' });
        }
        return s;
      }

      // Combat
      if (choice.action === 'combat') {
        if (choice.flag) s.flags = { ...s.flags, [choice.flag]: true };
        s.inCombat = { name: choice.enemy, maxHp: choice.enemyHp, atk: choice.enemyAtk, reward: choice.reward, flag: choice.flag };
        s.enemyHp = choice.enemyHp;
        s.log.push({ type: 'combat', text: `⚔️ ${choice.enemy} appears!` });
        return s;
      }

      // Navigate
      if (choice.to) {
        s.location = choice.to;
        const loc = LOCATIONS[choice.to];
        if (loc) s.log.push({ type: 'narrative', text: loc.desc });
      }

      return s;
    });
  }, []);

  const handleAttack = useCallback(() => {
    setState(prev => {
      if (!prev.inCombat) return prev;
      const s = { ...prev, log: [...prev.log] };
      const dmg = Math.max(1, s.attack + Math.floor(Math.random() * 3) - 1);
      s.enemyHp = Math.max(0, s.enemyHp - dmg);
      s.log.push({ type: 'combat', text: `You deal ${dmg} damage!` });

      if (s.enemyHp <= 0) {
        s.coins += s.inCombat.reward;
        s.log.push({ type: 'gain', text: `${s.inCombat.name} defeated! +${s.inCombat.reward} coins` });
        const loc = LOCATIONS[s.location];
        if (loc?.onCombatWin) {
          s.location = loc.onCombatWin;
          const newLoc = LOCATIONS[loc.onCombatWin];
          if (newLoc) s.log.push({ type: 'narrative', text: newLoc.desc });
        }
        s.inCombat = null;
        return s;
      }

      const eDmg = Math.max(1, s.inCombat.atk - s.defense + Math.floor(Math.random() * 3) - 1);
      s.hp -= eDmg;
      s.log.push({ type: 'damage', text: `${s.inCombat.name} hits you for ${eDmg}!` });

      if (s.hp <= 0) {
        s.hp = 0;
        s.gameOver = true;
        s.inCombat = null;
        s.log.push({ type: 'fail', text: 'You have fallen. The cage remains...' });
      }
      return s;
    });
  }, []);

  const handleFlee = useCallback(() => {
    setState(prev => {
      if (!prev.inCombat) return prev;
      const s = { ...prev, log: [...prev.log] };
      if (Math.random() > 0.4) {
        s.log.push({ type: 'narrative', text: 'You escaped!' });
        s.inCombat = null;
      } else {
        const eDmg = Math.max(1, s.inCombat.atk - s.defense);
        s.hp -= eDmg;
        s.log.push({ type: 'damage', text: `Failed to flee! Hit for ${eDmg} while running.` });
        if (s.hp <= 0) { s.hp = 0; s.gameOver = true; s.inCombat = null; }
      }
      return s;
    });
  }, []);

  const restart = () => setState({ ...INITIAL_STATE, inventory: [], flags: {}, log: [INITIAL_STATE.log[0]] });

  const loc = LOCATIONS[state.location];
  const isEnding = loc?.ending;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-amber-950/80 to-slate-950 text-white overflow-hidden">
      {/* Stats bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 border-b border-amber-900/30 shrink-0 text-[10px] flex-wrap">
        <span className="flex items-center gap-1 text-red-400"><Heart className="w-3 h-3" />{state.hp}/{state.maxHp}</span>
        <span className="flex items-center gap-1 text-amber-400"><Coins className="w-3 h-3" />{state.coins}</span>
        <span className="flex items-center gap-1 text-orange-400"><Sword className="w-3 h-3" />ATK {state.attack}</span>
        <span className="flex items-center gap-1 text-sky-400"><Shield className="w-3 h-3" />DEF {state.defense}</span>
        <span className="flex items-center gap-1 text-purple-400"><Zap className="w-3 h-3" />CRG {state.courage}</span>
        {state.inventory.length > 0 && <span className="flex items-center gap-1 text-slate-400"><Package className="w-3 h-3" />{state.inventory.length}</span>}
        <span className="ml-auto flex items-center gap-1 text-amber-600"><MapPin className="w-3 h-3" />{loc?.name}</span>
      </div>

      {/* Log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5" ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
        {state.log.map((entry, i) => (
          <div key={i} className={`text-xs leading-relaxed ${
            entry.type === 'narrative' ? 'text-amber-200/90' :
            entry.type === 'gain' ? 'text-green-400' :
            entry.type === 'damage' ? 'text-red-400' :
            entry.type === 'combat' ? 'text-orange-300' :
            entry.type === 'fail' ? 'text-slate-400 italic' :
            'text-slate-300'
          }`}>
            {entry.text}
          </div>
        ))}
      </div>

      {/* Combat UI */}
      {state.inCombat && !state.gameOver && (
        <div className="px-3 py-2 bg-red-950/30 border-t border-red-900/30 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-300">⚔️ {state.inCombat.name}</span>
            <span className="text-[10px] text-red-400">HP: {state.enemyHp}/{state.inCombat.maxHp}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mb-2 overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${(state.enemyHp / state.inCombat.maxHp) * 100}%` }} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAttack} className="flex-1 py-1.5 bg-red-700/50 hover:bg-red-600/50 border border-red-800 rounded text-xs text-red-200">⚔️ Attack</button>
            <button onClick={handleFlee} className="px-4 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded text-xs text-slate-300">🏃 Flee</button>
          </div>
        </div>
      )}

      {/* Choices */}
      {!state.inCombat && !state.gameOver && !isEnding && (
        <div className="px-3 py-2 border-t border-amber-900/20 shrink-0 space-y-1.5 max-h-44 overflow-y-auto">
          {loc?.choices?.map((choice, i) => {
            const locked = choice.req && (
              (choice.req.stat && (state[choice.req.stat] || 0) < choice.req.min) ||
              (choice.req.flag && !state.flags[choice.req.flag])
            );
            return (
              <button key={i} onClick={() => handleChoice(choice)}
                className={`w-full text-left px-3 py-2 rounded text-xs transition-all ${
                  locked ? 'bg-slate-900/30 text-slate-600 cursor-not-allowed' : 'bg-amber-900/20 hover:bg-amber-800/30 text-amber-100 border border-amber-900/20 hover:border-amber-700/30'
                }`}>
                {choice.text}
                {locked && choice.req?.stat && <span className="ml-2 text-[9px] text-slate-600">(need {choice.req.stat} {choice.req.min}+)</span>}
                {locked && choice.req?.flag && <span className="ml-2 text-[9px] text-slate-600">(locked)</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Game Over / Victory */}
      {(state.gameOver || isEnding) && (
        <div className="px-3 py-3 border-t border-amber-900/30 shrink-0 text-center">
          <div className="text-lg mb-1">{isEnding ? '🏆' : '💀'}</div>
          <div className="text-xs text-amber-300 mb-2">{isEnding ? 'The End' : 'Game Over'}</div>
          <button onClick={restart} className="px-6 py-2 bg-amber-700/40 hover:bg-amber-600/40 border border-amber-700 rounded text-xs text-amber-200">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
