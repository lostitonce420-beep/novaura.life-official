# The Gilded Cage - Fantasy RPG Mystery

## Overview
A two-act fantasy RPG mobile game built with Expo + React Native:
- **Act 1 (Prologue):** "The Gilded Cage" - A bordello mystery with 10 quests, 7 bound characters, AI-powered conversations, moral choices, and puzzle-solving
- **Act 2 (True Game):** Steampunk town RPG "Ironhaven" - Town exploration, NPC quests, shops, turn-based combat, and 30-floor progressive dungeon crawling. The hero has amnesia and pieces together how they ended up at the bordello.

## Architecture
- **Frontend:** Expo/React Native with React Navigation (stack + drawer)
- **Backend:** Express server on port 5000 (API + static landing page)
- **Frontend Port:** 8081 (Expo dev server)

## Key Screens
### Act 1 (Prologue)
- TitleScreen, IntroScreen, ExplorationScreen, DialogueScreen, PuzzleScreen, ChoiceScreen, EndingScreen
- CharacterSelectionScreen, CharacterInteractionScreen, HotSpringsScreen, ImmersiveSceneScreen
- QuestDialogueScreen, QuestLogScreen, GalleryScreen, SettingsScreen

### Act 2 (Steampunk Town)
- **TownScreen** - Main hub, building grid with Ironhaven overview
- **BuildingInteriorScreen** - NPC dialogue trees, shops, interactable objects, memory fragments
- **DungeonScreen** - Progressive floor exploration with room-by-room progression
- **CombatScreen** - Turn-based combat with skills, items, flee, critical hits
- **HeroStatusScreen** - Stats, equipment, skills, inventory display
- **TownQuestsScreen** - Quest tracking with objectives and rewards
- **MemoryJournalScreen** - Memory fragments collected through exploration

## Key Data Files
- `client/data/steampunkWorld.ts` - Town buildings, NPCs, dungeon floors, enemies, quests, hero stats/skills
- `client/data/rpgSystems.ts` - Full RPG mechanics: 12 RuneScape-style skills (half XP curve), 15 combat stats, equipment tiers (Common→Legendary), crafting recipes, resource nodes, monster definitions with drop tables, combat abilities, dungeon floor themes
- `client/data/immersiveScenes.ts` - Narrative scene system with branching dialogue
- `client/data/postGameWorld.ts` - Post-game world data connecting prologue to Act 2

## RPG Systems
- **Skills (12):** Mining, Smithing, Fishing, Cooking, Woodcutting, Crafting, Alchemy, Combat, Magic, Thieving, Agility, Herbalism — XP curve at half RuneScape speed (Lv 1-99)
- **Combat Stats (15):** maxHealth, maxMana, attack, strength, defense, specialAttack, specialDefense, accuracy, dexterity, dodge, luck, speed, magicPower, magicDefense + currentHealth/currentMana
- **Equipment Slots (10):** weapon, offhand, helmet, body, legs, boots, gloves, cape, amulet, ring
- **Equipment Rarity:** Common, Uncommon, Rare, Epic, Legendary — with rarity colors
- **Inventory:** InventoryItem[] with { itemId, quantity } — NOT string arrays
- **Crafting:** Recipes with skill requirements and ingredient dependencies
- **Resource Nodes:** Distributed across dungeon floor themes (steam-tunnels, gear-works, forgotten-depths, memory-halls, origin-chamber)
- **Monster Scaling:** Base stats scale with dungeon floor level; drop tables with rarity chances
- **State Persistence:** GameContext saves/loads via AsyncStorage with migration for older saves

## Authentication
- Users must register/login before playing. Username + password auth with bcrypt hashing.
- Session-based auth using `express-session` with SESSION_SECRET env var.
- Auth routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Frontend: `AuthContext` (`client/context/AuthContext.tsx`) provides `user`, `login`, `register`, `logout`
- Initial nav stack route is `Login`, which auto-redirects to `Title` if session exists
- Username badge + logout button shown on TitleScreen top-right when logged in

## Navigation Flow
Login/Register -> Title -> Intro -> Exploration (Act 1) -> Ending -> Town (Act 2) -> BuildingInterior/Dungeon/Combat

## Design
- Dark steampunk aesthetic with gold accents
- GameColors, GameTypography defined in `constants/theme.ts`
- OrnateButton component for styled interactive buttons
- ThemedText/ThemedView for consistent styling
- Feather icons from @expo/vector-icons

## Visual Assets
- Sprite assets in `assets/images/sprites/`: building sprites (7), enemy sprites (4), NPC portraits (4), hero portrait, dungeon room scenes (3), decoration sprites (5: lamppost, barrels, fence, tree, steamvent)
- `expo-linear-gradient` used for atmospheric fog/gradient overlays across all screens

## Visual Effects
- **TownScreen**: Road network, cobblestone dots, sprite-based decorations (trees/fences/barrels/steam vents), lamppost glow animations with sprite, multi-layer radial selection glow, dungeon sparkle particles, foreground depth layer, smoke/steam animations, LinearGradient fog overlays
- **CombatScreen**: IdleBreath enemy animation, AttackSparks particle effects on hit, screen flash on critical hits, LinearGradient atmospheric layer, shake/flash damage feedback, haptic feedback
- **DungeonScreen**: AmbientDust floating particles, TorchFlicker ambient light effect, LinearGradient scene overlay with floor-themed coloring, minimap with room type icons
- **BuildingInteriorScreen**: WarmGlow ambient animation, LinearGradient atmospheric layer, NPC portrait sprites in dialogue and explore views

## Recent Changes
- Added full user registration + login system (username/password, bcrypt, sessions)
- Built complete steampunk town (Ironhaven) with 7 buildings with visual sprites
- Rebuilt all game screens with visual sprite-based exploration, particle effects, and atmospheric lighting
- Implemented turn-based combat system with skills, items, enemy abilities, critical hits
- Created 30-floor progressive dungeon (steam tunnels -> ancient prison -> memory halls -> origin chamber)
- Added town quest system, hero status screen, memory journal
- Updated EndingScreen to transition from Act 1 to Act 2
- **RPG Expansion:** Full RuneScape-inspired skill system (12 skills, Lv 1-99), 15 combat stats, equipment rarity tiers, crafting with dependency chains, resource nodes per dungeon area, monster drop tables
- **GameContext overhaul:** Persistent RPG state with save/load migration, all RPG operations (equip, craft, buy, sell, train, combat)
- **CombatScreen:** 15-stat damage system, mana costs, accuracy/dodge rolls, loot drops with rarity, gated spendMana/removeItem
- **HeroStatusScreen:** 4-tab UI (Stats/Skills/Equipment/Crafting) with live data
- **BuildingInteriorScreen:** Gold-based shop with purchase feedback
- **DungeonScreen:** Resource room type, gathering with skill checks, HP/MP mini-bars in floor header, floor theme names
