export interface TownBuilding {
  id: string;
  name: string;
  type: "shop" | "house" | "tavern" | "guild" | "dungeon" | "special";
  description: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  interior: BuildingInterior;
  unlocked: boolean;
  icon: string;
}

export interface BuildingInterior {
  background: string;
  npcs: TownNPC[];
  interactables: InteriorObject[];
  events: InteriorEvent[];
}

export interface TownNPC {
  id: string;
  name: string;
  role: string;
  portrait: string;
  dialogue: NPCDialogueTree;
  quests: string[];
  shopInventory?: ShopItem[];
  relationship: number;
}

export interface NPCDialogueTree {
  greeting: string;
  topics: DialogueTopic[];
  questDialogue?: Record<string, { start: string; progress: string; complete: string }>;
}

export interface DialogueTopic {
  id: string;
  prompt: string;
  response: string;
  unlockCondition?: string;
  revealsMemory?: string;
}

export interface InteriorObject {
  id: string;
  name: string;
  description: string;
  action: "examine" | "use" | "take";
  result: { type: "item" | "gold" | "memory" | "event"; value: string | number };
}

export interface InteriorEvent {
  id: string;
  trigger: "enter" | "interact" | "quest";
  condition?: string;
  narrative: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  type: "weapon" | "armor" | "consumable" | "accessory" | "key" | "material" | "tool";
  description: string;
  price: number;
  stats?: ItemStats;
  effect?: string;
  rarity?: import("./rpgSystems").Rarity;
}

export interface ItemStats {
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  special?: string;
  specialAttack?: number;
  specialDefense?: number;
  accuracy?: number;
  dexterity?: number;
  strength?: number;
  luck?: number;
  dodge?: number;
  magicPower?: number;
  magicDefense?: number;
  maxHealth?: number;
  maxMana?: number;
  critChance?: number;
}

export interface DungeonFloor {
  level: number;
  name: string;
  description: string;
  enemies: EnemyType[];
  boss?: EnemyType;
  loot: string[];
  events: DungeonEvent[];
  theme: "steam" | "ancient" | "dark" | "mechanical" | "void";
}

export interface EnemyType {
  id: string;
  name: string;
  description: string;
  stats: CombatStats;
  abilities: EnemyAbility[];
  lootTable: { itemId: string; chance: number }[];
  isBoss: boolean;
}

export interface CombatStats {
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  critChance: number;
  specialAttack?: number;
  specialDefense?: number;
  accuracy?: number;
  dexterity?: number;
  strength?: number;
  luck?: number;
  dodge?: number;
  mana?: number;
  magicPower?: number;
  magicDefense?: number;
}

export interface EnemyAbility {
  id: string;
  name: string;
  damage: number;
  effect?: "poison" | "stun" | "burn" | "weaken" | "heal";
  cooldown: number;
}

export interface DungeonEvent {
  id: string;
  type: "treasure" | "trap" | "puzzle" | "story" | "merchant";
  description: string;
  choices?: { text: string; outcome: string }[];
}

export interface HeroStats {
  level: number;
  experience: number;
  maxHealth: number;
  currentHealth: number;
  maxMana: number;
  currentMana: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  accuracy: number;
  dexterity: number;
  strength: number;
  luck: number;
  dodge: number;
  magicPower: number;
  magicDefense: number;
  speed: number;
  critChance: number;
  gold: number;
  inventory: string[];
  equipment: {
    weapon?: string;
    offhand?: string;
    helmet?: string;
    body?: string;
    legs?: string;
    boots?: string;
    gloves?: string;
    cape?: string;
    amulet?: string;
    ring?: string;
  };
  skills: HeroSkill[];
}

export interface HeroSkill {
  id: string;
  name: string;
  description: string;
  damage: number;
  cost: number;
  effect?: string;
  cooldown: number;
  unlockLevel: number;
  type?: "physical" | "magic" | "support";
  scaling?: { stat: string; multiplier: number };
}

export interface TownQuest {
  id: string;
  title: string;
  description: string;
  giver: string;
  type: "dungeon" | "fetch" | "kill" | "explore" | "story";
  objectives: QuestObjective[];
  rewards: QuestRewards;
  dungeonFloorRequired?: number;
  dialogue: {
    start: string[];
    progress: string[];
    complete: string[];
  };
  unlockCondition?: string;
  revealsMemory?: string;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: "kill" | "collect" | "reach" | "talk" | "find";
  target: string;
  required: number;
  current: number;
}

export interface QuestRewards {
  gold: number;
  experience: number;
  items?: string[];
  unlocks?: string[];
}

