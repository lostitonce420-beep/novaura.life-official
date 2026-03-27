import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FullHeroStats,
  FullCombatStats,
  EquipmentSlots,
  InventoryItem,
  SkillName,
  DEFAULT_HERO_STATS,
  ITEMS,
  CRAFTING_RECIPES,
  COMBAT_ABILITIES,
  getItemById,
  getEquipmentStats,
  getEffectiveCombatStats,
  xpForLevel,
  levelFromXp,
  xpToNextLevel,
  heroLevelUp,
  combatXpForLevel,
  CombatAbility,
} from "@/data/rpgSystems";
import { heroSkills, HeroSkill } from "@/data/steampunkWorld";

export type AffinityLevel = "neutral" | "friendly" | "close" | "intimate";

export interface Character {
  id: string;
  name: string;
  species: string;
  tagline: string;
  portraits: {
    neutral: any;
    friendly: any;
    intimate: any;
  };
  customPortrait?: string;
  backstory: string;
  unlocked: boolean;
}

export interface GameState {
  currentScene: string;
  currentLocation: string;
  selectedCharacter: string | null;
  dialogueIndex: number;
  puzzlesSolved: number;
  choiceMade: "liberate" | "takeover" | null;
  completedQuests: string[];
  currentQuestId: string | null;
  currentQuestStep: number;
  affinityPoints: Record<string, number>;
  unlockedItems: string[];
  cluesFound: string[];
  customPortraits: Record<string, string>;
  gameStarted: boolean;
  hero: FullHeroStats;
  activeBuffs: ActiveBuff[];
  dungeonFloor: number;
  highestFloor: number;
  totalMonstersKilled: number;
  totalGoldEarned: number;
}

export interface ActiveBuff {
  stat: keyof FullCombatStats;
  value: number;
  turnsRemaining: number;
  source: string;
}

interface GameContextType {
  gameState: GameState;
  characters: Character[];
  setCurrentScene: (scene: string) => void;
  setCurrentLocation: (location: string) => void;
  selectCharacter: (characterId: string) => void;
  advanceDialogue: () => void;
  setDialogueIndex: (index: number) => void;
  solvePuzzle: () => void;
  makeChoice: (choice: "liberate" | "takeover") => void;
  completeQuest: (questId: string) => void;
  startQuest: (questId: string) => void;
  advanceQuestStep: () => void;
  addAffinityPoints: (characterId: string, points: number) => void;
  getAffinityLevel: (characterId: string) => AffinityLevel;
  getCharacterPortrait: (characterId: string) => any;
  unlockItem: (itemId: string) => void;
  addClue: (clue: string) => void;
  setCustomPortrait: (characterId: string, uri: string) => void;
  resetGame: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  startNewGame: () => void;
  addItemToInventory: (itemId: string, quantity?: number) => void;
  removeItemFromInventory: (itemId: string, quantity?: number) => boolean;
  hasItem: (itemId: string, quantity?: number) => boolean;
  getItemCount: (itemId: string) => number;
  equipItem: (itemId: string) => boolean;
  unequipItem: (slot: keyof EquipmentSlots) => void;
  buyItem: (itemId: string, price: number, quantity?: number) => boolean;
  sellItem: (itemId: string, quantity?: number) => boolean;
  useItem: (itemId: string) => boolean;
  craftItem: (recipeId: string) => boolean;
  trainSkill: (skill: SkillName, xp: number) => void;
  getSkillLevel: (skill: SkillName) => number;
  addCombatXp: (xp: number) => void;
  addGold: (amount: number) => void;
  takeDamage: (damage: number) => void;
  healHealth: (amount: number) => void;
  restoreMana: (amount: number) => void;
  spendMana: (amount: number) => boolean;
  getEffectiveStats: () => FullCombatStats;
  getAvailableSkills: () => HeroSkill[];
  getAvailableAbilities: () => CombatAbility[];
  setDungeonFloor: (floor: number) => void;
  addMonsterKill: () => void;
  fullRestore: () => void;
}

