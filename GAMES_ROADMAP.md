# NovAura Games Roadmap

> Active game development pipeline for the NovAura platform.

---

## 🎮 Active Games

| Game | Location | Status | Tech |
|------|----------|--------|------|
| **Galactica: Starfighter Command** | `public/games/nova-strike.html` | ✅ Live | HTML5 Canvas |
| **NovActica Space Fighter** | `novacticaspacefighter.html` | ✅ Live | HTML5 Canvas |
| **The Gilded Cage** | `The-Gilded-Cage/` + `src/components/games/GildedCageGame.jsx` | ✅ Live | React Native / React |

---

## 🚧 In Development / Prototyping

### 1. Nova Net Battler *(MMBN-inspired)*
**Concept:** Grid-based tactical movement with real-time combat. Player and enemies occupy tiles on a split battlefield. Movement uses "flash-step" snapping with dust particle FX.

**Why first?** Lowest friction prototype. Grid snapping is trivial, 2D sprites with limited angles are easy to reproduce, and the core loop is immediately fun.

**Mechanics:**
- 3×6 or 4×8 grid (player left side / enemies right side)
- WASD/Arrow snap movement with 0.15s flash teleport
- Dust particle burst on move
- Customizable chip/skill deck (draw 5, select 1 per turn)
- Basic Buster attack + charge shot
- Enemy patterns (move → telegraph → attack)

**Tech:** HTML5 Canvas or DOM-based grid + CSS transforms
**File:** `public/games/nova-net-battler.html`

---

### 2. Nova Wilds *(Simplified N64-style 3D)*
**Concept:** Low-poly wilderness exploration with basic-shape trees, monsters, and a skill-based combat system. Think "Super Mario 64 meets Monster Hunter" but stripped to essentials.

**Why second?** Proves 3D capability inside the NovAura ecosystem. Using basic primitives keeps art scope tiny while gameplay can still feel deep.

**Mechanics:**
- Third-person low-poly character controller
- Procedural-ish trees/rocks from basic geometries
- Day/night cycle
- Skill array mapped to hotkeys (melee, ranged, dodge, 3 specials)
- Aggro radius + basic AI states (idle → chase → attack → retreat)
- Inventory + weapon switching

**Tech:** Three.js + Cannon.js (physics)
**File:** `public/games/nova-wilds.html`

---

### 3. Nova Tactics Online *(FFTA-inspired Clan MMO)*
**Concept:** Turn-based tactical grid warfare where clans battle for territory. Deep job/class system with gear-driven skill acquisition.

**Why third?** This is the magnum opus. Requires backend for multiplayer, persistent progression, and a robust rule engine.

**Mechanics:**
- Isometric tactical grid (similar to FFTA/FFT)
- Clan creation + recruitment
- Job system with prerequisites and evolutions
- **Gear mastery:** skills unlock through prolonged use of specific equipment
- Territory control / clan wars
- Auction house / clan vault
- PvE story missions + PvP skirmishes

**Tech:** React/Canvas hybrid + Firebase/Node backend
**File:** `platform/src/games/NovaTactics/` (future)

---

## 📁 Directory Structure

```
public/games/
├── nova-strike.html          # Space shooter (live)
├── nova-net-battler.html     # MMBN prototype (scaffolding)
├── nova-wilds.html           # N64-style 3D (planned)
└── index.html                # Games portal/launcher

src/components/games/
├── GildedCageGame.jsx        # Steampunk choice RPG (live)
└── GameLauncher.jsx          # Future: unified game hub

The-Gilded-Cage/
└── client/                   # Full React Native visual novel
```

---

## 🎯 Next Actions

1. [x] Scaffold `nova-net-battler.html` grid + movement prototype
2. [ ] Add enemy AI states (idle → telegraph → attack)
3. [ ] Implement chip deck + skill firing
4. [ ] Build `nova-wilds.html` Three.js character controller
5. [ ] Design Nova Tactics job tree + gear mastery formulas