export const townBuildings: TownBuilding[] = [
  {
    id: "town-square",
    name: "Cogsworth Square",
    type: "special",
    description: "The heart of Ironhaven. A massive clocktower rises from the center, its gears visible through glass panels. Steam vents hiss rhythmically.",
    position: { x: 50, y: 50 },
    size: { width: 30, height: 30 },
    unlocked: true,
    icon: "clock",
    interior: {
      background: "town-square",
      npcs: [
        {
          id: "town-crier",
          name: "Barnaby Brass",
          role: "Town Crier",
          portrait: "portrait-crier",
          relationship: 0,
          quests: [],
          dialogue: {
            greeting: "Hear ye, hear ye! Welcome to Ironhaven, stranger! Though... you don't quite look like a stranger. Have we met before?",
            topics: [
              { id: "about-town", prompt: "Tell me about Ironhaven", response: "Finest steampunk city this side of the Coglands! Built atop the Great Dungeon - that's where all our prosperity comes from. Adventurers go down, treasures come up!" },
              { id: "about-dungeon", prompt: "What's the Great Dungeon?", response: "Nobody knows how deep it goes! Some say it's an ancient dwarven mine. Others claim it's a portal to another realm. All we know is it's full of monsters, treasure, and mystery." },
              { id: "about-memory", prompt: "You said I look familiar...", response: "Could've sworn I saw someone matching your description months ago. Asking about some tavern to the east. Wild look in their eyes. You... you have that same look.", unlockCondition: "memory-1", revealsMemory: "memory-crier-recognition" },
            ],
          },
        },
      ],
      interactables: [
        { id: "clocktower-plaque", name: "Brass Plaque", description: "A commemorative plaque on the clocktower base", action: "examine", result: { type: "memory", value: "This clock... you've seen it before. In a dream? A memory? The ticking feels like a heartbeat you once knew." } },
        { id: "fountain", name: "Steam Fountain", description: "A fountain powered by steam, water dancing in mechanical patterns", action: "use", result: { type: "event", value: "fountain-wish" } },
      ],
      events: [
        { id: "first-arrival", trigger: "enter", condition: "first-visit", narrative: ["The town bustles with activity. Gears turn overhead, steam hisses from pipes, and the smell of oil and fresh bread mingles in the air.", "Something about this place feels achingly familiar. Have you been here before?", "A voice in your head - Willow's? - whispers: 'Find yourself. Remember who you were.'"] },
      ],
    },
  },
  {
    id: "general-store",
    name: "Cogsworth's Emporium",
    type: "shop",
    description: "A cluttered shop filled with mechanical wonders, potions, and adventuring supplies. Gears hang from the ceiling like wind chimes.",
    position: { x: 30, y: 40 },
    size: { width: 15, height: 12 },
    unlocked: true,
    icon: "shopping-bag",
    interior: {
      background: "shop-general",
      npcs: [
        {
          id: "shopkeeper",
          name: "Tilda Cogsworth",
          role: "Shopkeeper",
          portrait: "portrait-tilda",
          relationship: 0,
          quests: ["quest-gather-gears"],
          shopInventory: [
            { id: "health-potion", name: "Steam Elixir", type: "consumable", description: "Restores 50 health with a satisfying hiss", price: 25, effect: "heal-50" },
            { id: "antidote", name: "Gear Grease", type: "consumable", description: "Cures poison and mechanical malfunctions", price: 15, effect: "cure-poison" },
            { id: "escape-spring", name: "Escape Spring", type: "consumable", description: "Bounces you right out of the dungeon", price: 100, effect: "escape-dungeon" },
            { id: "bronze-sword", name: "Bronze Gear-Blade", type: "weapon", description: "A reliable sword with gear-toothed edge", price: 150, stats: { attack: 8 } },
            { id: "leather-armor", name: "Oiled Leather Vest", type: "armor", description: "Flexible armor treated with machine oil", price: 120, stats: { defense: 5 } },
            { id: "lucky-cog", name: "Lucky Cog", type: "accessory", description: "An old gear that brings fortune", price: 75, stats: { special: "crit+5%" } },
          ],
          dialogue: {
            greeting: "Welcome to my humble emporium! Everything an adventurer needs for the Dungeon. Say, you're new in town, aren't you? Or... are you?",
            topics: [
              { id: "shop", prompt: "Show me your wares", response: "[Opens shop inventory]" },
              { id: "dungeon-tips", prompt: "Any tips for the Dungeon?", response: "Always bring potions! The deeper you go, the nastier the creatures. And watch out for steam vents - they'll scald you something fierce." },
              { id: "about-self", prompt: "Have we met before?", response: "Hmm... you do seem familiar. There was someone who came through here, oh, months ago. Bought supplies for a long journey east. Determined fellow. Same eyes as you.", unlockCondition: "memory-2", revealsMemory: "memory-shop-visit" },
            ],
            questDialogue: {
              "quest-gather-gears": {
                start: "If you're heading into the Dungeon anyway, could you gather some Automaton Gears for me? The creatures down there drop them. I'll pay well!",
                progress: "Still gathering those gears? Take your time, but I do need them for my machines.",
                complete: "Wonderful! These are perfect. Here's your payment, and a little something extra for your trouble.",
              },
            },
          },
        },
      ],
      interactables: [
        { id: "mysterious-box", name: "Locked Display Case", description: "A glass case containing an ornate pendant", action: "examine", result: { type: "memory", value: "That pendant... it looks just like the one Willow gave you. Are there more? What do they mean?" } },
      ],
      events: [],
    },
  },
  {
    id: "blacksmith",
    name: "The Iron Forge",
    type: "shop",
    description: "Heat and steam billow from this massive forge. The ring of hammer on metal echoes constantly.",
    position: { x: 70, y: 35 },
    size: { width: 18, height: 15 },
    unlocked: true,
    icon: "tool",
    interior: {
      background: "shop-blacksmith",
      npcs: [
        {
          id: "blacksmith",
          name: "Grimjaw Ironhand",
          role: "Master Blacksmith",
          portrait: "portrait-grimjaw",
          relationship: 0,
          quests: ["quest-rare-ore"],
          shopInventory: [
            { id: "steel-sword", name: "Steel Piston-Blade", type: "weapon", description: "A powerful sword with a steam-powered striking mechanism", price: 350, stats: { attack: 15, speed: 2 } },
            { id: "iron-armor", name: "Iron Steam-Plate", type: "armor", description: "Heavy armor with built-in steam vents for cooling", price: 400, stats: { defense: 12, speed: -2 } },
            { id: "combat-gauntlet", name: "Gear-Knuckles", type: "weapon", description: "Mechanical gauntlets that enhance your punches", price: 200, stats: { attack: 10, critChance: 10 } },
          ],
          dialogue: {
            greeting: "*CLANG* Oh! A customer! Sorry, didn't see you there over the sparks. Looking for equipment? I forge the finest in Ironhaven!",
            topics: [
              { id: "shop", prompt: "Show me your weapons", response: "[Opens shop inventory]" },
              { id: "upgrade", prompt: "Can you upgrade my gear?", response: "Aye, bring me rare materials from the Dungeon and I'll make your equipment sing! Automaton cores, ancient metals, that sort of thing." },
              { id: "past", prompt: "Know anything about the eastern roads?", response: "*pauses hammering* East? Nothing good comes from the east. Heard rumors of a cursed tavern out there. Travelers go in and... don't come out the same. Why do you ask?", revealsMemory: "memory-smith-warning" },
            ],
          },
        },
      ],
      interactables: [
        { id: "old-sword", name: "Rusted Blade on Wall", description: "An ancient sword, clearly not for sale", action: "examine", result: { type: "memory", value: "This blade... you've held one like it before. In darkness. Fighting for your life. The weight feels familiar in your hands." } },
      ],
      events: [],
    },
  },
  {
    id: "tavern",
    name: "The Brass Boiler",
    type: "tavern",
    description: "A lively tavern filled with adventurers, merchants, and locals. Steam-powered instruments play themselves in the corner.",
    position: { x: 25, y: 65 },
    size: { width: 20, height: 15 },
    unlocked: true,
    icon: "coffee",
    interior: {
      background: "tavern-interior",
      npcs: [
        {
          id: "barkeep",
          name: "Molly Steamwhistle",
          role: "Barkeeper",
          portrait: "portrait-molly",
          relationship: 0,
          quests: ["quest-clear-cellar"],
          dialogue: {
            greeting: "Welcome to the Brass Boiler! Best ale in town, and all the gossip you can handle. What'll it be?",
            topics: [
              { id: "drink", prompt: "I'll have a drink", response: "Coming right up! *slides over a foaming mug* First one's on the house for new faces. Though... are you new? Something about you seems familiar." },
              { id: "rumors", prompt: "What's the latest gossip?", response: "Well, strange things happening in the Dungeon lately. Deeper than usual. Some folks saying they've seen ghosts down there - spirits of old prisoners, they say. *shudders*" },
              { id: "prisoners", prompt: "Prisoners? In the Dungeon?", response: "Old stories. Before Ironhaven was built, this place was... something else. A prison, some say. Or worse. The Dungeon? It's built on top of the old foundations. Nobody talks about what's really down there.", revealsMemory: "memory-dungeon-origin" },
            ],
            questDialogue: {
              "quest-clear-cellar": {
                start: "Ugh, we've got a pest problem in the cellar. Steam rats! Nasty mechanical things. Clear them out and I'll make it worth your while.",
                progress: "Still hear skittering down there. Those rats giving you trouble?",
                complete: "Blessed quiet! You're a lifesaver. Here, take this gold and eat free tonight!",
              },
            },
          },
        },
        {
          id: "veteran",
          name: "Old Magnus",
          role: "Retired Adventurer",
          portrait: "portrait-magnus",
          relationship: 0,
          quests: ["quest-deep-dive"],
          dialogue: {
            greeting: "*nursing a drink* Another young fool heading into the Dungeon? Sit. Listen. Maybe you'll live longer than the others.",
            topics: [
              { id: "advice", prompt: "Tell me about the Dungeon", response: "Fifty floors I've mapped, and that's just the beginning. Each section has its own dangers. Steam creatures up top, ancient automatons in the middle, and below that... *trails off*" },
              { id: "below", prompt: "What's below?", response: "Nobody knows for certain. I got to floor 30 once. Saw things that weren't... machines. Weren't natural either. Memories given form. Ghosts of what this place used to be." },
              { id: "memories", prompt: "Memories? What do you mean?", response: "The Dungeon shows you things. Your past. Your fears. The deeper you go, the more it knows you. Some adventurers go in whole and come out... hollow. Like something took a part of them.", revealsMemory: "memory-dungeon-warning" },
            ],
          },
        },
      ],
      interactables: [
        { id: "notice-board", name: "Quest Board", description: "A bulletin board covered in job postings", action: "examine", result: { type: "event", value: "show-quests" } },
        { id: "piano", name: "Steam Piano", description: "A self-playing piano, keys moving on their own", action: "use", result: { type: "memory", value: "This melody... you've heard it before. Hummed in darkness by gentle voices. The women at the tavern... they used to sing this." } },
      ],
      events: [
        { id: "tavern-flashback", trigger: "enter", condition: "first-visit", narrative: ["Stepping into the tavern, a wave of deja vu washes over you.", "The smell of ale, the warmth of the fire, the chatter of patrons...", "For a moment, you're somewhere else. A different tavern. Golden light. Fearful eyes behind forced smiles.", "The moment passes. But the feeling of wrongness remains."] },
      ],
    },
  },
  {
    id: "guild-hall",
    name: "Adventurers Guild",
    type: "guild",
    description: "The headquarters for dungeon delvers. Maps cover the walls, and veteran adventurers swap stories of the depths.",
    position: { x: 75, y: 60 },
    size: { width: 22, height: 18 },
    unlocked: true,
    icon: "shield",
    interior: {
      background: "guild-interior",
      npcs: [
        {
          id: "guildmaster",
          name: "Captain Helena Gearwright",
          role: "Guildmaster",
          portrait: "portrait-helena",
          relationship: 0,
          quests: ["quest-guild-initiation", "quest-floor-10", "quest-floor-20"],
          dialogue: {
            greeting: "Another soul seeking adventure? I'm Captain Gearwright, master of this Guild. We track progress through the Dungeon and reward those brave enough to delve deep.",
            topics: [
              { id: "join", prompt: "I want to join the Guild", response: "Eager, are we? Complete the initiation - clear the first five floors of the Dungeon. Return with proof, and you'll have your membership." },
              { id: "ranks", prompt: "How does ranking work?", response: "Your rank determines access. Bronze for floors 1-10. Silver for 11-20. Gold for 21-30. And Platinum... well, nobody's reached those depths in living memory." },
              { id: "history", prompt: "What's the history of this place?", response: "Ironhaven was built by survivors. People who escaped something terrible to the east. They found the Dungeon entrance and built a city around it. The treasures below fund our prosperity.", revealsMemory: "memory-town-origin" },
            ],
          },
        },
      ],
      interactables: [
        { id: "dungeon-map", name: "Grand Dungeon Map", description: "A massive map showing explored areas of the Dungeon", action: "examine", result: { type: "memory", value: "Looking at the map, you notice a section marked 'Forbidden - Old Prison Levels'. Something about those words makes your blood run cold." } },
        { id: "memorial", name: "Wall of Heroes", description: "Names of adventurers who fell in the Dungeon", action: "examine", result: { type: "memory", value: "So many names... wait. There, near the bottom. A name that looks like yours, but the first letter is smudged. Coincidence?" } },
      ],
      events: [],
    },
  },
  {
    id: "dungeon-entrance",
    name: "The Great Dungeon",
    type: "dungeon",
    description: "Massive iron doors set into a cliff face. Steam hisses from vents. The entrance to Ironhaven's lifeblood - and its darkest secret.",
    position: { x: 50, y: 85 },
    size: { width: 25, height: 20 },
    unlocked: true,
    icon: "chevrons-down",
    interior: {
      background: "dungeon-entrance",
      npcs: [
        {
          id: "gate-guard",
          name: "Sergeant Cogsworth",
          role: "Dungeon Guard",
          portrait: "portrait-guard",
          relationship: 0,
          quests: [],
          dialogue: {
            greeting: "Heading into the Dungeon? Sign the registry. If you don't come back in three days, we send a recovery team. Usually just finds bones.",
            topics: [
              { id: "enter", prompt: "I'm ready to enter", response: "[Opens Dungeon entrance]" },
              { id: "warnings", prompt: "Any warnings?", response: "Don't go deeper than you can handle. The enemies get stronger each floor. If you find a rest room, use it. And if you hear whispers... don't listen." },
              { id: "whispers", prompt: "What whispers?", response: "Some adventurers report hearing voices in the deep. Calling their names. Showing them... memories. Most think it's gas from the steam vents. I'm not so sure.", revealsMemory: "memory-dungeon-voices" },
            ],
          },
        },
      ],
      interactables: [
        { id: "registry", name: "Adventurer Registry", description: "A book of names - those who entered, and whether they returned", action: "examine", result: { type: "memory", value: "Flipping through the pages, you find an entry from months ago. Your handwriting. 'Entering to find answers. Must reach the bottom.' You don't remember writing this." } },
      ],
      events: [
        { id: "dungeon-memory", trigger: "enter", condition: "first-visit", narrative: ["Standing before the great doors, a chill runs down your spine.", "You've been here before. You're certain of it now.", "The pendant around your neck grows warm. Willow's voice echoes: 'The answers you seek... they're down there. At the very bottom. Where it all began.'"] },
      ],
    },
  },
  {
    id: "mansion",
    name: "Gearwright Manor",
    type: "house",
    description: "A grand mansion overlooking the town. Home to the founding family of Ironhaven. Few are invited inside.",
    position: { x: 80, y: 20 },
    size: { width: 20, height: 18 },
    unlocked: false,
    icon: "home",
    interior: {
      background: "mansion-interior",
      npcs: [
        {
          id: "lord",
          name: "Lord Edmund Gearwright",
          role: "Town Founder's Descendant",
          portrait: "portrait-edmund",
          relationship: 0,
          quests: ["quest-family-secret"],
          dialogue: {
            greeting: "Ah, the adventurer everyone's been talking about. Yes, I've heard of your... exploits. You're searching for something, aren't you? Something beyond treasure.",
            topics: [
              { id: "town-history", prompt: "Tell me about Ironhaven's founding", response: "My great-grandfather led survivors here after... an incident. They were escaping a terrible place. Found the Dungeon entrance and built a new life. He never spoke of what they fled from." },
              { id: "incident", prompt: "What incident?", response: "He wrote in his journals about a 'gilded prison'. A place that captured souls. He and others escaped, but they lost their memories in the process. Sound familiar?", revealsMemory: "memory-lord-revelation" },
              { id: "journals", prompt: "Can I see those journals?", response: "Perhaps. Prove yourself worthy. Reach floor 30 of the Dungeon. That's where my great-grandfather claimed the truth was hidden. Bring back proof, and I'll share everything.", unlockCondition: "floor-30-complete" },
            ],
          },
        },
      ],
      interactables: [
        { id: "portrait", name: "Founding Family Portrait", description: "A painting of the town's founders", action: "examine", result: { type: "memory", value: "Seven figures stand with the founder. Seven women of different races - a nymph, a goblin, a gnome, a dwarf, a succubus, a werewolf, a beast woman. Your heart nearly stops. It's them. They escaped too." } },
      ],
      events: [],
    },
  },
];

