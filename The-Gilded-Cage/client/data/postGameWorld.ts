export interface WorldLocation3D {
  id: string;
  name: string;
  description: string;
  coordinates: { x: number; y: number; z: number };
  connectedTo: string[];
  memoryFragments: string[];
  npcs: WorldNPC[];
  interactables: WorldInteractable[];
  discovered: boolean;
  atmosphere: string;
  terrain: "forest" | "plains" | "mountains" | "village" | "ruins" | "road" | "cave";
}

export interface WorldNPC {
  id: string;
  name: string;
  role: string;
  dialogue: NPCDialogue[];
  memoryTrigger?: string;
  questGiver?: boolean;
}

export interface NPCDialogue {
  condition?: string;
  text: string;
  responses?: { text: string; nextDialogue?: string; revealsMemory?: string }[];
}

export interface WorldInteractable {
  id: string;
  name: string;
  description: string;
  action: string;
  reward?: { type: "memory" | "item" | "clue"; value: string };
}

export interface MemoryFragment3D {
  id: string;
  title: string;
  content: string;
  location: string;
  importance: "minor" | "major" | "critical";
  linkedMemories: string[];
  unlocked: boolean;
}

export interface PostGameState {
  currentLocation: string;
  discoveredLocations: string[];
  collectedMemories: string[];
  inventoryItems: string[];
  npcRelationships: Record<string, number>;
  mainQuestProgress: number;
  heroOriginRevealed: boolean;
  timeSpentExploring: number;
  choiceMadeAtBordello: "liberate" | "takeover";
}

