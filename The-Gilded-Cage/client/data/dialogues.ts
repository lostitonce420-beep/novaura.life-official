export interface DialogueLine {
  speaker: "owner" | "hero" | "character" | "narrator";
  text: string;
  choices?: { text: string; nextIndex: number }[];
}

export interface DialogueScene {
  id: string;
  lines: DialogueLine[];
}

export const introDialogue: DialogueLine[] = [
  {
    speaker: "narrator",
    text: "The evening mist parts as you approach the weathered tavern. Warm light spills from its windows, and the scent of ale and wood smoke drifts on the air.",
  },
  {
    speaker: "narrator",
    text: "You push open the heavy oak door, seeking shelter from your long journey.",
  },
  {
    speaker: "owner",
    text: "Ah, a traveler! Welcome, welcome to my humble establishment. Come, sit by the fire. Let me pour you something to take the edge off the road.",
  },
  {
    speaker: "hero",
    text: "Thank you. It's been a long journey. What manner of place is this?",
  },
  {
    speaker: "owner",
    text: "This? Oh, merely the finest rest stop in all the realm. A place where weary souls find... comfort. Many unique companions call this place home.",
  },
  {
    speaker: "narrator",
    text: "The owner slides a tankard of amber ale across the worn wooden bar, his smile never quite reaching his eyes.",
  },
  {
    speaker: "owner",
    text: "Drink, drink! And perhaps, if you're interested, I could introduce you to one of our residents. Each one is... extraordinary in her own way.",
  },
  {
    speaker: "hero",
    text: "Residents?",
  },
  {
    speaker: "owner",
    text: "Indeed! Seven remarkable women, each with their own charm. For a small fee, one could keep you company this evening. Or perhaps you'd like to meet them all first?",
  },
];

export const characterRevealDialogue: Record<string, DialogueLine[]> = {
  nymph: [
    {
      speaker: "narrator",
      text: "The forest nymph's eyes dart nervously to the door before she speaks in a whisper.",
    },
    {
      speaker: "character",
      text: "Please, you must listen carefully. We don't have much time before he notices us speaking.",
    },
    {
      speaker: "hero",
      text: "What do you mean? What's happening here?",
    },
    {
      speaker: "character",
      text: "This place... it's not what it seems. None of us are here by choice. He binds us with dark contracts, magical deeds that chain our very souls to this tavern.",
    },
    {
      speaker: "character",
      text: "I was once a guardian of the Eldergrove. Now I cannot feel the trees, cannot hear the wind. The deed he holds over us strips away our essence.",
    },
    {
      speaker: "hero",
      text: "That's terrible. How can I help?",
    },
    {
      speaker: "character",
      text: "There is a hidden deed - the master contract that binds us all. Find it, and you could set us free... or claim ownership yourself.",
    },
  ],
  goblin: [
    {
      speaker: "narrator",
      text: "The small goblin looks up at you with surprisingly serious eyes, her bare feet silent on the wooden floor.",
    },
    {
      speaker: "character",
      text: "Shh! Keep your voice down. I've been watching you - you seem different from the usual customers.",
    },
    {
      speaker: "hero",
      text: "Different how?",
    },
    {
      speaker: "character",
      text: "You have kind eyes. Most who come here don't see us as people. But we are! We're trapped, all of us, by that horrible man's magic.",
    },
    {
      speaker: "character",
      text: "I just wanted shelter from the rain that night. Now I can never leave. The deed he holds binds my feet to this place.",
    },
    {
      speaker: "hero",
      text: "There must be a way to break these bindings.",
    },
    {
      speaker: "character",
      text: "The hidden deed! It controls everything. Find it in his secret study - solve the puzzles he's set to guard it. You could free us all... if that's what you choose.",
    },
  ],
  gnome: [
    {
      speaker: "narrator",
      text: "The gnome adjusts her spectacles and speaks in hushed, rapid tones.",
    },
    {
      speaker: "character",
      text: "Listen carefully, I don't have time to repeat myself. I've been studying the magical architecture of this place.",
    },
    {
      speaker: "hero",
      text: "Architecture? You mean there's more than meets the eye?",
    },
    {
      speaker: "character",
      text: "Precisely! The owner uses enchanted contracts - deeds that bind souls to locations. Brilliant magic, really, if it weren't so evil.",
    },
    {
      speaker: "character",
      text: "I came seeking rare mechanical components. Found them, along with magical shackles. Now I work on my inventions in secret, hoping to find a weakness.",
    },
    {
      speaker: "hero",
      text: "Have you found one?",
    },
    {
      speaker: "character",
      text: "The master deed! It's hidden behind puzzle locks of his own design. Crack them, and you'll have the power over all of us. Use it wisely.",
    },
  ],
  dwarf: [
    {
      speaker: "narrator",
      text: "The dwarf woman crosses her powerful arms, her gaze measuring your worth.",
    },
    {
      speaker: "character",
      text: "You look sturdy enough. Maybe sturdy enough to hear the truth without running scared.",
    },
    {
      speaker: "hero",
      text: "I don't scare easily. What truth?",
    },
    {
      speaker: "character",
      text: "Good. This place is a prison, dressed up pretty. That snake of an owner holds magical deeds over each of us. Break the contract? Our souls shatter.",
    },
    {
      speaker: "character",
      text: "I was a miner's daughter, strong enough to arm-wrestle an ogre. Now I can't even step outside. My strength means nothing against his magic.",
    },
    {
      speaker: "hero",
      text: "There has to be a way to fight back.",
    },
    {
      speaker: "character",
      text: "The master deed - it's the cornerstone. Find it, and you control everything. You could free us... or become the new master. I hope you're as honorable as you look.",
    },
  ],
  succubus: [
    {
      speaker: "narrator",
      text: "The succubus's eyes gleam with ancient knowledge as she draws close.",
    },
    {
      speaker: "character",
      text: "How delightful... a hero, perhaps? I can sense the conflict in your heart. You're not like the others.",
    },
    {
      speaker: "hero",
      text: "You seem to know a lot. What's really going on here?",
    },
    {
      speaker: "character",
      text: "Clever and perceptive. Yes, I'll share our little secret. We are prisoners, bound by soul-contracts to that insufferable man.",
    },
    {
      speaker: "character",
      text: "I came to study his magic - such delicious irony that I became its victim. But I've learned things... the location of his hidden sanctum, for instance.",
    },
    {
      speaker: "hero",
      text: "Tell me more.",
    },
    {
      speaker: "character",
      text: "The master deed lies behind three puzzle locks in his secret study. Solve them, and ultimate power is yours. Will you free us, I wonder? Or perhaps... take his place?",
    },
  ],
  werewolf: [
    {
      speaker: "narrator",
      text: "The werewolf's golden eyes gleam in the candlelight, a low growl in her throat.",
    },
    {
      speaker: "character",
      text: "I can smell it on you - the scent of purpose. You're not here just for ale and company.",
    },
    {
      speaker: "hero",
      text: "You're right. Something feels wrong about this place.",
    },
    {
      speaker: "character",
      text: "Your instincts serve you well. We are caged here, all of us. The owner holds cursed deeds that bind our very souls to these walls.",
    },
    {
      speaker: "character",
      text: "He caught me during the full moon, when I was weakest. Now I cannot run free, cannot hunt, cannot feel the forest floor beneath my paws.",
    },
    {
      speaker: "hero",
      text: "How can I break these chains?",
    },
    {
      speaker: "character",
      text: "Hunt the master deed in his hidden lair. Puzzles guard it - he thinks himself clever. Claim it, and you hold our fates in your hands.",
    },
  ],
  beastwoman: [
    {
      speaker: "narrator",
      text: "The feline beast woman studies you with unblinking blue eyes, her tail swishing thoughtfully.",
    },
    {
      speaker: "character",
      text: "You've been watching things carefully. Good. It means you might actually survive what I'm about to tell you.",
    },
    {
      speaker: "hero",
      text: "I'm listening.",
    },
    {
      speaker: "character",
      text: "This tavern is a cage gilded with false comfort. Each of us is bound by a soul-deed, magic contracts that make us prisoners in plain sight.",
    },
    {
      speaker: "character",
      text: "I came from lands far from here, seeking adventure. Found captivity instead. But I've watched, and I've learned the owner's secrets.",
    },
    {
      speaker: "hero",
      text: "What secrets?",
    },
    {
      speaker: "character",
      text: "There's a hidden study with puzzle-locked chambers. The master deed is within. Claim it, and you decide our destiny. Freedom... or new ownership. Choose wisely.",
    },
  ],
};