export const dungeonFloors: DungeonFloor[] = [
  {
    level: 1,
    name: "Steam Tunnels",
    description: "The upper levels, filled with hissing pipes and basic mechanical threats.",
    theme: "steam",
    enemies: [
      { id: "steam-rat", name: "Steam Rat", description: "A mechanical rodent that scurries through the pipes", stats: { maxHealth: 20, attack: 5, defense: 2, speed: 8, critChance: 5 }, abilities: [{ id: "bite", name: "Rusty Bite", damage: 5, cooldown: 0 }], lootTable: [{ itemId: "scrap-metal", chance: 50 }, { itemId: "small-gear", chance: 30 }], isBoss: false },
      { id: "pipe-spider", name: "Pipe Spider", description: "Spindly legs let it crawl through the machinery", stats: { maxHealth: 15, attack: 7, defense: 1, speed: 10, critChance: 10 }, abilities: [{ id: "web", name: "Steam Web", damage: 3, effect: "stun", cooldown: 2 }], lootTable: [{ itemId: "spider-silk", chance: 40 }], isBoss: false },
    ],
    loot: ["scrap-metal", "small-gear", "health-potion"],
    events: [
      { id: "steam-vent", type: "trap", description: "A burst of steam scalds you!", choices: [{ text: "Take the damage and push through", outcome: "damage-10" }, { text: "Find another way around", outcome: "lose-time" }] },
    ],
  },
  {
    level: 5,
    name: "The Gear Works",
    description: "Massive gears turn endlessly. The machinery here is more aggressive.",
    theme: "mechanical",
    enemies: [
      { id: "cog-golem", name: "Cog Golem", description: "A humanoid construct made of interlocking gears", stats: { maxHealth: 50, attack: 12, defense: 8, speed: 4, critChance: 5 }, abilities: [{ id: "gear-smash", name: "Gear Smash", damage: 15, cooldown: 1 }], lootTable: [{ itemId: "automaton-gear", chance: 60 }, { itemId: "bronze-scrap", chance: 40 }], isBoss: false },
    ],
    boss: { id: "steam-guardian", name: "Steam Guardian", description: "A towering automaton that guards this level", stats: { maxHealth: 150, attack: 18, defense: 10, speed: 6, critChance: 10 }, abilities: [{ id: "steam-blast", name: "Steam Blast", damage: 25, effect: "burn", cooldown: 2 }, { id: "crushing-grip", name: "Crushing Grip", damage: 30, cooldown: 3 }], lootTable: [{ itemId: "guardian-core", chance: 100 }], isBoss: true },
    loot: ["automaton-gear", "bronze-scrap", "steam-core"],
    events: [],
  },
  {
    level: 10,
    name: "The Forgotten Depths",
    description: "Ancient stone replaces metal here. This was built by something older.",
    theme: "ancient",
    enemies: [
      { id: "stone-sentinel", name: "Stone Sentinel", description: "An ancient guardian carved from living rock", stats: { maxHealth: 80, attack: 15, defense: 15, speed: 3, critChance: 5 }, abilities: [{ id: "stone-fist", name: "Stone Fist", damage: 20, cooldown: 1 }], lootTable: [{ itemId: "ancient-stone", chance: 50 }], isBoss: false },
      { id: "shadow-wisp", name: "Shadow Wisp", description: "A fragment of darkness that drifts through the ruins", stats: { maxHealth: 30, attack: 18, defense: 3, speed: 15, critChance: 20 }, abilities: [{ id: "life-drain", name: "Life Drain", damage: 12, effect: "heal", cooldown: 2 }], lootTable: [{ itemId: "shadow-essence", chance: 40 }], isBoss: false },
    ],
    boss: { id: "ancient-warden", name: "Ancient Warden", description: "The keeper of the old prison - for this was once a place of captivity", stats: { maxHealth: 250, attack: 22, defense: 18, speed: 5, critChance: 10 }, abilities: [{ id: "chains-of-binding", name: "Chains of Binding", damage: 15, effect: "stun", cooldown: 2 }, { id: "warden-strike", name: "Warden's Strike", damage: 35, cooldown: 3 }], lootTable: [{ itemId: "warden-key", chance: 100 }, { itemId: "prison-record", chance: 100 }], isBoss: true },
    loot: ["ancient-stone", "shadow-essence", "old-key"],
    events: [
      { id: "prison-cells", type: "story", description: "You find ancient prison cells. Names are scratched into the walls. Some you recognize - species that match the women from the tavern. This place... it was a prison long before it became a dungeon." },
    ],
  },
  {
    level: 20,
    name: "The Memory Halls",
    description: "Reality bends here. You see visions of the past. Your past.",
    theme: "void",
    enemies: [
      { id: "memory-phantom", name: "Memory Phantom", description: "A ghostly image of someone you once knew", stats: { maxHealth: 60, attack: 20, defense: 5, speed: 12, critChance: 15 }, abilities: [{ id: "painful-memory", name: "Painful Memory", damage: 25, effect: "weaken", cooldown: 2 }], lootTable: [{ itemId: "memory-shard", chance: 60 }], isBoss: false },
    ],
    boss: { id: "echo-of-self", name: "Echo of Your Past Self", description: "A shadow version of you - the person you were before you lost your memories", stats: { maxHealth: 300, attack: 25, defense: 12, speed: 10, critChance: 15 }, abilities: [{ id: "mirror-strike", name: "Mirror Strike", damage: 30, cooldown: 1 }, { id: "forgotten-pain", name: "Forgotten Pain", damage: 40, effect: "stun", cooldown: 3 }], lootTable: [{ itemId: "fragment-of-identity", chance: 100 }], isBoss: true },
    loot: ["memory-shard", "echo-fragment"],
    events: [
      { id: "memory-vision", type: "story", description: "A vision overwhelms you: You see yourself in chains, in a gilded room. A cruel face looms over you. 'You'll never leave,' he says. 'They all say that at first. But they break. They always break.' The vision fades, but the rage remains." },
    ],
  },
  {
    level: 30,
    name: "The Origin Chamber",
    description: "The deepest known level. Here, the truth awaits.",
    theme: "dark",
    enemies: [],
    boss: { id: "the-first-master", name: "The First Master", description: "The original owner of the prison - an immortal bound to this place by his own dark contracts", stats: { maxHealth: 500, attack: 35, defense: 20, speed: 8, critChance: 20 }, abilities: [{ id: "contract-chains", name: "Contract Chains", damage: 40, effect: "stun", cooldown: 2 }, { id: "soul-rend", name: "Soul Rend", damage: 50, cooldown: 3 }, { id: "dark-dominion", name: "Dark Dominion", damage: 30, effect: "weaken", cooldown: 4 }], lootTable: [{ itemId: "masters-key", chance: 100 }, { itemId: "truth-crystal", chance: 100 }], isBoss: true },
    loot: ["masters-key", "truth-crystal", "origin-document"],
    events: [
      { id: "final-revelation", type: "story", description: "The truth unfolds: The owner of The Gilded Cage was not the first. He inherited the position, the contracts, the power. This dungeon IS the original prison - the source of all the dark magic. And you? You were brought here as a prisoner long before you returned as a hero. The pendant Willow gave you? It was made from a piece of the master deed - the same deed you destroyed or claimed. By doing so, you didn't just free those seven women. You began unraveling magic that has bound souls for centuries." },
    ],
  },
];

