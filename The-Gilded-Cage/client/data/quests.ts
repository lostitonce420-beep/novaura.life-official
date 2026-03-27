export interface Quest {
  id: string;
  title: string;
  description: string;
  type: "main" | "side";
  targetCharacter?: string;
  locationId: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  requiredQuest?: string;
  dialogue: QuestDialogue[];
}

export interface QuestObjective {
  id: string;
  description: string;
  type: "talk" | "find" | "puzzle" | "choice" | "explore";
  target?: string;
  completed: boolean;
}

export interface QuestReward {
  affinityPoints?: { characterId: string; points: number }[];
  clue?: string;
  item?: string;
}

export interface QuestDialogue {
  speaker: "owner" | "hero" | "character" | "narrator";
  speakerId?: string;
  text: string;
  choices?: { text: string; nextIndex: number; affinityChange?: number }[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  image: any;
  availableActions: string[];
  characters?: string[];
}

export const locations: Location[] = [
  {
    id: "main-hall",
    name: "Main Hall",
    description: "The bustling heart of the tavern. Patrons drink and share stories while the owner watches from behind the bar.",
    image: require("../../assets/images/location-main-hall.png"),
    availableActions: ["talk", "observe", "drink"],
    characters: ["owner"],
  },
  {
    id: "corridors",
    name: "Private Corridors",
    description: "A dimly lit hallway lined with ornate doors. Each leads to a private chamber where the girls reside.",
    image: require("../../assets/images/location-corridors.png"),
    availableActions: ["explore", "listen"],
    characters: ["nymph", "goblin", "gnome", "dwarf", "succubus", "werewolf", "beastwoman"],
  },
  {
    id: "cellar",
    name: "Wine Cellar",
    description: "A dusty underground storage filled with barrels and bottles. Something about it feels... off.",
    image: require("../../assets/images/location-cellar.png"),
    availableActions: ["search", "explore"],
  },
  {
    id: "study",
    name: "Owner's Study",
    description: "A locked room filled with books, documents, and mysterious artifacts. The owner's private sanctum.",
    image: require("../../assets/images/location-study.png"),
    availableActions: ["search", "read", "puzzle"],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    description: "A warm, busy space where meals are prepared. The staff here see everything that happens.",
    image: require("../../assets/images/location-kitchen.png"),
    availableActions: ["talk", "help"],
    characters: ["gnome"],
  },
  {
    id: "courtyard",
    name: "Moonlit Courtyard",
    description: "A secret garden behind the tavern. The only place where the girls can glimpse the outside world.",
    image: require("../../assets/images/location-courtyard.png"),
    availableActions: ["explore", "rest"],
    characters: ["nymph", "werewolf"],
  },
  {
    id: "attic",
    name: "Dusty Attic",
    description: "Forgotten storage above the tavern. Covered in dust and cobwebs, hiding secrets of the past.",
    image: require("../../assets/images/location-attic.png"),
    availableActions: ["search", "explore"],
  },
  {
    id: "hotsprings",
    name: "Hidden Springs",
    description: "A secret outdoor hot spring where the girls come to relax and speak freely. They rotate through, each seeking a moment of peace.",
    image: require("../../assets/images/location-hotsprings.png"),
    availableActions: ["bathe", "talk", "observe"],
    characters: ["nymph", "goblin", "gnome", "dwarf", "succubus", "werewolf", "beastwoman"],
  },
];

export const mainQuests: Quest[] = [
  {
    id: "mq1",
    title: "A Stranger's Welcome",
    description: "Arrive at the tavern and meet the mysterious owner. Something about this place feels strange...",
    type: "main",
    locationId: "main-hall",
    objectives: [
      { id: "mq1-1", description: "Enter the tavern", type: "explore", completed: false },
      { id: "mq1-2", description: "Share a drink with the owner", type: "talk", target: "owner", completed: false },
      { id: "mq1-3", description: "Learn about the establishment", type: "talk", completed: false },
    ],
    rewards: { clue: "The owner seems eager to show off his 'companions'..." },
    dialogue: [
      { speaker: "narrator", text: "The heavy oak door creaks open, revealing a warmly lit tavern. The scent of ale and woodsmoke fills your nostrils." },
      { speaker: "owner", text: "Ah, a new face! Welcome, weary traveler. Come, sit by the fire. Let me pour you something special." },
      { speaker: "hero", text: "Thank you. This place has quite an atmosphere." },
      { speaker: "owner", text: "Indeed it does! I've spent years cultivating it. This is no ordinary establishment, you see. We offer... unique companionship." },
    ],
  },
  {
    id: "mq2",
    title: "First Impressions",
    description: "Meet one of the tavern's residents and sense that something is terribly wrong.",
    type: "main",
    locationId: "corridors",
    requiredQuest: "mq1",
    objectives: [
      { id: "mq2-1", description: "Choose a companion to visit", type: "choice", completed: false },
      { id: "mq2-2", description: "Notice the fear in her eyes", type: "talk", completed: false },
      { id: "mq2-3", description: "Earn enough trust for her to reveal the truth", type: "talk", completed: false },
    ],
    rewards: { 
      clue: "These women are prisoners! The owner holds magical contracts over them.",
      affinityPoints: [{ characterId: "selected", points: 10 }]
    },
    dialogue: [
      { speaker: "narrator", text: "As the owner leads you down the corridor, you notice how the girls look at him - with barely concealed fear." },
      { speaker: "character", text: "Welcome... please, come in.", speakerId: "selected" },
      { speaker: "narrator", text: "Once the door closes, her expression changes. She glances at the door nervously." },
      { speaker: "character", text: "You seem different from the others. Please... you have to help us. We're trapped here.", speakerId: "selected" },
    ],
  },
  {
    id: "mq3",
    title: "Whispers in the Dark",
    description: "Gather information from the other residents about the owner's dark magic.",
    type: "main",
    locationId: "corridors",
    requiredQuest: "mq2",
    objectives: [
      { id: "mq3-1", description: "Speak with at least three different girls", type: "talk", completed: false },
      { id: "mq3-2", description: "Learn about the soul contracts", type: "find", completed: false },
      { id: "mq3-3", description: "Discover mention of a 'master deed'", type: "find", completed: false },
    ],
    rewards: { 
      clue: "A master deed controls all the contracts. It's hidden somewhere in the owner's private quarters.",
      affinityPoints: [{ characterId: "all", points: 5 }]
    },
    dialogue: [
      { speaker: "narrator", text: "You move through the corridors, speaking quietly with each of the captive women." },
      { speaker: "character", text: "He uses dark magic... soul contracts that bind us to this place.", speakerId: "succubus" },
      { speaker: "character", text: "I've heard him speak of a master deed. It controls all our contracts.", speakerId: "gnome" },
    ],
  },
  {
    id: "mq4",
    title: "The Cellar's Secrets",
    description: "Search the wine cellar for clues about the owner's magical practices.",
    type: "main",
    locationId: "cellar",
    requiredQuest: "mq3",
    objectives: [
      { id: "mq4-1", description: "Find a way into the cellar", type: "explore", completed: false },
      { id: "mq4-2", description: "Discover the hidden compartment", type: "search", completed: false },
      { id: "mq4-3", description: "Retrieve the old journal", type: "find", completed: false },
    ],
    rewards: { 
      clue: "The journal mentions a key hidden in the kitchen, needed to access the study.",
      item: "journal"
    },
    dialogue: [
      { speaker: "narrator", text: "The cellar is dark and musty. You search among the barrels and dusty bottles." },
      { speaker: "narrator", text: "Behind a stack of old crates, you find a loose stone in the wall. Behind it lies a weathered journal." },
      { speaker: "hero", text: "This looks like records of his transactions... and mentions of a special key in the kitchen." },
    ],
  },
  {
    id: "mq5",
    title: "Kitchen Confidential",
    description: "Find the hidden key that grants access to the owner's study.",
    type: "main",
    locationId: "kitchen",
    requiredQuest: "mq4",
    objectives: [
      { id: "mq5-1", description: "Befriend Gerta who works in the kitchen", type: "talk", target: "gnome", completed: false },
      { id: "mq5-2", description: "Learn about the hidden compartment", type: "find", completed: false },
      { id: "mq5-3", description: "Retrieve the golden key", type: "find", completed: false },
    ],
    rewards: { 
      clue: "The study holds the answers, but the owner's puzzles guard his secrets.",
      item: "key",
      affinityPoints: [{ characterId: "gnome", points: 15 }]
    },
    dialogue: [
      { speaker: "character", text: "You found the journal! I knew there had to be records somewhere.", speakerId: "gnome" },
      { speaker: "character", text: "The key... I've seen where he hides it. Behind the third copper pot from the left. But be careful!", speakerId: "gnome" },
      { speaker: "narrator", text: "You find the hidden compartment and retrieve an ornate golden key." },
    ],
  },
  {
    id: "mq6",
    title: "Into the Lion's Den",
    description: "Sneak into the owner's study and begin searching for the master deed.",
    type: "main",
    locationId: "study",
    requiredQuest: "mq5",
    objectives: [
      { id: "mq6-1", description: "Wait for the owner to be distracted", type: "explore", completed: false },
      { id: "mq6-2", description: "Use the key to enter the study", type: "explore", completed: false },
      { id: "mq6-3", description: "Discover the puzzle-locked safe", type: "find", completed: false },
    ],
    rewards: { 
      clue: "Three puzzle locks guard the safe. Each requires a different type of solution."
    },
    dialogue: [
      { speaker: "narrator", text: "With the owner occupied, you slip the golden key into the lock. The study door swings open silently." },
      { speaker: "narrator", text: "The room is filled with books and strange artifacts. Behind the desk, you spot a large safe with three distinct locks." },
      { speaker: "hero", text: "Puzzle locks... I'll need to solve each one to reach the master deed." },
    ],
  },
  {
    id: "mq7",
    title: "The First Lock",
    description: "Solve the first puzzle to unlock part of the safe.",
    type: "main",
    locationId: "study",
    requiredQuest: "mq6",
    objectives: [
      { id: "mq7-1", description: "Examine the first lock mechanism", type: "puzzle", completed: false },
      { id: "mq7-2", description: "Solve the pattern puzzle", type: "puzzle", completed: false },
    ],
    rewards: { 
      clue: "One lock down, two to go. The second lock seems more complex."
    },
    dialogue: [
      { speaker: "narrator", text: "The first lock glows with arcane symbols. It requires you to repeat a magical pattern." },
    ],
  },
  {
    id: "mq8",
    title: "The Second Lock",
    description: "Solve the second, more complex puzzle.",
    type: "main",
    locationId: "study",
    requiredQuest: "mq7",
    objectives: [
      { id: "mq8-1", description: "Study the second lock's mechanism", type: "puzzle", completed: false },
      { id: "mq8-2", description: "Solve the extended pattern puzzle", type: "puzzle", completed: false },
    ],
    rewards: { 
      clue: "Two locks open! The final one pulses with the most powerful magic."
    },
    dialogue: [
      { speaker: "narrator", text: "The second lock activates, revealing a longer and more intricate pattern to memorize." },
    ],
  },
  {
    id: "mq9",
    title: "The Final Lock",
    description: "Solve the last and most difficult puzzle to open the safe.",
    type: "main",
    locationId: "study",
    requiredQuest: "mq8",
    objectives: [
      { id: "mq9-1", description: "Face the final puzzle lock", type: "puzzle", completed: false },
      { id: "mq9-2", description: "Complete the master pattern", type: "puzzle", completed: false },
      { id: "mq9-3", description: "Open the safe", type: "find", completed: false },
    ],
    rewards: { 
      clue: "The master deed is within your grasp. Now you must make a choice.",
      item: "deed"
    },
    dialogue: [
      { speaker: "narrator", text: "The final lock pulses with dark energy. This is the owner's most powerful protection." },
      { speaker: "narrator", text: "With the last lock defeated, the safe creaks open. Inside lies the master deed - a document radiating ominous power." },
    ],
  },
  {
    id: "mq10",
    title: "The Final Choice",
    description: "With the master deed in hand, decide the fate of the tavern and its captives.",
    type: "main",
    locationId: "study",
    requiredQuest: "mq9",
    objectives: [
      { id: "mq10-1", description: "Confront the owner", type: "talk", target: "owner", completed: false },
      { id: "mq10-2", description: "Make your final decision", type: "choice", completed: false },
    ],
    rewards: {},
    dialogue: [
      { speaker: "owner", text: "YOU! How did you— That deed is MINE!" },
      { speaker: "hero", text: "Not anymore. Now I hold the power over these souls." },
      { speaker: "owner", text: "Please... we can make a deal. I'll give you anything!" },
      { speaker: "narrator", text: "The moment of truth has arrived. Will you destroy the deed and free everyone, or sign your name and claim the power for yourself?" },
    ],
  },
];

export const sideQuests: Quest[] = [
  {
    id: "sq-nymph-1",
    title: "Willow's Garden",
    description: "Help Willow tend to the courtyard garden, her only connection to nature.",
    type: "side",
    targetCharacter: "nymph",
    locationId: "courtyard",
    objectives: [
      { id: "sq-n1-1", description: "Visit Willow in the courtyard", type: "explore", completed: false },
      { id: "sq-n1-2", description: "Help her care for the plants", type: "talk", completed: false },
      { id: "sq-n1-3", description: "Listen to her stories of the Eldergrove", type: "talk", completed: false },
    ],
    rewards: { affinityPoints: [{ characterId: "nymph", points: 20 }] },
    dialogue: [
      { speaker: "character", text: "You came! The moonflowers are blooming tonight. Would you like to help me tend them?", speakerId: "nymph" },
      { speaker: "narrator", text: "You spend the evening helping Willow nurture the small garden, listening to tales of her forest home." },
      { speaker: "character", text: "Thank you... this is the first time I've felt at peace since I arrived here.", speakerId: "nymph" },
    ],
  },
  {
    id: "sq-goblin-1",
    title: "Pip's Treasure Hunt",
    description: "Help Pip search the attic for something she lost long ago.",
    type: "side",
    targetCharacter: "goblin",
    locationId: "attic",
    objectives: [
      { id: "sq-g1-1", description: "Meet Pip in the attic", type: "explore", completed: false },
      { id: "sq-g1-2", description: "Search through the old trunks", type: "search", completed: false },
      { id: "sq-g1-3", description: "Find her childhood keepsake", type: "find", completed: false },
    ],
    rewards: { affinityPoints: [{ characterId: "goblin", points: 20 }] },
    dialogue: [
      { speaker: "character", text: "I hid something here when I first arrived... before I knew I could never leave. Will you help me find it?", speakerId: "goblin" },
      { speaker: "narrator", text: "You search through dusty chests until you find a small, worn toy - a carved wooden figure." },
      { speaker: "character", text: "My mother made this for me! I thought I'd lost it forever. Thank you!", speakerId: "goblin" },
    ],
  },
  {
    id: "sq-gnome-1",
    title: "Gerta's Invention",
    description: "Help Gerta complete a secret device she's been building.",
    type: "side",
    targetCharacter: "gnome",
    locationId: "kitchen",
    objectives: [
      { id: "sq-gn1-1", description: "Find the missing gear in the cellar", type: "find", completed: false },
      { id: "sq-gn1-2", description: "Bring it to Gerta", type: "talk", target: "gnome", completed: false },
      { id: "sq-gn1-3", description: "Help her test the device", type: "talk", completed: false },
    ],
    rewards: { affinityPoints: [{ characterId: "gnome", points: 20 }] },
    dialogue: [
      { speaker: "character", text: "I'm so close to finishing my detection device! It can sense magical contracts. But I need a specific gear...", speakerId: "gnome" },
      { speaker: "narrator", text: "You retrieve the gear and watch as Gerta expertly assembles her invention." },
      { speaker: "character", text: "It works! This could help us find weaknesses in the contracts. You've been invaluable!", speakerId: "gnome" },
    ],
  },
  {
    id: "sq-dwarf-1",
    title: "Brunhilda's Challenge",
    description: "Prove your worth to Brunhilda through a friendly competition.",
    type: "side",
    targetCharacter: "dwarf",
    locationId: "main-hall",
    objectives: [
      { id: "sq-d1-1", description: "Accept Brunhilda's arm wrestling challenge", type: "talk", completed: false },
      { id: "sq-d1-2", description: "Give it your best effort", type: "choice", completed: false },
      { id: "sq-d1-3", description: "Share stories over ale", type: "talk", completed: false },
    ],
    rewards: { affinityPoints: [{ characterId: "dwarf", points: 20 }] },
    dialogue: [
      { speaker: "character", text: "Think you're strong enough to challenge a daughter of the mountain? Let's see what you've got!", speakerId: "dwarf" },
      { speaker: "narrator", text: "Though you lose the match, Brunhilda respects your effort and buys you a round." },
      { speaker: "character", text: "Ha! You've got spirit, I'll give you that. Perhaps there's hope for this quest of yours after all.", speakerId: "dwarf" },
    ],
  },
  {
    id: "sq-succubus-1",
    title: "Vesper's Secret",
    description: "Learn ancient lore from Vesper about breaking magical contracts.",
    type: "side",
    targetCharacter: "succubus",
    locationId: "corridors",
    objectives: [
      { id: "sq-s1-1", description: "Gain Vesper's trust", type: "talk", completed: false },
      { id: "sq-s1-2", description: "Learn about contract magic", type: "talk", completed: false },
      { id: "sq-s1-3", description: "Discover a weakness in the binding", type: "find", completed: false },
    ],
    rewards: { 
      affinityPoints: [{ characterId: "succubus", points: 20 }],
      clue: "Soul contracts have a weakness - they require the physical deed to maintain power."
    },
    dialogue: [
      { speaker: "character", text: "You seek knowledge of dark magic? How... intriguing. Perhaps I can teach you.", speakerId: "succubus" },
      { speaker: "narrator", text: "Vesper shares ancient lore about soul contracts and their vulnerabilities." },
      { speaker: "character", text: "The contracts are bound to the physical deed. Destroy it, and the bindings shatter. Remember that.", speakerId: "succubus" },
    ],
  },
  {
    id: "sq-werewolf-1",
    title: "Luna's Moonlight Run",
    description: "Keep Luna company during a difficult full moon night.",
    type: "side",
    targetCharacter: "werewolf",
    locationId: "courtyard",
    objectives: [
      { id: "sq-w1-1", description: "Find Luna during the full moon", type: "explore", completed: false },
      { id: "sq-w1-2", description: "Help her through the transformation urges", type: "talk", completed: false },
      { id: "sq-w1-3", description: "Share a quiet moment under the moon", type: "talk", completed: false },
    ],
    rewards: { affinityPoints: [{ characterId: "werewolf", points: 20 }] },
    dialogue: [
      { speaker: "character", text: "The moon... it calls to me. But I can't run. I can't be free. It hurts.", speakerId: "werewolf" },
      { speaker: "narrator", text: "You stay with Luna through the night, offering comfort as she fights her instincts." },
      { speaker: "character", text: "You stayed... no one has ever done that. Thank you for seeing the woman beneath the wolf.", speakerId: "werewolf" },
    ],
  },
  {
    id: "sq-beastwoman-1",
    title: "Mittens' Vigil",
    description: "Help Mittens gather information about the owner's schedule.",
    type: "side",
    targetCharacter: "beastwoman",
    locationId: "corridors",
    objectives: [
      { id: "sq-b1-1", description: "Join Mittens in observing the owner", type: "explore", completed: false },
      { id: "sq-b1-2", description: "Note his patterns and weaknesses", type: "find", completed: false },
      { id: "sq-b1-3", description: "Share your findings", type: "talk", completed: false },
    ],
    rewards: { 
      affinityPoints: [{ characterId: "beastwoman", points: 20 }],
      clue: "The owner is always distracted during dinner service - the perfect time to act."
    },
    dialogue: [
      { speaker: "character", text: "I've been watching him for months. Would you like to know what I've learned?", speakerId: "beastwoman" },
      { speaker: "narrator", text: "Together, you observe the owner's movements and identify the best times to act unseen." },
      { speaker: "character", text: "Patience and observation - the keys to any hunt. You learn quickly.", speakerId: "beastwoman" },
    ],
  },
];

export const getQuestById = (id: string): Quest | undefined => {
  return [...mainQuests, ...sideQuests].find(q => q.id === id);
};

export const getLocationById = (id: string): Location | undefined => {
  return locations.find(l => l.id === id);
};

export const getAvailableSideQuests = (characterId: string, completedQuests: string[]): Quest[] => {
  return sideQuests.filter(q => 
    q.targetCharacter === characterId && 
    !completedQuests.includes(q.id)
  );
};

export const getNextMainQuest = (completedQuests: string[]): Quest | undefined => {
  return mainQuests.find(q => {
    if (completedQuests.includes(q.id)) return false;
    if (q.requiredQuest && !completedQuests.includes(q.requiredQuest)) return false;
    return true;
  });
};
