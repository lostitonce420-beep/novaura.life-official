export interface ImmersiveScene {
  id: string;
  title: string;
  location: string;
  trigger: "quest" | "affinity" | "exploration" | "time" | "item";
  triggerCondition: {
    questId?: string;
    characterId?: string;
    affinityLevel?: number;
    itemId?: string;
    locationId?: string;
    visitCount?: number;
  };
  narrative: SceneNarrative[];
  choices?: SceneChoice[];
  rewards?: SceneReward;
  unlocks?: string[];
  atmosphere: {
    mood: "mysterious" | "romantic" | "tense" | "hopeful" | "dark" | "revelatory";
    ambience: string;
    visualCue: string;
  };
}

export interface SceneNarrative {
  type: "description" | "dialogue" | "thought" | "flashback" | "discovery";
  speaker?: string;
  text: string;
  emotion?: string;
  delay?: number;
}

export interface SceneChoice {
  id: string;
  text: string;
  consequence: string;
  affinityChange?: { characterId: string; points: number }[];
  unlocksScene?: string;
  unlockClue?: string;
  morality?: "compassionate" | "pragmatic" | "ruthless";
  memoryFragment?: string;
}

export interface SceneReward {
  clue?: string;
  item?: string;
  memoryFragment?: string;
  affinityBonus?: { characterId: string; points: number }[];
}