export const townQuests: TownQuest[] = [
  {
    id: "quest-guild-initiation",
    title: "Guild Initiation",
    description: "Prove yourself by clearing the first 5 floors of the Dungeon.",
    giver: "guildmaster",
    type: "dungeon",
    objectives: [{ id: "reach-5", description: "Reach floor 5 of the Dungeon", type: "reach", target: "floor-5", required: 1, current: 0 }],
    rewards: { gold: 100, experience: 200, unlocks: ["guild-membership"] },
    dungeonFloorRequired: 5,
    dialogue: {
      start: ["Every adventurer must prove themselves.", "Clear the first five floors and return.", "Then we'll talk about membership."],
      progress: ["The Dungeon awaits. Have you reached floor 5 yet?"],
      complete: ["Impressive! You've earned your place among us.", "Welcome to the Adventurers Guild, Bronze Rank."],
    },
  },
  {
    id: "quest-gather-gears",
    title: "Gear Collection",
    description: "Collect 10 Automaton Gears from the Dungeon for Tilda.",
    giver: "shopkeeper",
    type: "fetch",
    objectives: [{ id: "gather-gears", description: "Collect Automaton Gears", type: "collect", target: "automaton-gear", required: 10, current: 0 }],
    rewards: { gold: 150, experience: 100, items: ["steam-elixir-plus"] },
    dialogue: {
      start: ["My machines need gears to function!", "Bring me 10 Automaton Gears from the Dungeon.", "I'll make it worth your while."],
      progress: ["Still collecting? The deeper floors have better gears."],
      complete: ["Perfect! These are exactly what I needed.", "Here's your reward, and a special elixir I've been brewing."],
    },
  },
  {
    id: "quest-clear-cellar",
    title: "Cellar Infestation",
    description: "Clear the steam rats from the Brass Boiler's cellar.",
    giver: "barkeep",
    type: "kill",
    objectives: [{ id: "kill-rats", description: "Defeat Steam Rats in the cellar", type: "kill", target: "steam-rat", required: 5, current: 0 }],
    rewards: { gold: 75, experience: 50 },
    dialogue: {
      start: ["Those blasted mechanical rats!", "Clear out my cellar and drinks are on me."],
      progress: ["Still hear skittering down there..."],
      complete: ["Blessed silence! You're a hero.", "Free food and drink whenever you want."],
    },
  },
  {
    id: "quest-deep-dive",
    title: "Into the Depths",
    description: "Old Magnus wants you to reach floor 20 and report what you find.",
    giver: "veteran",
    type: "dungeon",
    objectives: [{ id: "reach-20", description: "Reach floor 20 of the Dungeon", type: "reach", target: "floor-20", required: 1, current: 0 }],
    rewards: { gold: 500, experience: 1000, items: ["veterans-blade"] },
    dungeonFloorRequired: 20,
    unlockCondition: "floor-10-complete",
    revealsMemory: "memory-deep-truth",
    dialogue: {
      start: ["I've seen things in the deep...", "Things that shouldn't exist.", "Reach floor 20. Tell me if the whispers are still there.", "Tell me if they know your name."],
      progress: ["The deep calls to you. Have you answered?"],
      complete: ["So. They spoke to you too.", "The Dungeon remembers everything.", "Here - my old blade. You'll need it for what comes next."],
    },
  },
  {
    id: "quest-family-secret",
    title: "The Founder's Truth",
    description: "Reach floor 30 to uncover the truth about Ironhaven's founding.",
    giver: "lord",
    type: "story",
    objectives: [{ id: "reach-30", description: "Reach floor 30 and defeat the First Master", type: "reach", target: "floor-30", required: 1, current: 0 }],
    rewards: { gold: 2000, experience: 5000, unlocks: ["mansion-archives", "true-ending"] },
    dungeonFloorRequired: 30,
    unlockCondition: "floor-20-complete",
    revealsMemory: "memory-full-truth",
    dialogue: {
      start: ["My great-grandfather escaped from that place.", "He never told anyone the full truth.", "Reach the bottom. Find what he hid.", "And bring back the answers we all need."],
      progress: ["The depths await. The truth waits with them."],
      complete: ["So now you know. We all came from that prison.", "The seven women you freed? They were the first to escape.", "My great-grandfather followed them here.", "And you... you've closed the circle. Ended what began centuries ago."],
    },
  },
];