const defaultGameState: GameState = {
  currentScene: "title",
  currentLocation: "main-hall",
  selectedCharacter: null,
  dialogueIndex: 0,
  puzzlesSolved: 0,
  choiceMade: null,
  completedQuests: [],
  currentQuestId: null,
  currentQuestStep: 0,
  affinityPoints: {},
  unlockedItems: [],
  cluesFound: [],
  customPortraits: {},
  gameStarted: false,
  hero: { ...DEFAULT_HERO_STATS },
  activeBuffs: [],
  dungeonFloor: 1,
  highestFloor: 1,
  totalMonstersKilled: 0,
  totalGoldEarned: 0,
};

const characters: Character[] = [
  {
    id: "nymph",
    name: "Willow",
    species: "Forest Nymph",
    tagline: "A spirit of the ancient woods",
    portraits: {
      neutral: require("../../assets/images/portrait-nymph.png"),
      friendly: require("../../assets/images/portrait-nymph-friendly.png"),
      intimate: require("../../assets/images/portrait-nymph-intimate.png"),
    },
    backstory: "Once a guardian of the Eldergrove, Willow was captured by the owner's dark magic and bound to this place. Her connection to nature has weakened, but her spirit remains unbroken.",
    unlocked: true,
  },
  {
    id: "goblin",
    name: "Pip",
    species: "Goblin",
    tagline: "Small but fierce of heart",
    portraits: {
      neutral: require("../../assets/images/portrait-goblin.png"),
      friendly: require("../../assets/images/portrait-goblin-friendly.png"),
      intimate: require("../../assets/images/portrait-goblin-intimate.png"),
    },
    backstory: "Pip wandered in seeking shelter from a storm, never suspecting the trap. Despite her circumstances, she maintains her playful nature, always barefoot and ready for mischief.",
    unlocked: true,
  },
  {
    id: "gnome",
    name: "Gerta",
    species: "Gnome",
    tagline: "Clever hands and sharper wit",
    portraits: {
      neutral: require("../../assets/images/portrait-gnome.png"),
      friendly: require("../../assets/images/portrait-gnome-friendly.png"),
      intimate: require("../../assets/images/portrait-gnome-intimate.png"),
    },
    backstory: "A talented inventor who came seeking rare components, Gerta now uses her mechanical skills secretly, building what might become their key to freedom.",
    unlocked: true,
  },
  {
    id: "dwarf",
    name: "Brunhilda",
    species: "Dwarf",
    tagline: "Strong as mountain stone",
    portraits: {
      neutral: require("../../assets/images/portrait-dwarf.png"),
      friendly: require("../../assets/images/portrait-dwarf-friendly.png"),
      intimate: require("../../assets/images/portrait-dwarf-intimate.png"),
    },
    backstory: "Daughter of a mining clan, Brunhilda's strength is matched only by her loyalty. She protects the others and dreams of the day she can swing her hammer freely again.",
    unlocked: true,
  },
  {
    id: "succubus",
    name: "Vesper",
    species: "Succubus",
    tagline: "Beauty that hides dark power",
    portraits: {
      neutral: require("../../assets/images/portrait-succubus.png"),
      friendly: require("../../assets/images/portrait-succubus-friendly.png"),
      intimate: require("../../assets/images/portrait-succubus-intimate.png"),
    },
    backstory: "Vesper came to study the owner's magic, but found herself bound by her own curiosity. She knows secrets about the deed's location but fears the consequences of revealing them.",
    unlocked: true,
  },
  {
    id: "werewolf",
    name: "Luna",
    species: "Werewolf",
    tagline: "Wild heart, gentle soul",
    portraits: {
      neutral: require("../../assets/images/portrait-werewolf.png"),
      friendly: require("../../assets/images/portrait-werewolf-friendly.png"),
      intimate: require("../../assets/images/portrait-werewolf-intimate.png"),
    },
    backstory: "Captured during the full moon when she was most vulnerable, Luna struggles to control her transformations without the forest's call. She howls silently for freedom.",
    unlocked: true,
  },
  {
    id: "beastwoman",
    name: "Mittens",
    species: "Beast Woman",
    tagline: "Graceful and mysterious",
    portraits: {
      neutral: require("../../assets/images/portrait-beastwoman.png"),
      friendly: require("../../assets/images/portrait-beastwoman-friendly.png"),
      intimate: require("../../assets/images/portrait-beastwoman-intimate.png"),
    },
    backstory: "A traveler from distant lands, Mittens possesses agility and senses beyond any other. She watches, waits, and plans, knowing that patience brings the best opportunities.",
    unlocked: true,
  },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);

  const setCurrentScene = (scene: string) => {
    setGameState((prev) => ({ ...prev, currentScene: scene }));
  };

  const setCurrentLocation = (location: string) => {
    setGameState((prev) => ({ ...prev, currentLocation: location }));
  };

  const selectCharacter = (characterId: string) => {
    setGameState((prev) => ({
      ...prev,
      selectedCharacter: characterId,
      dialogueIndex: 0,
    }));
  };

  const advanceDialogue = () => {
    setGameState((prev) => ({
      ...prev,
      dialogueIndex: prev.dialogueIndex + 1,
    }));
  };

  const setDialogueIndex = (index: number) => {
    setGameState((prev) => ({ ...prev, dialogueIndex: index }));
  };

  const solvePuzzle = () => {
    setGameState((prev) => ({
      ...prev,
      puzzlesSolved: prev.puzzlesSolved + 1,
    }));
  };

  const makeChoice = (choice: "liberate" | "takeover") => {
    setGameState((prev) => ({ ...prev, choiceMade: choice }));
  };

  const completeQuest = (questId: string) => {
    setGameState((prev) => ({
      ...prev,
      completedQuests: [...prev.completedQuests, questId],
      currentQuestId: null,
      currentQuestStep: 0,
    }));
  };

  const startQuest = (questId: string) => {
    setGameState((prev) => ({
      ...prev,
      currentQuestId: questId,
      currentQuestStep: 0,
      dialogueIndex: 0,
    }));
  };

  const advanceQuestStep = () => {
    setGameState((prev) => ({
      ...prev,
      currentQuestStep: prev.currentQuestStep + 1,
    }));
  };

  const addAffinityPoints = (characterId: string, points: number) => {
    setGameState((prev) => ({
      ...prev,
      affinityPoints: {
        ...prev.affinityPoints,
        [characterId]: (prev.affinityPoints[characterId] || 0) + points,
      },
    }));
  };

  const getAffinityLevel = (characterId: string): AffinityLevel => {
    const points = gameState.affinityPoints[characterId] || 0;
    if (points >= 50) return "intimate";
    if (points >= 25) return "close";
    if (points >= 10) return "friendly";
    return "neutral";
  };

  const getCharacterPortrait = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return null;

    if (gameState.customPortraits[characterId]) {
      return { uri: gameState.customPortraits[characterId] };
    }

    const level = getAffinityLevel(characterId);
    switch (level) {
      case "intimate":
      case "close":
        return character.portraits.intimate;
      case "friendly":
        return character.portraits.friendly;
      default:
        return character.portraits.neutral;
    }
  };

  const unlockItem = (itemId: string) => {
    setGameState((prev) => ({
      ...prev,
      unlockedItems: [...prev.unlockedItems, itemId],
    }));
  };

  const addClue = (clue: string) => {
    setGameState((prev) => ({
      ...prev,
      cluesFound: [...prev.cluesFound, clue],
    }));
  };

  const setCustomPortrait = (characterId: string, uri: string) => {
    setGameState((prev) => ({
      ...prev,
      customPortraits: { ...prev.customPortraits, [characterId]: uri },
    }));
  };

  const resetGame = () => {
    setGameState({ ...defaultGameState, customPortraits: gameState.customPortraits });
  };

  const startNewGame = () => {
    setGameState((prev) => ({
      ...defaultGameState,
      customPortraits: prev.customPortraits,
      gameStarted: true,
      currentQuestId: "mq1",
    }));
  };

  const saveGame = async () => {
    try {
      await AsyncStorage.setItem("gameState", JSON.stringify(gameState));
    } catch (error) {
      console.error("Failed to save game:", error);
    }
  };

  const loadGame = async (): Promise<boolean> => {
    try {
      const saved = await AsyncStorage.getItem("gameState");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gameStarted) {
          const merged = { ...defaultGameState, ...parsed };
          const defaultHero = { ...DEFAULT_HERO_STATS };
          if (!merged.hero) {
            merged.hero = defaultHero;
          } else {
            if (!merged.hero.combatStats) {
              merged.hero.combatStats = { ...defaultHero.combatStats };
            } else {
              merged.hero.combatStats = { ...defaultHero.combatStats, ...merged.hero.combatStats };
            }
            if (!Array.isArray(merged.hero.inventory)) {
              merged.hero.inventory = [...defaultHero.inventory];
            }
            if (!merged.hero.equipment || typeof merged.hero.equipment !== 'object') {
              merged.hero.equipment = { ...defaultHero.equipment };
            } else {
              merged.hero.equipment = { ...defaultHero.equipment, ...merged.hero.equipment };
            }
            if (!merged.hero.skills || typeof merged.hero.skills !== 'object') {
              merged.hero.skills = { ...defaultHero.skills };
            }
            if (!Array.isArray(merged.hero.combatAbilities)) {
              merged.hero.combatAbilities = [...defaultHero.combatAbilities];
            }
            if (typeof merged.hero.gold !== 'number') {
              merged.hero.gold = defaultHero.gold;
            }
          }
          setGameState(merged);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to load game:", error);
      return false;
    }
  };

  const addItemToInventory = (itemId: string, quantity: number = 1) => {
    setGameState((prev) => {
      const inv = [...prev.hero.inventory];
      const existing = inv.find(i => i.itemId === itemId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        inv.push({ itemId, quantity });
      }
      return { ...prev, hero: { ...prev.hero, inventory: inv } };
    });
  };

  const removeItemFromInventory = (itemId: string, quantity: number = 1): boolean => {
    const item = gameState.hero.inventory.find(i => i.itemId === itemId);
    if (!item || item.quantity < quantity) return false;
    setGameState((prev) => {
      const inv = prev.hero.inventory
        .map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - quantity } : i)
        .filter(i => i.quantity > 0);
      return { ...prev, hero: { ...prev.hero, inventory: inv } };
    });
    return true;
  };

  const hasItem = (itemId: string, quantity: number = 1): boolean => {
    const item = gameState.hero.inventory.find(i => i.itemId === itemId);
    return !!item && item.quantity >= quantity;
  };

  const getItemCount = (itemId: string): number => {
    return gameState.hero.inventory.find(i => i.itemId === itemId)?.quantity || 0;
  };

  const equipItem = (itemId: string): boolean => {
    const itemDef = getItemById(itemId);
    if (!itemDef || !itemDef.equipSlot) return false;
    if (!hasItem(itemId)) return false;

    setGameState((prev) => {
      const slot = itemDef.equipSlot as keyof EquipmentSlots;
      const currentEquipped = prev.hero.equipment[slot];
      let inv = prev.hero.inventory
        .map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0);

      if (currentEquipped) {
        const existingInInv = inv.find(i => i.itemId === currentEquipped);
        if (existingInInv) {
          existingInInv.quantity += 1;
        } else {
          inv.push({ itemId: currentEquipped, quantity: 1 });
        }
      }

      return {
        ...prev,
        hero: {
          ...prev.hero,
          inventory: inv,
          equipment: { ...prev.hero.equipment, [slot]: itemId },
        },
      };
    });
    return true;
  };

  const unequipItem = (slot: keyof EquipmentSlots) => {
    setGameState((prev) => {
      const currentEquipped = prev.hero.equipment[slot];
      if (!currentEquipped) return prev;

      const inv = [...prev.hero.inventory];
      const existing = inv.find(i => i.itemId === currentEquipped);
      if (existing) {
        existing.quantity += 1;
      } else {
        inv.push({ itemId: currentEquipped, quantity: 1 });
      }

      return {
        ...prev,
        hero: {
          ...prev.hero,
          inventory: inv,
          equipment: { ...prev.hero.equipment, [slot]: null },
        },
      };
    });
  };

  const buyItem = (itemId: string, price: number, quantity: number = 1): boolean => {
    const totalCost = price * quantity;
    if (gameState.hero.gold < totalCost) return false;

    setGameState((prev) => {
      const inv = [...prev.hero.inventory];
      const existing = inv.find(i => i.itemId === itemId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        inv.push({ itemId, quantity });
      }
      return {
        ...prev,
        hero: {
          ...prev.hero,
          gold: prev.hero.gold - totalCost,
          inventory: inv,
        },
      };
    });
    return true;
  };

  const sellItem = (itemId: string, quantity: number = 1): boolean => {
    const item = gameState.hero.inventory.find(i => i.itemId === itemId);
    if (!item || item.quantity < quantity) return false;
    const itemDef = getItemById(itemId);
    if (!itemDef) return false;

    const totalValue = itemDef.sellPrice * quantity;
    setGameState((prev) => {
      const inv = prev.hero.inventory
        .map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - quantity } : i)
        .filter(i => i.quantity > 0);
      return {
        ...prev,
        hero: {
          ...prev.hero,
          gold: prev.hero.gold + totalValue,
          inventory: inv,
        },
      };
    });
    return true;
  };

  const useItem = (itemId: string): boolean => {
    if (!hasItem(itemId)) return false;
    const itemDef = getItemById(itemId);
    if (!itemDef || !itemDef.effect) return false;

    setGameState((prev) => {
      const inv = prev.hero.inventory
        .map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0);

      let stats = { ...prev.hero.combatStats };
      let buffs = [...prev.activeBuffs];

      if (itemDef.effect!.type === "heal") {
        stats.currentHealth = Math.min(stats.maxHealth, stats.currentHealth + itemDef.effect!.value);
      } else if (itemDef.effect!.type === "manaRestore") {
        stats.currentMana = Math.min(stats.maxMana, stats.currentMana + itemDef.effect!.value);
      } else if (itemDef.effect!.type === "buff" && itemDef.effect!.stat) {
        buffs.push({
          stat: itemDef.effect!.stat,
          value: itemDef.effect!.value,
          turnsRemaining: itemDef.effect!.duration || 10,
          source: itemId,
        });
      }

      return {
        ...prev,
        hero: { ...prev.hero, inventory: inv, combatStats: stats },
        activeBuffs: buffs,
      };
    });
    return true;
  };

  const craftItem = (recipeId: string): boolean => {
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;

    const skillXp = gameState.hero.skills[recipe.skill] || 0;
    const skillLvl = levelFromXp(skillXp);
    if (skillLvl < recipe.levelRequired) return false;

    for (const ingredient of recipe.ingredients) {
      if (!hasItem(ingredient.itemId, ingredient.quantity)) return false;
    }

    setGameState((prev) => {
      let inv = [...prev.hero.inventory];
      for (const ingredient of recipe.ingredients) {
        inv = inv
          .map(i => i.itemId === ingredient.itemId ? { ...i, quantity: i.quantity - ingredient.quantity } : i)
          .filter(i => i.quantity > 0);
      }

      const existing = inv.find(i => i.itemId === recipe.resultItemId);
      if (existing) {
        existing.quantity += recipe.resultQuantity;
      } else {
        inv.push({ itemId: recipe.resultItemId, quantity: recipe.resultQuantity });
      }

      const updatedSkills = { ...prev.hero.skills };
      updatedSkills[recipe.skill] = (updatedSkills[recipe.skill] || 0) + recipe.xpGained;

      return {
        ...prev,
        hero: { ...prev.hero, inventory: inv, skills: updatedSkills },
      };
    });
    return true;
  };

  const trainSkill = (skill: SkillName, xp: number) => {
    setGameState((prev) => {
      const updatedSkills = { ...prev.hero.skills };
      updatedSkills[skill] = (updatedSkills[skill] || 0) + xp;
      return { ...prev, hero: { ...prev.hero, skills: updatedSkills } };
    });
  };

  const getSkillLevel = (skill: SkillName): number => {
    return levelFromXp(gameState.hero.skills[skill] || 0);
  };

  const addCombatXp = (xp: number) => {
    setGameState((prev) => {
      const newExp = prev.hero.experience + xp;
      const oldLevel = prev.hero.level;
      const newLevel = Math.max(oldLevel, levelFromXp(newExp));

      let stats = { ...prev.hero.combatStats };
      if (newLevel > oldLevel) {
        for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
          const gains = heroLevelUp(stats, lvl);
          stats = { ...stats, ...gains };
        }
        stats.currentHealth = stats.maxHealth;
        stats.currentMana = stats.maxMana;
      }

      const updatedSkills = { ...prev.hero.skills };
      updatedSkills.combat = (updatedSkills.combat || 0) + Math.floor(xp * 0.3);

      return {
        ...prev,
        hero: {
          ...prev.hero,
          experience: newExp,
          level: newLevel,
          combatStats: stats,
          skills: updatedSkills,
        },
      };
    });
  };

  const addGold = (amount: number) => {
    setGameState((prev) => ({
      ...prev,
      hero: { ...prev.hero, gold: prev.hero.gold + amount },
      totalGoldEarned: prev.totalGoldEarned + Math.max(0, amount),
    }));
  };

  const takeDamage = (damage: number) => {
    setGameState((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        combatStats: {
          ...prev.hero.combatStats,
          currentHealth: Math.max(0, prev.hero.combatStats.currentHealth - damage),
        },
      },
    }));
  };

  const healHealth = (amount: number) => {
    setGameState((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        combatStats: {
          ...prev.hero.combatStats,
          currentHealth: Math.min(prev.hero.combatStats.maxHealth, prev.hero.combatStats.currentHealth + amount),
        },
      },
    }));
  };

  const restoreMana = (amount: number) => {
    setGameState((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        combatStats: {
          ...prev.hero.combatStats,
          currentMana: Math.min(prev.hero.combatStats.maxMana, prev.hero.combatStats.currentMana + amount),
        },
      },
    }));
  };

  const spendMana = (amount: number): boolean => {
    if (gameState.hero.combatStats.currentMana < amount) return false;
    setGameState((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        combatStats: {
          ...prev.hero.combatStats,
          currentMana: prev.hero.combatStats.currentMana - amount,
        },
      },
    }));
    return true;
  };

  const getEffectiveStats = (): FullCombatStats => {
    return getEffectiveCombatStats(gameState.hero);
  };

  const getAvailableSkills = (): HeroSkill[] => {
    return heroSkills.filter(s => s.unlockLevel <= gameState.hero.level);
  };

  const getAvailableAbilities = (): CombatAbility[] => {
    return COMBAT_ABILITIES.filter(a => {
      if (a.unlockLevel > gameState.hero.level) return false;
      if (a.skillRequired) {
        const lvl = getSkillLevel(a.skillRequired.skill);
        if (lvl < a.skillRequired.level) return false;
      }
      return true;
    });
  };

  const setDungeonFloor = (floor: number) => {
    setGameState((prev) => ({
      ...prev,
      dungeonFloor: floor,
      highestFloor: Math.max(prev.highestFloor, floor),
    }));
  };

  const addMonsterKill = () => {
    setGameState((prev) => ({
      ...prev,
      totalMonstersKilled: prev.totalMonstersKilled + 1,
    }));
  };

  const fullRestore = () => {
    setGameState((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        combatStats: {
          ...prev.hero.combatStats,
          currentHealth: prev.hero.combatStats.maxHealth,
          currentMana: prev.hero.combatStats.maxMana,
        },
      },
      activeBuffs: [],
    }));
  };

  useEffect(() => {
    if (gameState.gameStarted) {
      saveGame();
    }
  }, [gameState]);

  const charactersWithCustomPortraits = characters.map((char) => ({
    ...char,
    customPortrait: gameState.customPortraits[char.id],
  }));

  return (
    <GameContext.Provider
      value={{
        gameState,
        characters: charactersWithCustomPortraits,
        setCurrentScene,
        setCurrentLocation,
        selectCharacter,
        advanceDialogue,
        setDialogueIndex,
        solvePuzzle,
        makeChoice,
        completeQuest,
        startQuest,
        advanceQuestStep,
        addAffinityPoints,
        getAffinityLevel,
        getCharacterPortrait,
        unlockItem,
        addClue,
        setCustomPortrait,
        resetGame,
        saveGame,
        loadGame,
        startNewGame,
        addItemToInventory,
        removeItemFromInventory,
        hasItem,
        getItemCount,
        equipItem,
        unequipItem,
        buyItem,
        sellItem,
        useItem,
        craftItem,
        trainSkill,
        getSkillLevel,
        addCombatXp,
        addGold,
        takeDamage,
        healHealth,
        restoreMana,
        spendMana,
        getEffectiveStats,
        getAvailableSkills,
        getAvailableAbilities,
        setDungeonFloor,
        addMonsterKill,
        fullRestore,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