export const immersiveScenes: ImmersiveScene[] = [
  {
    id: "first-night-dream",
    title: "Fragments of Memory",
    location: "hero-room",
    trigger: "quest",
    triggerCondition: { questId: "mq1" },
    atmosphere: {
      mood: "mysterious",
      ambience: "Distant whispers echo through fog. A half-remembered melody plays.",
      visualCue: "Dream-like haze with shifting shadows",
    },
    narrative: [
      { type: "description", text: "Sleep comes fitfully. The unfamiliar bed feels both foreign and strangely comforting." },
      { type: "flashback", text: "Images flash through your mind - a burning village, screaming, running through endless forests..." },
      { type: "thought", text: "How did I get here? The road before the tavern is a blur. Days? Weeks? The memories slip away like smoke." },
      { type: "description", text: "You wake in a cold sweat. Outside your window, the moon watches silently." },
      { type: "discovery", text: "On your nightstand, you notice a small pendant you don't remember owning. It pulses with faint warmth." },
    ],
    rewards: {
      memoryFragment: "A burning village. Screaming. Were those your screams, or someone else's?",
      item: "mysterious-pendant",
    },
  },
  {
    id: "midnight-garden",
    title: "Moonlit Confessions",
    location: "courtyard",
    trigger: "affinity",
    triggerCondition: { characterId: "nymph", affinityLevel: 50 },
    atmosphere: {
      mood: "romantic",
      ambience: "Silver moonlight bathes the garden. Flowers bloom despite the darkness.",
      visualCue: "Ethereal glow, floating petals",
    },
    narrative: [
      { type: "description", text: "You find Willow alone in the courtyard, her form seeming to shimmer in the moonlight." },
      { type: "dialogue", speaker: "nymph", text: "You came. I... wasn't sure you would.", emotion: "vulnerable" },
      { type: "description", text: "The flowers around her lean toward her touch, starved for the magic she can barely give." },
      { type: "dialogue", speaker: "nymph", text: "Before this place, I was connected to everything. Every tree, every blade of grass. Now... I feel so alone." },
      { type: "thought", text: "Her eyes hold centuries of wisdom, yet right now she seems so fragile." },
    ],
    choices: [
      {
        id: "embrace-willow",
        text: "Take her hand gently",
        consequence: "Willow's trust in you deepens. She reveals a secret passage in the cellar.",
        affinityChange: [{ characterId: "nymph", points: 15 }],
        unlockClue: "The cellar has a hidden passage behind the oldest barrel. It leads to ancient tunnels.",
        morality: "compassionate",
      },
      {
        id: "ask-about-magic",
        text: "Ask about breaking the contracts",
        consequence: "Willow appreciates your focus but wishes you'd see her as more than a puzzle to solve.",
        affinityChange: [{ characterId: "nymph", points: 5 }],
        unlockClue: "Nature magic could weaken the contracts, but she's too drained to perform it.",
        morality: "pragmatic",
      },
    ],
  },
  {
    id: "vesper-truth",
    title: "The Devil You Know",
    location: "corridors",
    trigger: "affinity",
    triggerCondition: { characterId: "succubus", affinityLevel: 60 },
    atmosphere: {
      mood: "revelatory",
      ambience: "Candlelight flickers. The air feels charged with unspoken truths.",
      visualCue: "Warm shadows, intimate lighting",
    },
    narrative: [
      { type: "dialogue", speaker: "succubus", text: "I need to tell you something. About how I really came here.", emotion: "serious" },
      { type: "description", text: "Vesper's usual playful demeanor has vanished. She looks haunted." },
      { type: "dialogue", speaker: "succubus", text: "I wasn't captured. I came willingly. I thought I could steal the deed's power for myself." },
      { type: "dialogue", speaker: "succubus", text: "Instead, I became just another prisoner. The irony isn't lost on me." },
      { type: "thought", text: "Her confession changes everything. She knows more about dark magic than she's let on." },
    ],
    choices: [
      {
        id: "forgive-vesper",
        text: "Everyone makes mistakes. What matters is what you do now.",
        consequence: "Vesper is moved by your understanding. She teaches you about nullifying dark contracts.",
        affinityChange: [{ characterId: "succubus", points: 20 }],
        unlockClue: "The deed can be destroyed, but only at the moment of a new moon. The next is in three days.",
        morality: "compassionate",
      },
      {
        id: "leverage-knowledge",
        text: "Your knowledge could help us all. Tell me everything.",
        consequence: "Vesper respects your directness. She shares tactical information.",
        affinityChange: [{ characterId: "succubus", points: 10 }],
        unlockClue: "The owner has a weakness - he must sleep during the new moon to maintain the contracts.",
        morality: "pragmatic",
      },
      {
        id: "distrust-vesper",
        text: "How do I know this isn't another scheme?",
        consequence: "Vesper's expression hardens. Trust is broken, but she still offers basic help.",
        affinityChange: [{ characterId: "succubus", points: -10 }],
        morality: "ruthless",
      },
    ],
  },
  {
    id: "luna-transformation",
    title: "Beast Within",
    location: "courtyard",
    trigger: "time",
    triggerCondition: { visitCount: 3 },
    atmosphere: {
      mood: "tense",
      ambience: "The full moon rises. Howling echoes through the night.",
      visualCue: "Silver light, wild energy",
    },
    narrative: [
      { type: "description", text: "The courtyard is empty except for Luna, who stands rigid, staring at the full moon." },
      { type: "dialogue", speaker: "werewolf", text: "You shouldn't be here. Not tonight.", emotion: "strained" },
      { type: "description", text: "Her eyes flash amber. Her nails begin to lengthen." },
      { type: "dialogue", speaker: "werewolf", text: "The contract... it forces the change. Makes it... violent. Please... go..." },
      { type: "thought", text: "You could run. But something tells you she needs someone to stay." },
    ],
    choices: [
      {
        id: "stay-with-luna",
        text: "I'm not leaving you alone.",
        consequence: "Your presence helps Luna maintain control. She remembers your courage forever.",
        affinityChange: [{ characterId: "werewolf", points: 25 }],
        memoryFragment: "Wolves... a pack... running free under the stars. Was that a memory or a dream?",
        morality: "compassionate",
      },
      {
        id: "find-help",
        text: "I'll get the others. You need help.",
        consequence: "Luna appreciates your concern, though part of her wished you'd stayed.",
        affinityChange: [{ characterId: "werewolf", points: 10 }],
        unlockClue: "Brunhilda knows how to craft silver restraints. They could help Luna during transformations.",
        morality: "pragmatic",
      },
    ],
  },
  {
    id: "gerta-invention",
    title: "Clockwork Heart",
    location: "kitchen",
    trigger: "affinity",
    triggerCondition: { characterId: "gnome", affinityLevel: 45 },
    atmosphere: {
      mood: "hopeful",
      ambience: "Whirring gears and ticking mechanisms fill the secret workshop.",
      visualCue: "Warm copper tones, mechanical wonder",
    },
    narrative: [
      { type: "description", text: "Gerta leads you to a hidden space behind the pantry, cluttered with half-finished devices." },
      { type: "dialogue", speaker: "gnome", text: "I've been working on something. For years, actually. In secret.", emotion: "excited" },
      { type: "description", text: "She reveals a complex mechanical device - gears, crystals, and runes intertwined." },
      { type: "dialogue", speaker: "gnome", text: "It's a contract disruptor. Theoretically, it could break the magical bonds. But it needs one thing I can't get..." },
      { type: "dialogue", speaker: "gnome", text: "A piece of the master deed itself. Even a fragment would power it." },
    ],
    rewards: {
      clue: "Gerta's device could break all contracts at once, but needs deed fragment to power it.",
      item: "contract-disruptor-incomplete",
    },
  },
  {
    id: "brunhilda-past",
    title: "Mountain's Memory",
    location: "cellar",
    trigger: "exploration",
    triggerCondition: { locationId: "cellar", visitCount: 3 },
    atmosphere: {
      mood: "dark",
      ambience: "Stone walls echo with ancient sorrow. The smell of earth fills the air.",
      visualCue: "Dim torchlight, cave-like shadows",
    },
    narrative: [
      { type: "description", text: "Deep in the cellar, you find Brunhilda running her hands along the stone walls." },
      { type: "dialogue", speaker: "dwarf", text: "This stone... it's from the Ironhold Mountains. My home.", emotion: "melancholy" },
      { type: "description", text: "Her fingers trace patterns in the rock - dwarven runes, barely visible." },
      { type: "dialogue", speaker: "dwarf", text: "My clan... they're still searching for me. I can feel it. But the contract prevents any message from leaving." },
      { type: "thought", text: "The runes pulse faintly at her touch. There's magic here, older than the owner's." },
    ],
    choices: [
      {
        id: "help-message",
        text: "What if we could send a message through the stone itself?",
        consequence: "Brunhilda's eyes light up with hope. She teaches you ancient dwarven stone-speaking.",
        affinityChange: [{ characterId: "dwarf", points: 20 }],
        unlockClue: "The foundation stones connect to a network. Messages could travel through them to the mountains.",
        morality: "compassionate",
      },
      {
        id: "focus-escape",
        text: "First we free everyone. Then we'll find your clan.",
        consequence: "Brunhilda nods stoically. She appreciates your priorities.",
        affinityChange: [{ characterId: "dwarf", points: 10 }],
        morality: "pragmatic",
      },
    ],
  },
  {
    id: "pip-secret-passages",
    title: "Through Small Spaces",
    location: "corridors",
    trigger: "affinity",
    triggerCondition: { characterId: "goblin", affinityLevel: 40 },
    atmosphere: {
      mood: "mysterious",
      ambience: "Creaking floorboards. Whispered secrets through thin walls.",
      visualCue: "Narrow passages, hidden doorways",
    },
    narrative: [
      { type: "dialogue", speaker: "goblin", text: "Psst! Follow me. But be quiet!", emotion: "mischievous" },
      { type: "description", text: "Pip leads you through an impossibly small gap behind a tapestry." },
      { type: "description", text: "Inside, a network of passages weaves through the walls - servant corridors long forgotten." },
      { type: "dialogue", speaker: "goblin", text: "I've mapped the whole place! These tunnels go everywhere. Even... his study." },
      { type: "thought", text: "A hidden network. This could change everything." },
    ],
    rewards: {
      clue: "Secret passages run through the entire tavern. One leads directly behind the owner's desk.",
      item: "passage-map",
    },
  },
  {
    id: "owner-confrontation-preview",
    title: "The Watcher's Eyes",
    location: "main-hall",
    trigger: "quest",
    triggerCondition: { questId: "mq6" },
    atmosphere: {
      mood: "tense",
      ambience: "The tavern noise fades. The owner's gaze finds you.",
      visualCue: "Spotlight feeling, paranoid edges",
    },
    narrative: [
      { type: "description", text: "You feel his eyes on you before you see him. The owner stands across the hall, smile never reaching his eyes." },
      { type: "dialogue", speaker: "owner", text: "You've been quite... curious, haven't you? Wandering where guests shouldn't wander." },
      { type: "thought", text: "Does he know? How much has he seen?" },
      { type: "dialogue", speaker: "owner", text: "I appreciate inquisitive minds. Just remember - curiosity is expensive here. Some pay with coin. Others..." },
      { type: "description", text: "He lets the threat hang in the air, then turns away, laughing at something a patron says." },
    ],
    rewards: {
      memoryFragment: "That laugh... you've heard it before. In darkness. In pain. A cage of shadows...",
    },
  },
  {
    id: "collective-hope",
    title: "The Gathering",
    location: "hotsprings",
    trigger: "quest",
    triggerCondition: { questId: "mq8" },
    atmosphere: {
      mood: "hopeful",
      ambience: "Steam rises in the moonlight. For once, all seven are together.",
      visualCue: "Warm mist, unity in diversity",
    },
    narrative: [
      { type: "description", text: "For the first time, all seven women have gathered together. The springs hide their meeting from prying eyes." },
      { type: "dialogue", speaker: "succubus", text: "The hero has nearly reached the deed. This is really happening." },
      { type: "dialogue", speaker: "dwarf", text: "We need to be ready. When those contracts break, there may be chaos." },
      { type: "dialogue", speaker: "nymph", text: "Whatever comes, we face it together. All of us.", emotion: "determined" },
      { type: "description", text: "They turn to you, seven faces united by hope - and by faith in you." },
      { type: "dialogue", speaker: "werewolf", text: "You've given us something we'd almost forgotten. A future." },
    ],
    rewards: {
      affinityBonus: [
        { characterId: "nymph", points: 10 },
        { characterId: "goblin", points: 10 },
        { characterId: "gnome", points: 10 },
        { characterId: "dwarf", points: 10 },
        { characterId: "succubus", points: 10 },
        { characterId: "werewolf", points: 10 },
        { characterId: "beastwoman", points: 10 },
      ],
    },
  },
  {
    id: "final-memory",
    title: "The Truth Before the Choice",
    location: "study",
    trigger: "quest",
    triggerCondition: { questId: "mq10" },
    atmosphere: {
      mood: "revelatory",
      ambience: "Time seems to slow. The deed pulses with dark energy in your hands.",
      visualCue: "Reality warping at edges, memories flooding in",
    },
    narrative: [
      { type: "description", text: "As your fingers touch the master deed, memories crash through you like a tidal wave." },
      { type: "flashback", text: "You see yourself on a road, traveling toward a distant city. Ambushed. Captured. Sold." },
      { type: "flashback", text: "The owner's face, younger but just as cruel. 'This one has potential. Break them slowly.'" },
      { type: "flashback", text: "Months in darkness. Learning to survive. Planning. Finally, an escape into the woods..." },
      { type: "thought", text: "You were a prisoner too. Not bound by contract, but by chains. You escaped... but forgot." },
      { type: "description", text: "The pendant around your neck burns hot. It was a gift - from them. From one of the seven." },
      { type: "flashback", text: "'Come back for us,' she had whispered. 'When you're ready, come back and set us free.'" },
    ],
    rewards: {
      memoryFragment: "You were a prisoner. You escaped. You came back. The pendant was a promise - and now it's time to keep it.",
    },
  },
];