export const heroSkills: HeroSkill[] = [
  { id: "power-strike", name: "Power Strike", description: "A heavy melee blow", damage: 18, cost: 8, cooldown: 0, unlockLevel: 1, type: "physical", scaling: { stat: "strength", multiplier: 0.5 } },
  { id: "defensive-stance", name: "Defensive Stance", description: "Brace for impact, boosting defense", damage: 0, cost: 12, effect: "defense-boost", cooldown: 3, unlockLevel: 3, type: "support", scaling: { stat: "defense", multiplier: 0.3 } },
  { id: "quick-strike", name: "Quick Strike", description: "Fast attack with bonus accuracy", damage: 12, cost: 6, effect: "priority", cooldown: 0, unlockLevel: 5, type: "physical", scaling: { stat: "dexterity", multiplier: 0.6 } },
  { id: "healing-surge", name: "Healing Surge", description: "Restore health with steam magic", damage: 0, cost: 18, effect: "heal-30", cooldown: 3, unlockLevel: 7, type: "support", scaling: { stat: "magicPower", multiplier: 0.4 } },
  { id: "flame-burst", name: "Flame Burst", description: "Blast of magical fire", damage: 22, cost: 15, effect: "burn", cooldown: 1, unlockLevel: 8, type: "magic", scaling: { stat: "magicPower", multiplier: 0.7 } },
  { id: "whirlwind", name: "Whirlwind Slash", description: "Spinning attack hitting all around", damage: 16, cost: 20, effect: "aoe", cooldown: 2, unlockLevel: 10, type: "physical", scaling: { stat: "strength", multiplier: 0.6 } },
  { id: "poison-blade", name: "Poison Blade", description: "Envenom your weapon", damage: 10, cost: 12, effect: "poison", cooldown: 2, unlockLevel: 12, type: "physical", scaling: { stat: "dexterity", multiplier: 0.4 } },
  { id: "arcane-bolt", name: "Arcane Bolt", description: "Pure magical energy projectile", damage: 28, cost: 20, cooldown: 1, unlockLevel: 14, type: "magic", scaling: { stat: "magicPower", multiplier: 0.8 } },
  { id: "lifesteal-strike", name: "Vampiric Strike", description: "Drain life from the enemy", damage: 15, cost: 18, effect: "lifesteal", cooldown: 2, unlockLevel: 16, type: "physical", scaling: { stat: "strength", multiplier: 0.5 } },
  { id: "executioner", name: "Executioner", description: "Massive damage to low health targets", damage: 45, cost: 25, effect: "execute", cooldown: 4, unlockLevel: 18, type: "physical", scaling: { stat: "strength", multiplier: 0.8 } },
  { id: "thunder-strike", name: "Thunder Strike", description: "Call lightning upon your foe", damage: 40, cost: 30, effect: "stun", cooldown: 3, unlockLevel: 22, type: "magic", scaling: { stat: "magicPower", multiplier: 0.9 } },
  { id: "memories-fury", name: "Memory's Fury", description: "Channel forgotten rage into power", damage: 55, cost: 35, effect: "rage", cooldown: 5, unlockLevel: 25, type: "physical", scaling: { stat: "strength", multiplier: 1.0 } },
  { id: "full-restore", name: "Full Restore", description: "Fully heal and cure all ailments", damage: 0, cost: 50, effect: "full-heal", cooldown: 8, unlockLevel: 30, type: "support", scaling: { stat: "magicPower", multiplier: 1.0 } },
];

export const defaultHeroStats: HeroStats = {
  level: 1,
  experience: 0,
  maxHealth: 120,
  currentHealth: 120,
  maxMana: 50,
  currentMana: 50,
  attack: 10,
  defense: 8,
  specialAttack: 6,
  specialDefense: 5,
  accuracy: 65,
  dexterity: 8,
  strength: 10,
  luck: 5,
  dodge: 5,
  magicPower: 6,
  magicDefense: 5,
  speed: 10,
  critChance: 5,
  gold: 100,
  inventory: ["health-potion", "health-potion", "health-potion", "mana-potion", "mana-potion", "bread"],
  equipment: {
    weapon: "bronze-sword",
    body: "leather-armor",
  },
  skills: [],
};