export const puzzleIntroDialogue: DialogueLine[] = [
  {
    speaker: "narrator",
    text: "Armed with knowledge of the hidden deed, you seek out the owner's secret study. Behind a bookshelf, you discover a hidden passage.",
  },
  {
    speaker: "narrator",
    text: "The corridor leads to a chamber filled with strange mechanisms and glowing runes. Three puzzle locks stand between you and the master deed.",
  },
];

export const puzzleSolvedDialogue: DialogueLine[] = [
  {
    speaker: "narrator",
    text: "The final lock clicks open. Before you lies the master deed - a document pulsing with dark energy, containing the soul-contracts of all seven women.",
  },
  {
    speaker: "narrator",
    text: "With this in your possession, you hold absolute power. You could destroy it and free them all... or sign your name and become the new master.",
  },
];

export const liberationEnding: DialogueLine[] = [
  {
    speaker: "narrator",
    text: "With steady hands, you tear the master deed in two. The dark energy dissipates like morning mist, and somewhere in the tavern, you hear gasps of joy.",
  },
  {
    speaker: "narrator",
    text: "One by one, the women emerge, their eyes bright with tears of freedom. The magical chains that bound them have shattered forever.",
  },
  {
    speaker: "character",
    text: "You did it! We're free! After all this time... I can feel the wind again, the trees calling me home!",
  },
  {
    speaker: "narrator",
    text: "The former owner, his power broken, flees into the night. The tavern now belongs to those who were once its prisoners.",
  },
  {
    speaker: "narrator",
    text: "You are hailed as a hero, and the grateful women invite you to stay as an honored guest. But that is a tale for another time...",
  },
];

export const takeoverEnding: DialogueLine[] = [
  {
    speaker: "narrator",
    text: "The quill feels heavy as you sign your name upon the master deed. Dark energy flows into you, and you feel the souls of seven women become... yours.",
  },
  {
    speaker: "narrator",
    text: "The former owner appears, his face a mask of rage and fear. But the deed has spoken - his power transfers to you completely.",
  },
  {
    speaker: "owner",
    text: "No! You cannot! I built this empire, I—",
  },
  {
    speaker: "narrator",
    text: "With a gesture, you banish him from the premises. The tavern is yours now, along with everything - and everyone - within it.",
  },
  {
    speaker: "narrator",
    text: "The women watch you with uncertain eyes. Will you be a kinder master? A crueler one? Only time will tell what sort of owner you become...",
  },
];