export const memoryFragments: { id: string; text: string; unlockCondition: string }[] = [
  { id: "mf1", text: "A burning village. Screaming. Were those your screams, or someone else's?", unlockCondition: "first-night-dream" },
  { id: "mf2", text: "Wolves... a pack... running free under the stars. Was that a memory or a dream?", unlockCondition: "luna-transformation" },
  { id: "mf3", text: "That laugh... you've heard it before. In darkness. In pain. A cage of shadows...", unlockCondition: "owner-confrontation-preview" },
  { id: "mf4", text: "You were a prisoner. You escaped. You came back. The pendant was a promise.", unlockCondition: "final-memory" },
  { id: "mf5", text: "A road. A cart with iron bars. Other prisoners. One of them had kind eyes...", unlockCondition: "post-game-intro" },
  { id: "mf6", text: "Stone walls. A smith's forge. Learning to hide your thoughts from those who watched.", unlockCondition: "explore-forge" },
  { id: "mf7", text: "Running through moonlit forests. Branches tearing at your skin. Freedom, terrifying and absolute.", unlockCondition: "explore-forest" },
];

export const discoveredSecrets: { id: string; location: string; description: string; narrative: string; reward: string }[] = [
  { id: "secret-cellar-runes", location: "cellar", description: "Ancient dwarven runes carved into foundation stones", narrative: "These runes predate the tavern by centuries. They tell of an older power that once blessed this land.", reward: "clue:The land itself resists the dark magic. Holy ground corrupted." },
  { id: "secret-attic-portrait", location: "attic", description: "A covered painting of the owner - but younger, different", narrative: "The portrait shows the owner as he was - decades ago, or centuries? His eyes in the painting seem almost... sad.", reward: "clue:The owner has lived far longer than any human should." },
  { id: "secret-kitchen-recipe", location: "kitchen", description: "A hidden recipe book with unusual ingredients", narrative: "The recipes call for herbs that dull magical resistance. The food here keeps the prisoners compliant.", reward: "item:antidote-recipe" },
  { id: "secret-corridor-door", location: "corridors", description: "A door that leads nowhere - or everywhere", narrative: "The door opens to a brick wall, but sometimes at night, you hear knocking from the other side.", reward: "clue:The tavern exists partially in another realm. The door is a weak point." },
  { id: "secret-courtyard-tree", location: "courtyard", description: "A dead tree that still whispers", narrative: "Touch the bark and hear voices - fragments of every conversation ever held beneath its branches.", reward: "clue:The owner's true name was spoken here once. Names have power." },
];

export function getAvailableScenes(
  completedQuests: string[], 
  affinityPoints: Record<string, number>,
  discoveredScenes: string[],
  currentLocation: string,
  visitCounts: Record<string, number>
): ImmersiveScene[] {
  return immersiveScenes.filter(scene => {
    if (discoveredScenes.includes(scene.id)) return false;
    
    switch (scene.trigger) {
      case "quest":
        return scene.triggerCondition.questId && completedQuests.includes(scene.triggerCondition.questId);
      case "affinity":
        const charId = scene.triggerCondition.characterId;
        const reqLevel = scene.triggerCondition.affinityLevel || 0;
        return charId && (affinityPoints[charId] || 0) >= reqLevel;
      case "exploration":
        const locId = scene.triggerCondition.locationId;
        const visits = scene.triggerCondition.visitCount || 1;
        return locId === currentLocation && (visitCounts[locId] || 0) >= visits;
      case "time":
        return (visitCounts[currentLocation] || 0) >= (scene.triggerCondition.visitCount || 1);
      default:
        return false;
    }
  });
}