export const worldLocations: WorldLocation3D[] = [
  {
    id: "bordello-exit",
    name: "The Gilded Cage - Entrance",
    description: "The familiar doors of the tavern. Behind you, freedom - or a new form of bondage, depending on your choice. The road ahead is shrouded in morning mist.",
    coordinates: { x: 0, y: 0, z: 0 },
    connectedTo: ["crossroads"],
    memoryFragments: ["memory-departure"],
    npcs: [],
    interactables: [
      {
        id: "tavern-sign",
        name: "The Gilded Cage Sign",
        description: "The ornate sign creaks in the wind. Looking at it stirs something in your mind.",
        action: "examine",
        reward: { type: "memory", value: "You came here by choice, though you didn't know it. The pendant guided you back." },
      },
    ],
    discovered: true,
    atmosphere: "Bittersweet freedom. The journey begins anew.",
    terrain: "road",
  },
  {
    id: "crossroads",
    name: "The Forgotten Crossroads",
    description: "Four roads meet here. A weathered signpost points in multiple directions, but some of the names have faded. Which way did you come from?",
    coordinates: { x: 100, y: 0, z: 0 },
    connectedTo: ["bordello-exit", "dark-forest", "plains-road", "mountain-path"],
    memoryFragments: ["memory-crossroads"],
    npcs: [
      {
        id: "wandering-merchant",
        name: "Old Mathias",
        role: "Traveling Merchant",
        dialogue: [
          {
            text: "Ah, another soul from that accursed place. You have the look of someone searching for something they've lost.",
            responses: [
              { text: "What do you know about me?", nextDialogue: "merchant-knowledge" },
              { text: "What is this place?", nextDialogue: "merchant-location" },
              { text: "I should go.", nextDialogue: "" },
            ],
          },
          {
            condition: "merchant-knowledge",
            text: "Only what I see. You came from the east, like many before you. Most don't remember the road that brought them there. The magic... it steals memories.",
            responses: [
              { text: "Can memories be recovered?", revealsMemory: "memory-merchant-hint" },
            ],
          },
          {
            condition: "merchant-location",
            text: "The crossroads between four realms. North leads to the Ironhold Mountains - dwarven territory. South to the Whisperwood. West to the plains and, eventually, the great city of Valdris. East... well, you know what's east.",
          },
        ],
        memoryTrigger: "memory-merchant-past",
      },
    ],
    interactables: [
      {
        id: "signpost",
        name: "Ancient Signpost",
        description: "Weathered wood with faded writing. One direction seems to call to you more than others.",
        action: "examine",
        reward: { type: "clue", value: "The city of Valdris. That name feels important. Like home, perhaps?" },
      },
    ],
    discovered: false,
    atmosphere: "A place of decisions. Every direction holds answers.",
    terrain: "road",
  },
  {
    id: "dark-forest",
    name: "The Whisperwood",
    description: "Ancient trees tower overhead, their branches intertwining to block out the sun. Paths wind through the undergrowth, and strange sounds echo from deeper within.",
    coordinates: { x: 100, y: -150, z: 0 },
    connectedTo: ["crossroads", "forest-clearing", "ruined-shrine"],
    memoryFragments: ["memory-escape-forest"],
    npcs: [
      {
        id: "forest-spirit",
        name: "Echo",
        role: "Forest Spirit",
        dialogue: [
          {
            text: "You passed through here once before. Running. Bleeding. The trees remember.",
            responses: [
              { text: "Show me what the trees remember.", revealsMemory: "memory-forest-escape" },
              { text: "Was I alone?", nextDialogue: "spirit-companion" },
            ],
          },
          {
            condition: "spirit-companion",
            text: "For a time, yes. But something - someone - gave you direction. A voice in your dreams. A promise to return.",
            responses: [
              { text: "The pendant... it was a guide.", revealsMemory: "memory-pendant-origin" },
            ],
          },
        ],
        memoryTrigger: "memory-nymph-connection",
      },
    ],
    interactables: [
      {
        id: "marked-tree",
        name: "Scarred Oak",
        description: "Deep claw marks gouge the bark. Old blood stains the roots.",
        action: "examine",
        reward: { type: "memory", value: "You fought something here. Or something fought for you. Wolves howling. A woman's scream." },
      },
    ],
    discovered: false,
    atmosphere: "Primal and watchful. The forest knows your secrets.",
    terrain: "forest",
  },
  {
    id: "forest-clearing",
    name: "The Hollow",
    description: "A perfect circle of grass surrounded by ancient oaks. Moonflowers bloom here year-round. This place holds old magic - benevolent magic.",
    coordinates: { x: 50, y: -250, z: 0 },
    connectedTo: ["dark-forest"],
    memoryFragments: ["memory-nymph-sanctuary"],
    npcs: [],
    interactables: [
      {
        id: "moonflower-ring",
        name: "Circle of Moonflowers",
        description: "The flowers glow faintly, even in daylight. Standing in their center brings a sense of peace.",
        action: "meditate",
        reward: { type: "memory", value: "Willow. Her name was Willow. She spoke to you through dreams, through the pendant. She led you back to free them all." },
      },
    ],
    discovered: false,
    atmosphere: "Sacred and healing. A refuge from darkness.",
    terrain: "forest",
  },
  {
    id: "ruined-shrine",
    name: "Shrine of the Old Gods",
    description: "Crumbling stone pillars surround an altar covered in moss. Someone has left recent offerings here - flowers, small coins, a child's toy.",
    coordinates: { x: 150, y: -200, z: 0 },
    connectedTo: ["dark-forest"],
    memoryFragments: ["memory-old-faith"],
    npcs: [
      {
        id: "priestess",
        name: "Elara the Keeper",
        role: "Shrine Keeper",
        dialogue: [
          {
            text: "Few visit the old shrines anymore. The new gods promise easier answers. But you... you carry something ancient.",
            responses: [
              { text: "The pendant?", nextDialogue: "priestess-pendant" },
              { text: "What do you know about soul contracts?", nextDialogue: "priestess-contracts" },
            ],
          },
          {
            condition: "priestess-pendant",
            text: "That trinket holds a fragment of nature's blessing. A nymph's gift. Such magic can only be given freely, with love. Someone cared for you deeply.",
            responses: [
              { text: "I need to understand my past.", revealsMemory: "memory-priestess-vision" },
            ],
          },
          {
            condition: "priestess-contracts",
            text: "Dark magic, born of corruption. The old gods despise such bonds. Whoever created them traded their humanity long ago. They are no longer truly mortal.",
          },
        ],
        questGiver: true,
      },
    ],
    interactables: [
      {
        id: "altar",
        name: "Ancient Altar",
        description: "The stone is warm to the touch. Carvings depict scenes of nature spirits protecting travelers.",
        action: "pray",
        reward: { type: "memory", value: "You prayed here once. Before the capture. Before everything went dark. You were a pilgrim, seeking the old ways." },
      },
    ],
    discovered: false,
    atmosphere: "Ancient and sacred. The gods have not forgotten.",
    terrain: "ruins",
  },
  {
    id: "plains-road",
    name: "The Western Road",
    description: "A well-maintained road stretches toward the horizon. In the distance, you can see the spires of a great city. Merchants and travelers pass by regularly.",
    coordinates: { x: -100, y: 0, z: 0 },
    connectedTo: ["crossroads", "roadside-inn", "bandit-camp"],
    memoryFragments: ["memory-journey-begin"],
    npcs: [
      {
        id: "traveling-guard",
        name: "Captain Vance",
        role: "Caravan Guard",
        dialogue: [
          {
            text: "Heading to Valdris? Careful on the road - bandits have been active lately. They prey on lone travelers.",
            responses: [
              { text: "Have you seen bandits capture people before?", nextDialogue: "guard-bandits" },
              { text: "Tell me about Valdris.", nextDialogue: "guard-city" },
            ],
          },
          {
            condition: "guard-bandits",
            text: "Capture? More like sell. There's a dark trade in these parts. People disappear, sold to places that shouldn't exist. That cursed tavern to the east... it's said to be one of those places.",
            responses: [
              { text: "I came from there.", revealsMemory: "memory-guard-recognition" },
            ],
          },
          {
            condition: "guard-city",
            text: "The jewel of the west. Trade, culture, opportunity. If you're looking for answers about your past, the City Archives might help. They keep records of everything - including missing persons.",
          },
        ],
      },
    ],
    interactables: [
      {
        id: "milestone",
        name: "Ancient Milestone",
        description: "Carved stone marking distances. 'Valdris - 3 days. Ironhold - 5 days. The Gilded Cage - BEWARE'",
        action: "examine",
        reward: { type: "clue", value: "Someone has been warning travelers about the tavern. The scratched warning is recent." },
      },
    ],
    discovered: false,
    atmosphere: "Open and hopeful. The road to answers.",
    terrain: "plains",
  },
  {
    id: "roadside-inn",
    name: "The Weary Traveler Inn",
    description: "A humble roadside establishment - nothing like the gilded prison you escaped. Simple, honest, and welcoming. The innkeeper's family has served travelers for generations.",
    coordinates: { x: -200, y: 50, z: 0 },
    connectedTo: ["plains-road", "valdris-gates"],
    memoryFragments: ["memory-first-stop"],
    npcs: [
      {
        id: "innkeeper",
        name: "Martha",
        role: "Innkeeper",
        dialogue: [
          {
            text: "Welcome, traveler! You look like you've had quite a journey. Sit, rest. First meal is on the house for those with that haunted look.",
            responses: [
              { text: "Haunted?", nextDialogue: "innkeeper-haunted" },
              { text: "Have you seen me before?", nextDialogue: "innkeeper-before" },
            ],
          },
          {
            condition: "innkeeper-haunted",
            text: "We see it sometimes. People who've escaped dark places. The eyes tell the story. Whatever happened, you survived. That's what matters.",
          },
          {
            condition: "innkeeper-before",
            text: "Hmm... you know, someone matching your description passed through months ago, heading east. Asked about that tavern by name. Determined, they were. Same eyes.",
            responses: [
              { text: "That was me. I came back.", revealsMemory: "memory-inn-return" },
            ],
          },
        ],
      },
    ],
    interactables: [
      {
        id: "guest-book",
        name: "Guest Registry",
        description: "A book where travelers sign their names. Some entries are faded, others fresh.",
        action: "examine",
        reward: { type: "memory", value: "There - your name. Written months ago. Destination: The Gilded Cage. Purpose: 'To keep a promise.'" },
      },
    ],
    discovered: false,
    atmosphere: "Warm and safe. A reminder of normalcy.",
    terrain: "village",
  },
  {
    id: "bandit-camp",
    name: "Slavers' Hideout",
    description: "Hidden in a ravine off the main road. The remains of a bandit camp - or something worse. Iron cages stand empty now, but the stench of fear lingers.",
    coordinates: { x: -150, y: -80, z: 0 },
    connectedTo: ["plains-road"],
    memoryFragments: ["memory-capture"],
    npcs: [],
    interactables: [
      {
        id: "empty-cage",
        name: "Iron Prisoner Cage",
        description: "Rusted bars. Scratches on the inside where desperate hands clawed for freedom. Something about this is terrifyingly familiar.",
        action: "examine",
        reward: { type: "memory", value: "You were in this cage. Or one just like it. Days in darkness, the wagon bumping along rough roads. Others crying around you. A voice whispering: 'Be strong. We'll survive this together.'" },
      },
      {
        id: "slaver-journal",
        name: "Torn Ledger Page",
        description: "A page from a slaver's accounts, left behind in haste.",
        action: "read",
        reward: { type: "memory", value: "Names and prices. Your name is here, circled. Next to it: 'Special delivery - The Gilded Cage. Payment: 50 gold + continued supply.'" },
      },
    ],
    discovered: false,
    atmosphere: "Dark and traumatic. The truth hurts.",
    terrain: "cave",
  },
  {
    id: "mountain-path",
    name: "Path to Ironhold",
    description: "A winding path leading into the mountains. The air grows colder and thinner. In the distance, you can see smoke rising from dwarven forges.",
    coordinates: { x: 100, y: 0, z: 100 },
    connectedTo: ["crossroads", "mountain-village", "dwarven-gates"],
    memoryFragments: ["memory-mountain-journey"],
    npcs: [],
    interactables: [
      {
        id: "mountain-marker",
        name: "Dwarven Boundary Stone",
        description: "Carved with the sigil of the Ironhold clans. A warning and welcome in equal measure.",
        action: "examine",
        reward: { type: "clue", value: "Brunhilda's clan symbol appears among the carvings. She wasn't lying - this is really her home." },
      },
    ],
    discovered: false,
    atmosphere: "Harsh but honest. The mountains judge fairly.",
    terrain: "mountains",
  },
  {
    id: "mountain-village",
    name: "Stonehaven",
    description: "A small mining village clinging to the mountainside. Humans and dwarves work side by side here, extracting precious ore from the earth.",
    coordinates: { x: 150, y: 0, z: 200 },
    connectedTo: ["mountain-path", "dwarven-gates"],
    memoryFragments: ["memory-stone-connection"],
    npcs: [
      {
        id: "miner",
        name: "Torbin",
        role: "Human Miner",
        dialogue: [
          {
            text: "Another flatlander? Not many come this way anymore. The mountains aren't welcoming to strangers... usually.",
            responses: [
              { text: "I'm looking for the Ironhold clan.", nextDialogue: "miner-clan" },
              { text: "Have you heard of Brunhilda?", nextDialogue: "miner-brunhilda" },
            ],
          },
          {
            condition: "miner-clan",
            text: "Ironhold? Aye, they're the ruling clan. Their halls lie beyond the great gates. But they're not accepting visitors - they've been mourning for years. Lost their princess, they say.",
          },
          {
            condition: "miner-brunhilda",
            text: "Brunhilda? That's... that's the princess's name. The one who disappeared. Are you saying you know where she is?",
            responses: [
              { text: "She's safe now. I helped free her.", revealsMemory: "memory-miner-promise" },
            ],
          },
        ],
      },
    ],
    interactables: [],
    discovered: false,
    atmosphere: "Industrious and hopeful. A community that endures.",
    terrain: "mountains",
  },
  {
    id: "dwarven-gates",
    name: "Gates of Ironhold",
    description: "Massive stone doors carved into the mountainside. Dwarven runes glow with protective magic. Guards in gleaming armor stand eternal watch.",
    coordinates: { x: 200, y: 0, z: 300 },
    connectedTo: ["mountain-village"],
    memoryFragments: ["memory-homecoming"],
    npcs: [
      {
        id: "gate-guard",
        name: "Thrain Ironbeard",
        role: "Gate Captain",
        dialogue: [
          {
            text: "Halt! The gates of Ironhold are sealed to outsiders. State your business, human.",
            responses: [
              { text: "I bring news of Princess Brunhilda.", nextDialogue: "guard-princess" },
              { text: "I was sent by Brunhilda herself.", nextDialogue: "guard-sent" },
            ],
          },
          {
            condition: "guard-princess",
            text: "The Princess? You dare speak her name? She has been missing for seven years! If this is a trick, you'll regret it.",
          },
          {
            condition: "guard-sent",
            text: "Prove it. What token do you carry? What words did she give you?",
            responses: [
              { text: "'The stone remembers. So do I.'", revealsMemory: "memory-dwarven-acceptance" },
            ],
          },
        ],
      },
    ],
    interactables: [],
    discovered: false,
    atmosphere: "Imposing and ancient. A kingdom's strength.",
    terrain: "mountains",
  },
  {
    id: "valdris-gates",
    name: "Gates of Valdris",
    description: "The great city rises before you, its walls stretching toward the sky. Thousands pass through these gates daily. Somewhere within lies the truth of who you were.",
    coordinates: { x: -400, y: 0, z: 0 },
    connectedTo: ["roadside-inn"],
    memoryFragments: ["memory-home"],
    npcs: [
      {
        id: "gate-clerk",
        name: "City Clerk",
        role: "Gate Administrator",
        dialogue: [
          {
            text: "Name and business in Valdris?",
            responses: [
              { text: "I'm... trying to find out who I am.", nextDialogue: "clerk-identity" },
              { text: "I'm looking for the City Archives.", nextDialogue: "clerk-archives" },
            ],
          },
          {
            condition: "clerk-identity",
            text: "Memory troubles? Not uncommon these days, with all the dark magic about. Try the Temple of Remembrance in the Old Quarter. They specialize in such cases.",
          },
          {
            condition: "clerk-archives",
            text: "Central District, near the Great Library. They keep records of citizens, travelers, and... disappearances. If you were from here, they'd have your name.",
            responses: [
              { text: "Thank you. I need to know.", revealsMemory: "memory-approaching-truth" },
            ],
          },
        ],
      },
    ],
    interactables: [],
    discovered: false,
    atmosphere: "Bustling and alive. A city of possibilities.",
    terrain: "village",
  },
];

