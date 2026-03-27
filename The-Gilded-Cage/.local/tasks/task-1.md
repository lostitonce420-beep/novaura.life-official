---
title: Overworld town visual overhaul
---
# Overworld Town Visual Overhaul

## What & Why
The TownScreen (Ironhaven) currently renders building sprites floating on a static background with minimal environmental context. For a demo showcase, the overworld needs to feel like a living steampunk city — with roads connecting buildings, environmental decorations (lampposts, steam vents, barrels, gears), ambient animated effects (smoke, steam particles, flickering lights), and layered depth that makes the 2.5D map feel like a real game world rather than sprites on a flat image.

## Done looks like
- Buildings are connected by visible cobblestone roads/paths drawn between them (replacing the tiny gold dots)
- Environmental decoration sprites are placed throughout the map — lampposts with glow effects, steam pipes, wooden crates/barrels, gear mechanisms, iron fences, and small trees/shrubs
- Ambient animated effects bring the town to life: smoke/steam rising from the blacksmith and tavern chimneys, subtle particle effects near the dungeon entrance, flickering lantern glow near lampposts
- The map has visual depth with a parallax-like layered feel — foreground decorations in front of buildings, atmospheric fog/haze in the distance
- Building sprites have drop shadows and subtle glow halos that intensify when selected
- The overall aesthetic matches a classic 2.5D RPG town (Chrono Trigger / Octopath Traveler style) adapted for the steampunk theme
- The scrollable map feels immersive and impressive for a portfolio demo

## Out of scope
- Rewriting the building data model or navigation flow (keep existing building IDs, positions, and enter-building logic)
- Adding new buildings or changing the town layout fundamentally
- Animated walking NPCs on the map (future enhancement)
- Sound effects or music
- Changes to BuildingInteriorScreen, DungeonScreen, or CombatScreen

## Tasks
1. **Generate decorative environment sprites** — Create sprite assets for steampunk town decorations: cobblestone road segments, lampposts, steam vents/pipes, wooden crates and barrels, iron gear mechanisms, small trees/shrubs, iron fence sections. Use the image generation tool targeting a consistent pixel-art or painted style matching existing building sprites.

2. **Add road/path network between buildings** — Replace the simple gold path dots with a visible road system. Draw connecting paths (using positioned road segment sprites or styled Views) between related buildings following the map's visual layout — e.g., a main road from Town Square down through the shops, branching paths to the guild hall and dungeon entrance.

3. **Place environmental decorations across the map** — Position the generated decoration sprites at fixed coordinates throughout the scrollable map. Place lampposts along roads, crates/barrels near the general store and blacksmith, steam pipes near industrial buildings, trees/shrubs at map edges, and gear mechanisms near the dungeon entrance. Use absolute positioning consistent with the existing building placement system.

4. **Add ambient animated effects** — Implement subtle looping animations: smoke/steam rising from the tavern and blacksmith (animated opacity/translateY cycles using Reanimated), a pulsing glow effect on lampposts, faint particle-like sparkle near the dungeon entrance, and a gentle atmospheric fog/haze overlay at the top of the map for depth.

5. **Enhance building presentation** — Add drop shadow effects below each building sprite, improve the selection glow with a multi-layered radial gradient halo, and add a subtle entrance marker (doorway glow or arrow indicator) on the selected building. Make the detail panel slide-up animation feel more polished.

6. **Add depth layering and atmosphere** — Implement a foreground decoration layer that renders on top of buildings (tree branches, hanging signs, overhead pipes) to create a sense of depth. Add a gradient fog overlay at the top/bottom of the scroll area to fade the map edges and create atmospheric depth.

## Relevant files
- `client/screens/TownScreen.tsx`
- `client/screens/TownScreen.tsx:38-59`
- `client/screens/TownScreen.tsx:102-240`
- `client/constants/theme.ts`
- `client/components/OrnateButton.tsx`
- `client/data/steampunkWorld.ts`
- `assets/images/sprites/building-town-square.png`
- `assets/images/sprites/building-general-store.png`
- `assets/images/sprites/building-blacksmith.png`
- `assets/images/sprites/building-tavern.png`
- `assets/images/sprites/building-guild.png`
- `assets/images/sprites/building-dungeon.png`
- `assets/images/sprites/building-manor.png`
- `assets/images/town-background.png`