export const heroOriginStory: MemoryFragment3D[] = [
  {
    id: "origin-1",
    title: "The Pilgrim's Path",
    content: "You were a pilgrim, traveling to visit the ancient shrines of the old gods. Your journey took you through dangerous territories, but faith guided your steps. Until the day it didn't.",
    location: "ruined-shrine",
    importance: "critical",
    linkedMemories: ["origin-2"],
    unlocked: false,
  },
  {
    id: "origin-2",
    title: "The Ambush",
    content: "They came at night. Slavers, working for someone wealthy and particular. You fought, but there were too many. The last thing you saw was the stars through the bars of a cage.",
    location: "bandit-camp",
    importance: "critical",
    linkedMemories: ["origin-1", "origin-3"],
    unlocked: false,
  },
  {
    id: "origin-3",
    title: "The Gilded Prison",
    content: "The tavern seemed welcoming at first. Then the contracts appeared. Your soul, your freedom, bound in ink and dark magic. But the owner made a mistake - he thought breaking your body would break your will.",
    location: "bordello-exit",
    importance: "critical",
    linkedMemories: ["origin-2", "origin-4"],
    unlocked: false,
  },
  {
    id: "origin-4",
    title: "The Kindness in Darkness",
    content: "One of them - the nymph, Willow - saw something in you. She gave you her pendant, a fragment of her weakened power. 'Find a way out,' she whispered. 'Come back for us. Promise me.'",
    location: "forest-clearing",
    importance: "critical",
    linkedMemories: ["origin-3", "origin-5"],
    unlocked: false,
  },
  {
    id: "origin-5",
    title: "The Escape",
    content: "One moonless night, you ran. The pendant guided you through the forest, past dangers you couldn't see. The contract that bound you was incomplete - you weren't fully broken, so you weren't fully bound. By dawn, you were free. But your memories... the magic took those as payment.",
    location: "dark-forest",
    importance: "critical",
    linkedMemories: ["origin-4", "origin-6"],
    unlocked: false,
  },
  {
    id: "origin-6",
    title: "The Return",
    content: "Months passed. You rebuilt yourself, piece by piece. The pendant called to you in dreams - Willow's voice, guiding you back. You didn't know why you felt compelled to return to that cursed place. Now you do. It was always a rescue mission. They were always waiting for you.",
    location: "roadside-inn",
    importance: "critical",
    linkedMemories: ["origin-5"],
    unlocked: false,
  },
];

export const defaultPostGameState: PostGameState = {
  currentLocation: "bordello-exit",
  discoveredLocations: ["bordello-exit"],
  collectedMemories: [],
  inventoryItems: ["mysterious-pendant"],
  npcRelationships: {},
  mainQuestProgress: 0,
  heroOriginRevealed: false,
  timeSpentExploring: 0,
  choiceMadeAtBordello: "liberate",
};
