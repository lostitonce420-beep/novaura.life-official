export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9E9E9E",
  uncommon: "#4CAF50",
  rare: "#2196F3",
  epic: "#9C27B0",
  legendary: "#FF9800",
};

export const RARITY_DROP_MULTIPLIER: Record<Rarity, number> = {
  common: 1,
  uncommon: 0.4,
  rare: 0.15,
  epic: 0.05,
  legendary: 0.01,
};

export type SkillName =
  | "mining"
  | "smithing"
  | "fishing"
  | "cooking"
  | "woodcutting"
  | "crafting"
  | "alchemy"
  | "combat"
  | "magic"
  | "thieving"
  | "agility"
  | "herbalism";

export interface SkillDefinition {
  id: SkillName;
  name: string;
  description: string;
  icon: string;
  maxLevel: 99;
  feedsInto: SkillName[];
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(i + 150 * Math.pow(2, i / 7.0));
  }
  return Math.floor(total / 4);
}

export function levelFromXp(xp: number): number {
  for (let lvl = 99; lvl >= 1; lvl--) {
    if (xp >= xpForLevel(lvl)) return lvl;
  }
  return 1;
}

export function xpToNextLevel(currentXp: number): { current: number; needed: number; progress: number } {
  const lvl = levelFromXp(currentXp);
  if (lvl >= 99) return { current: currentXp, needed: 0, progress: 1 };
  const thisLvl = xpForLevel(lvl);
  const nextLvl = xpForLevel(lvl + 1);
  return {
    current: currentXp - thisLvl,
    needed: nextLvl - thisLvl,
    progress: (currentXp - thisLvl) / (nextLvl - thisLvl),
  };
}

export const SKILLS: SkillDefinition[] = [
  { id: "mining", name: "Mining", description: "Extract ores and gems from rock nodes", icon: "box", maxLevel: 99, feedsInto: ["smithing", "crafting"] },
  { id: "smithing", name: "Smithing", description: "Forge weapons and armor from raw metals", icon: "tool", maxLevel: 99, feedsInto: ["combat"] },
  { id: "fishing", name: "Fishing", description: "Catch fish from streams and underground pools", icon: "anchor", maxLevel: 99, feedsInto: ["cooking"] },
  { id: "cooking", name: "Cooking", description: "Prepare food that restores health and buffs stats", icon: "coffee", maxLevel: 99, feedsInto: ["alchemy"] },
  { id: "woodcutting", name: "Woodcutting", description: "Harvest timber from mechanical trees and ancient groves", icon: "scissors", maxLevel: 99, feedsInto: ["crafting"] },
  { id: "crafting", name: "Crafting", description: "Create accessories, tools, and consumables", icon: "settings", maxLevel: 99, feedsInto: ["alchemy"] },
  { id: "alchemy", name: "Alchemy", description: "Brew potions, elixirs, and enchantments", icon: "droplet", maxLevel: 99, feedsInto: ["magic", "herbalism"] },
  { id: "combat", name: "Combat", description: "Melee fighting proficiency and weapon mastery", icon: "crosshair", maxLevel: 99, feedsInto: [] },
  { id: "magic", name: "Magic", description: "Arcane spell casting and magical defense", icon: "zap", maxLevel: 99, feedsInto: [] },
  { id: "thieving", name: "Thieving", description: "Pick locks, pickpocket NPCs, and disarm traps", icon: "unlock", maxLevel: 99, feedsInto: ["agility"] },
  { id: "agility", name: "Agility", description: "Movement speed, dodge chance, and obstacle traversal", icon: "wind", maxLevel: 99, feedsInto: ["thieving", "combat"] },
  { id: "herbalism", name: "Herbalism", description: "Gather herbs and plants for potions and cooking", icon: "feather", maxLevel: 99, feedsInto: ["alchemy", "cooking"] },
];

export interface FullCombatStats {
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
}

export interface FullHeroStats {
  name: string;
  level: number;
  experience: number;
  combatStats: FullCombatStats;
  gold: number;
  skills: Record<SkillName, number>;
  inventory: InventoryItem[];
  equipment: EquipmentSlots;
  combatAbilities: CombatAbility[];
}

export interface EquipmentSlots {
  weapon: string | null;
  offhand: string | null;
  helmet: string | null;
  body: string | null;
  legs: string | null;
  boots: string | null;
  gloves: string | null;
  cape: string | null;
  amulet: string | null;
  ring: string | null;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export type ItemCategory = "weapon" | "armor" | "consumable" | "material" | "accessory" | "key" | "ammo" | "tool";
export type WeaponType = "sword" | "axe" | "mace" | "dagger" | "staff" | "bow" | "spear" | "fist";
export type ArmorSlot = "helmet" | "body" | "legs" | "boots" | "gloves" | "cape" | "offhand";

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: Rarity;
  stackable: boolean;
  sellPrice: number;
  buyPrice: number;
  levelRequired: number;
  skillRequired?: { skill: SkillName; level: number };
  stats?: Partial<FullCombatStats>;
  weaponType?: WeaponType;
  armorSlot?: ArmorSlot;
  equipSlot?: keyof EquipmentSlots;
  effect?: ItemEffect;
}

export interface ItemEffect {
  type: "heal" | "manaRestore" | "buff" | "cure" | "teleport" | "damage";
  value: number;
  duration?: number;
  stat?: keyof FullCombatStats;
}

export interface CombatAbility {
  id: string;
  name: string;
  description: string;
  type: "physical" | "magic" | "support";
  damage: number;
  manaCost: number;
  cooldown: number;
  unlockLevel: number;
  skillRequired?: { skill: SkillName; level: number };
  effect?: "poison" | "stun" | "burn" | "weaken" | "heal" | "shield" | "lifesteal" | "drain";
  effectChance?: number;
  scaling: { stat: keyof FullCombatStats; multiplier: number };
}

export interface CraftingRecipe {
  id: string;
  name: string;
  resultItemId: string;
  resultQuantity: number;
  skill: SkillName;
  levelRequired: number;
  xpGained: number;
  ingredients: { itemId: string; quantity: number }[];
}

export interface ResourceNode {
  id: string;
  name: string;
  skill: SkillName;
  levelRequired: number;
  xpPerGather: number;
  gatherTimeMs: number;
  drops: { itemId: string; chance: number; minQty: number; maxQty: number }[];
  locations: string[];
}

export interface MonsterDefinition {
  id: string;
  name: string;
  description: string;
  baseLevel: number;
  baseStats: FullCombatStats;
  abilities: CombatAbility[];
  dropTable: MonsterDrop[];
  isBoss: boolean;
  combatXp: number;
  goldRange: [number, number];
  sprite: string;
}

export interface MonsterDrop {
  itemId: string;
  baseChance: number;
  rarity: Rarity;
  minQty: number;
  maxQty: number;
}

export function scaleMonsterStats(base: FullCombatStats, monsterLevel: number, floorLevel: number): FullCombatStats {
  const scale = 1 + (floorLevel - 1) * 0.12;
  return {
    ...base,
    maxHealth: Math.floor(base.maxHealth * scale),
    currentHealth: Math.floor(base.maxHealth * scale),
    attack: Math.floor(base.attack * scale),
    defense: Math.floor(base.defense * scale),
    specialAttack: Math.floor(base.specialAttack * scale),
    specialDefense: Math.floor(base.specialDefense * scale),
    accuracy: Math.min(100, Math.floor(base.accuracy + floorLevel * 0.5)),
    speed: Math.floor(base.speed * (1 + floorLevel * 0.02)),
    magicPower: Math.floor(base.magicPower * scale),
    magicDefense: Math.floor(base.magicDefense * scale),
    dexterity: base.dexterity,
    strength: Math.floor(base.strength * scale),
    luck: base.luck,
    dodge: Math.min(50, base.dodge + floorLevel * 0.3),
    critChance: Math.min(40, base.critChance + floorLevel * 0.2),
    maxMana: base.maxMana,
    currentMana: base.maxMana,
  };
}

export function calculatePhysicalDamage(
  attacker: FullCombatStats,
  defender: FullCombatStats,
  baseDamage: number,
  abilityScaling?: { stat: keyof FullCombatStats; multiplier: number }
): { damage: number; isCrit: boolean; isDodged: boolean } {
  const hitChance = (attacker.accuracy + attacker.dexterity * 0.5) / (attacker.accuracy + attacker.dexterity * 0.5 + defender.dodge * 0.8);
  if (Math.random() > hitChance) return { damage: 0, isCrit: false, isDodged: true };

  let atkPower = attacker.attack + attacker.strength * 0.4;
  if (abilityScaling) {
    atkPower += (attacker[abilityScaling.stat] as number) * abilityScaling.multiplier;
  }
  const defPower = defender.defense + defender.dexterity * 0.2;
  const variance = 0.85 + Math.random() * 0.3;
  let dmg = baseDamage * (atkPower / (atkPower + defPower)) * variance;

  const critRoll = Math.random() * 100;
  const effectiveCrit = attacker.critChance + attacker.luck * 0.3;
  const isCrit = critRoll < effectiveCrit;
  if (isCrit) dmg *= 1.5 + attacker.luck * 0.01;

  return { damage: Math.max(1, Math.floor(dmg)), isCrit, isDodged: false };
}

export function calculateMagicDamage(
  attacker: FullCombatStats,
  defender: FullCombatStats,
  baseDamage: number
): { damage: number; isCrit: boolean; isDodged: boolean } {
  const hitChance = (attacker.accuracy + attacker.magicPower * 0.3) / (attacker.accuracy + attacker.magicPower * 0.3 + defender.magicDefense * 0.5);
  if (Math.random() > hitChance) return { damage: 0, isCrit: false, isDodged: true };

  const magAtk = attacker.magicPower + attacker.specialAttack * 0.5;
  const magDef = defender.magicDefense + defender.specialDefense * 0.4;
  const variance = 0.85 + Math.random() * 0.3;
  let dmg = baseDamage * (magAtk / (magAtk + magDef)) * variance;

  const effectiveCrit = attacker.critChance + attacker.luck * 0.2;
  const isCrit = Math.random() * 100 < effectiveCrit;
  if (isCrit) dmg *= 1.4;

  return { damage: Math.max(1, Math.floor(dmg)), isCrit, isDodged: false };
}

export function heroLevelUp(stats: FullCombatStats, newLevel: number): Partial<FullCombatStats> {
  return {
    maxHealth: stats.maxHealth + 5 + Math.floor(newLevel * 0.8),
    maxMana: stats.maxMana + 3 + Math.floor(newLevel * 0.5),
    attack: stats.attack + 1 + (newLevel % 3 === 0 ? 1 : 0),
    defense: stats.defense + 1 + (newLevel % 4 === 0 ? 1 : 0),
    specialAttack: stats.specialAttack + 1 + (newLevel % 3 === 0 ? 1 : 0),
    specialDefense: stats.specialDefense + 1 + (newLevel % 4 === 0 ? 1 : 0),
    accuracy: Math.min(100, stats.accuracy + 0.5),
    strength: stats.strength + 1,
    speed: stats.speed + (newLevel % 2 === 0 ? 1 : 0),
    magicPower: stats.magicPower + 1 + (newLevel % 3 === 0 ? 1 : 0),
    magicDefense: stats.magicDefense + 1 + (newLevel % 4 === 0 ? 1 : 0),
  };
}

export function combatXpForLevel(level: number): number {
  return Math.floor(level * level * 10 + level * 50);
}

export const DEFAULT_HERO_STATS: FullHeroStats = {
  name: "Hero",
  level: 1,
  experience: 0,
  gold: 100,
  combatStats: {
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
  },
  skills: {
    mining: 0,
    smithing: 0,
    fishing: 0,
    cooking: 0,
    woodcutting: 0,
    crafting: 0,
    alchemy: 0,
    combat: 0,
    magic: 0,
    thieving: 0,
    agility: 0,
    herbalism: 0,
  },
  inventory: [
    { itemId: "health-potion", quantity: 5 },
    { itemId: "mana-potion", quantity: 3 },
    { itemId: "bread", quantity: 10 },
  ],
  equipment: {
    weapon: "bronze-sword",
    offhand: null,
    helmet: null,
    body: "leather-armor",
    legs: null,
    boots: null,
    gloves: null,
    cape: null,
    amulet: null,
    ring: null,
  },
  combatAbilities: [],
};

export const ITEMS: ItemDefinition[] = [
  { id: "health-potion", name: "Steam Elixir", description: "Restores 50 health", category: "consumable", rarity: "common", stackable: true, sellPrice: 10, buyPrice: 25, levelRequired: 1, effect: { type: "heal", value: 50 } },
  { id: "health-potion-greater", name: "Greater Steam Elixir", description: "Restores 150 health", category: "consumable", rarity: "uncommon", stackable: true, sellPrice: 40, buyPrice: 100, levelRequired: 10, effect: { type: "heal", value: 150 } },
  { id: "health-potion-super", name: "Supreme Steam Elixir", description: "Restores 400 health", category: "consumable", rarity: "rare", stackable: true, sellPrice: 150, buyPrice: 400, levelRequired: 30, effect: { type: "heal", value: 400 } },
  { id: "mana-potion", name: "Aether Vial", description: "Restores 30 mana", category: "consumable", rarity: "common", stackable: true, sellPrice: 8, buyPrice: 20, levelRequired: 1, effect: { type: "manaRestore", value: 30 } },
  { id: "mana-potion-greater", name: "Greater Aether Vial", description: "Restores 80 mana", category: "consumable", rarity: "uncommon", stackable: true, sellPrice: 30, buyPrice: 75, levelRequired: 10, effect: { type: "manaRestore", value: 80 } },
  { id: "antidote", name: "Gear Grease", description: "Cures poison", category: "consumable", rarity: "common", stackable: true, sellPrice: 6, buyPrice: 15, levelRequired: 1, effect: { type: "cure", value: 0 } },
  { id: "escape-spring", name: "Escape Spring", description: "Teleports you out of the dungeon", category: "consumable", rarity: "uncommon", stackable: true, sellPrice: 40, buyPrice: 100, levelRequired: 1, effect: { type: "teleport", value: 0 } },
  { id: "bread", name: "Steambread", description: "Simple food that restores 20 health", category: "consumable", rarity: "common", stackable: true, sellPrice: 2, buyPrice: 5, levelRequired: 1, effect: { type: "heal", value: 20 } },
  { id: "cooked-fish", name: "Grilled Steamfish", description: "Restores 40 health", category: "consumable", rarity: "common", stackable: true, sellPrice: 8, buyPrice: 18, levelRequired: 1, effect: { type: "heal", value: 40 } },
  { id: "cooked-salmon", name: "Seared Cogstream Salmon", description: "Restores 80 health", category: "consumable", rarity: "uncommon", stackable: true, sellPrice: 18, buyPrice: 40, levelRequired: 10, effect: { type: "heal", value: 80 } },
  { id: "cooked-lobster", name: "Roasted Iron Lobster", description: "Restores 120 health", category: "consumable", rarity: "uncommon", stackable: true, sellPrice: 30, buyPrice: 70, levelRequired: 20, effect: { type: "heal", value: 120 } },
  { id: "str-potion", name: "Might Tonic", description: "Boosts attack by 5 for combat", category: "consumable", rarity: "uncommon", stackable: true, sellPrice: 20, buyPrice: 50, levelRequired: 5, effect: { type: "buff", value: 5, stat: "attack", duration: 30 } },
  { id: "def-potion", name: "Iron Skin Brew", description: "Boosts defense by 5 for combat", category: "consumable", rarity: "uncommon", stackable: true, sellPrice: 20, buyPrice: 50, levelRequired: 5, effect: { type: "buff", value: 5, stat: "defense", duration: 30 } },
  { id: "magic-potion", name: "Arcane Draught", description: "Boosts magic power by 5 for combat", category: "consumable", rarity: "uncommon", stackable: true, sellPrice: 25, buyPrice: 60, levelRequired: 10, effect: { type: "buff", value: 5, stat: "magicPower", duration: 30 } },

  { id: "bronze-sword", name: "Bronze Gear-Blade", description: "A reliable sword with gear-toothed edge", category: "weapon", rarity: "common", stackable: false, sellPrice: 60, buyPrice: 150, levelRequired: 1, weaponType: "sword", equipSlot: "weapon", stats: { attack: 8, accuracy: 5 } },
  { id: "bronze-axe", name: "Bronze Steam-Axe", description: "Heavy bronze axe powered by steam pistons", category: "weapon", rarity: "common", stackable: false, sellPrice: 65, buyPrice: 160, levelRequired: 1, weaponType: "axe", equipSlot: "weapon", stats: { attack: 10, accuracy: 3, speed: -1 } },
  { id: "bronze-dagger", name: "Bronze Flick-Blade", description: "Fast striking dagger with spring mechanism", category: "weapon", rarity: "common", stackable: false, sellPrice: 50, buyPrice: 120, levelRequired: 1, weaponType: "dagger", equipSlot: "weapon", stats: { attack: 5, accuracy: 8, speed: 3, critChance: 3 } },
  { id: "iron-sword", name: "Iron Piston-Blade", description: "Sturdy iron sword with steam-powered striking", category: "weapon", rarity: "uncommon", stackable: false, sellPrice: 150, buyPrice: 350, levelRequired: 10, weaponType: "sword", equipSlot: "weapon", stats: { attack: 15, accuracy: 8, strength: 2 } },
  { id: "iron-axe", name: "Iron Cleaver", description: "Massive iron axe that cleaves through armor", category: "weapon", rarity: "uncommon", stackable: false, sellPrice: 160, buyPrice: 380, levelRequired: 10, weaponType: "axe", equipSlot: "weapon", stats: { attack: 18, accuracy: 5, speed: -2, strength: 3 } },
  { id: "iron-dagger", name: "Iron Stiletto", description: "Precise iron dagger for weak points", category: "weapon", rarity: "uncommon", stackable: false, sellPrice: 130, buyPrice: 300, levelRequired: 10, weaponType: "dagger", equipSlot: "weapon", stats: { attack: 10, accuracy: 12, speed: 4, critChance: 6 } },
  { id: "steel-sword", name: "Steel Piston-Blade", description: "A powerful sword with steam-powered mechanism", category: "weapon", rarity: "rare", stackable: false, sellPrice: 350, buyPrice: 800, levelRequired: 20, weaponType: "sword", equipSlot: "weapon", stats: { attack: 25, accuracy: 12, strength: 4, speed: 2 } },
  { id: "steel-axe", name: "Steel War-Cleaver", description: "Devastating two-handed steam axe", category: "weapon", rarity: "rare", stackable: false, sellPrice: 380, buyPrice: 850, levelRequired: 20, weaponType: "axe", equipSlot: "weapon", stats: { attack: 30, accuracy: 8, strength: 6, speed: -3 } },
  { id: "mithril-sword", name: "Mithril Chronoblade", description: "Time-infused blade that strikes twice", category: "weapon", rarity: "epic", stackable: false, sellPrice: 800, buyPrice: 2000, levelRequired: 35, weaponType: "sword", equipSlot: "weapon", stats: { attack: 40, accuracy: 18, strength: 6, speed: 5, critChance: 5 } },
  { id: "adamant-sword", name: "Adamant Resonance Blade", description: "Vibrating blade that shatters defenses", category: "weapon", rarity: "epic", stackable: false, sellPrice: 1500, buyPrice: 4000, levelRequired: 50, weaponType: "sword", equipSlot: "weapon", stats: { attack: 55, accuracy: 20, strength: 10, speed: 3, critChance: 8 } },
  { id: "dragon-sword", name: "Dragonfire Gear-Blade", description: "Legendary blade forged in dragon-flame furnaces", category: "weapon", rarity: "legendary", stackable: false, sellPrice: 5000, buyPrice: 0, levelRequired: 70, weaponType: "sword", equipSlot: "weapon", stats: { attack: 80, accuracy: 25, strength: 15, speed: 5, critChance: 12 } },
  { id: "oak-staff", name: "Oak Steam-Staff", description: "Basic staff channeling steam into magic", category: "weapon", rarity: "common", stackable: false, sellPrice: 55, buyPrice: 140, levelRequired: 1, weaponType: "staff", equipSlot: "weapon", stats: { magicPower: 8, accuracy: 5, specialAttack: 3 } },
  { id: "willow-staff", name: "Willow Aether Staff", description: "Flexible staff that amplifies arcane energy", category: "weapon", rarity: "uncommon", stackable: false, sellPrice: 140, buyPrice: 340, levelRequired: 10, weaponType: "staff", equipSlot: "weapon", stats: { magicPower: 15, accuracy: 8, specialAttack: 6, maxMana: 10 } },
  { id: "mystic-staff", name: "Mystic Cogweave Staff", description: "Intricately geared staff of great power", category: "weapon", rarity: "rare", stackable: false, sellPrice: 350, buyPrice: 800, levelRequired: 25, weaponType: "staff", equipSlot: "weapon", stats: { magicPower: 28, accuracy: 12, specialAttack: 10, maxMana: 25 } },
  { id: "arcane-staff", name: "Arcane Engine Staff", description: "Reality-bending staff of immense power", category: "weapon", rarity: "epic", stackable: false, sellPrice: 1200, buyPrice: 3000, levelRequired: 45, weaponType: "staff", equipSlot: "weapon", stats: { magicPower: 45, accuracy: 18, specialAttack: 15, maxMana: 40 } },
  { id: "oak-bow", name: "Oak Steambow", description: "Steam-powered bow for ranged attacks", category: "weapon", rarity: "common", stackable: false, sellPrice: 55, buyPrice: 140, levelRequired: 1, weaponType: "bow", equipSlot: "weapon", stats: { attack: 6, accuracy: 10, dexterity: 3, speed: 2 } },
  { id: "willow-bow", name: "Willow Repeater", description: "Rapid-fire crossbow mechanism", category: "weapon", rarity: "uncommon", stackable: false, sellPrice: 140, buyPrice: 340, levelRequired: 10, weaponType: "bow", equipSlot: "weapon", stats: { attack: 12, accuracy: 15, dexterity: 5, speed: 3 } },
  { id: "combat-gauntlet", name: "Gear-Knuckles", description: "Mechanical gauntlets for unarmed combat", category: "weapon", rarity: "uncommon", stackable: false, sellPrice: 80, buyPrice: 200, levelRequired: 5, weaponType: "fist", equipSlot: "weapon", stats: { attack: 10, speed: 4, critChance: 8, dexterity: 3 } },

  { id: "leather-armor", name: "Oiled Leather Vest", description: "Flexible armor treated with machine oil", category: "armor", rarity: "common", stackable: false, sellPrice: 50, buyPrice: 120, levelRequired: 1, armorSlot: "body", equipSlot: "body", stats: { defense: 5, speed: 1 } },
  { id: "iron-armor", name: "Iron Steam-Plate", description: "Heavy armor with built-in steam vents", category: "armor", rarity: "uncommon", stackable: false, sellPrice: 170, buyPrice: 400, levelRequired: 10, armorSlot: "body", equipSlot: "body", stats: { defense: 15, speed: -2, maxHealth: 10 } },
  { id: "steel-armor", name: "Steel Exo-Plate", description: "Reinforced steam-powered armor", category: "armor", rarity: "rare", stackable: false, sellPrice: 400, buyPrice: 950, levelRequired: 20, armorSlot: "body", equipSlot: "body", stats: { defense: 25, specialDefense: 5, maxHealth: 25 } },
  { id: "mithril-armor", name: "Mithril Steamguard", description: "Lightweight but incredibly strong", category: "armor", rarity: "epic", stackable: false, sellPrice: 900, buyPrice: 2200, levelRequired: 35, armorSlot: "body", equipSlot: "body", stats: { defense: 38, specialDefense: 12, maxHealth: 40, speed: 2 } },
  { id: "adamant-armor", name: "Adamant Fortress Plate", description: "Nearly impenetrable alloy armor", category: "armor", rarity: "epic", stackable: false, sellPrice: 1800, buyPrice: 4500, levelRequired: 50, armorSlot: "body", equipSlot: "body", stats: { defense: 55, specialDefense: 20, maxHealth: 60 } },
  { id: "leather-helm", name: "Leather Cap", description: "Simple head protection", category: "armor", rarity: "common", stackable: false, sellPrice: 25, buyPrice: 60, levelRequired: 1, armorSlot: "helmet", equipSlot: "helmet", stats: { defense: 2 } },
  { id: "iron-helm", name: "Iron Coghelm", description: "Sturdy helmet with gear visor", category: "armor", rarity: "uncommon", stackable: false, sellPrice: 80, buyPrice: 200, levelRequired: 10, armorSlot: "helmet", equipSlot: "helmet", stats: { defense: 6, maxHealth: 5 } },
  { id: "steel-helm", name: "Steel Steamhelm", description: "Reinforced helmet with steam vents", category: "armor", rarity: "rare", stackable: false, sellPrice: 200, buyPrice: 480, levelRequired: 20, armorSlot: "helmet", equipSlot: "helmet", stats: { defense: 12, maxHealth: 10, accuracy: 2 } },
  { id: "leather-legs", name: "Leather Leggings", description: "Flexible leg protection", category: "armor", rarity: "common", stackable: false, sellPrice: 35, buyPrice: 85, levelRequired: 1, armorSlot: "legs", equipSlot: "legs", stats: { defense: 3, speed: 1 } },
  { id: "iron-legs", name: "Iron Piston Greaves", description: "Steam-assisted leg armor", category: "armor", rarity: "uncommon", stackable: false, sellPrice: 100, buyPrice: 250, levelRequired: 10, armorSlot: "legs", equipSlot: "legs", stats: { defense: 8, speed: -1, maxHealth: 5 } },
  { id: "leather-boots", name: "Oiled Boots", description: "Light and quick on your feet", category: "armor", rarity: "common", stackable: false, sellPrice: 20, buyPrice: 50, levelRequired: 1, armorSlot: "boots", equipSlot: "boots", stats: { defense: 1, speed: 2, agility: 1 } },
  { id: "iron-boots", name: "Iron Steamtreads", description: "Heavy boots with grip enhancers", category: "armor", rarity: "uncommon", stackable: false, sellPrice: 60, buyPrice: 150, levelRequired: 10, armorSlot: "boots", equipSlot: "boots", stats: { defense: 4, speed: 1 } },
  { id: "leather-gloves", name: "Leather Gauntlets", description: "Flexible hand protection", category: "armor", rarity: "common", stackable: false, sellPrice: 18, buyPrice: 45, levelRequired: 1, armorSlot: "gloves", equipSlot: "gloves", stats: { defense: 1, accuracy: 2 } },
  { id: "iron-gloves", name: "Iron Gear-Gauntlets", description: "Reinforced gloves with gear grips", category: "armor", rarity: "uncommon", stackable: false, sellPrice: 55, buyPrice: 140, levelRequired: 10, armorSlot: "gloves", equipSlot: "gloves", stats: { defense: 3, accuracy: 4, strength: 2 } },
  { id: "wooden-shield", name: "Oaken Buckler", description: "Simple wooden shield", category: "armor", rarity: "common", stackable: false, sellPrice: 30, buyPrice: 75, levelRequired: 1, armorSlot: "offhand", equipSlot: "offhand", stats: { defense: 4, dodge: 2 } },
  { id: "iron-shield", name: "Iron Cogshield", description: "Sturdy iron shield with gear motif", category: "armor", rarity: "uncommon", stackable: false, sellPrice: 90, buyPrice: 220, levelRequired: 10, armorSlot: "offhand", equipSlot: "offhand", stats: { defense: 10, dodge: 4, specialDefense: 3 } },

  { id: "lucky-cog", name: "Lucky Cog", description: "An old gear that brings fortune", category: "accessory", rarity: "uncommon", stackable: false, sellPrice: 30, buyPrice: 75, levelRequired: 1, equipSlot: "ring", stats: { luck: 5, critChance: 3 } },
  { id: "amulet-strength", name: "Amulet of Strength", description: "Empowers the wearer", category: "accessory", rarity: "uncommon", stackable: false, sellPrice: 50, buyPrice: 130, levelRequired: 5, equipSlot: "amulet", stats: { strength: 5, attack: 3 } },
  { id: "amulet-magic", name: "Amulet of Arcana", description: "Amplifies magical energy", category: "accessory", rarity: "uncommon", stackable: false, sellPrice: 50, buyPrice: 130, levelRequired: 5, equipSlot: "amulet", stats: { magicPower: 5, specialAttack: 3 } },
  { id: "ring-defense", name: "Ring of Iron Skin", description: "Hardens the body against blows", category: "accessory", rarity: "rare", stackable: false, sellPrice: 100, buyPrice: 250, levelRequired: 15, equipSlot: "ring", stats: { defense: 5, specialDefense: 3, maxHealth: 10 } },
  { id: "ring-agility", name: "Ring of Swiftness", description: "Quickens reflexes", category: "accessory", rarity: "rare", stackable: false, sellPrice: 100, buyPrice: 250, levelRequired: 15, equipSlot: "ring", stats: { speed: 4, dodge: 5, dexterity: 3 } },
  { id: "cape-adventurer", name: "Adventurer's Cloak", description: "Standard guild-issue cloak", category: "accessory", rarity: "common", stackable: false, sellPrice: 20, buyPrice: 50, levelRequired: 1, equipSlot: "cape", stats: { defense: 2, dodge: 1 } },

  { id: "copper-ore", name: "Copper Ore", description: "Raw copper from the mines", category: "material", rarity: "common", stackable: true, sellPrice: 3, buyPrice: 0, levelRequired: 1 },
  { id: "tin-ore", name: "Tin Ore", description: "Raw tin from the mines", category: "material", rarity: "common", stackable: true, sellPrice: 3, buyPrice: 0, levelRequired: 1 },
  { id: "iron-ore", name: "Iron Ore", description: "Raw iron ore", category: "material", rarity: "common", stackable: true, sellPrice: 8, buyPrice: 0, levelRequired: 15 },
  { id: "coal", name: "Coal", description: "Fuel for the forge", category: "material", rarity: "common", stackable: true, sellPrice: 12, buyPrice: 0, levelRequired: 20 },
  { id: "steel-bar", name: "Steel Bar", description: "Refined steel alloy", category: "material", rarity: "uncommon", stackable: true, sellPrice: 40, buyPrice: 0, levelRequired: 30 },
  { id: "mithril-ore", name: "Mithril Ore", description: "Rare luminescent ore", category: "material", rarity: "rare", stackable: true, sellPrice: 50, buyPrice: 0, levelRequired: 40 },
  { id: "adamantite-ore", name: "Adamantite Ore", description: "Extremely dense ore", category: "material", rarity: "epic", stackable: true, sellPrice: 120, buyPrice: 0, levelRequired: 55 },
  { id: "bronze-bar", name: "Bronze Bar", description: "Smelted bronze ingot", category: "material", rarity: "common", stackable: true, sellPrice: 8, buyPrice: 0, levelRequired: 1 },
  { id: "iron-bar", name: "Iron Bar", description: "Smelted iron ingot", category: "material", rarity: "common", stackable: true, sellPrice: 20, buyPrice: 0, levelRequired: 15 },
  { id: "mithril-bar", name: "Mithril Bar", description: "Forged mithril alloy", category: "material", rarity: "rare", stackable: true, sellPrice: 120, buyPrice: 0, levelRequired: 40 },
  { id: "raw-fish", name: "Raw Steamfish", description: "Freshly caught mechanical fish", category: "material", rarity: "common", stackable: true, sellPrice: 3, buyPrice: 0, levelRequired: 1 },
  { id: "raw-salmon", name: "Raw Cogstream Salmon", description: "Premium freshwater fish", category: "material", rarity: "common", stackable: true, sellPrice: 8, buyPrice: 0, levelRequired: 20 },
  { id: "raw-lobster", name: "Raw Iron Lobster", description: "Armored crustacean from the deep", category: "material", rarity: "uncommon", stackable: true, sellPrice: 15, buyPrice: 0, levelRequired: 35 },
  { id: "oak-log", name: "Oak Log", description: "Sturdy oak timber", category: "material", rarity: "common", stackable: true, sellPrice: 4, buyPrice: 0, levelRequired: 1 },
  { id: "willow-log", name: "Willow Log", description: "Flexible willow wood", category: "material", rarity: "common", stackable: true, sellPrice: 10, buyPrice: 0, levelRequired: 20 },
  { id: "yew-log", name: "Yew Log", description: "Dense yew timber", category: "material", rarity: "uncommon", stackable: true, sellPrice: 25, buyPrice: 0, levelRequired: 40 },
  { id: "herb-steam-leaf", name: "Steam Leaf", description: "Common herb found near vents", category: "material", rarity: "common", stackable: true, sellPrice: 5, buyPrice: 0, levelRequired: 1 },
  { id: "herb-iron-root", name: "Iron Root", description: "Metallic herb from deep soil", category: "material", rarity: "uncommon", stackable: true, sellPrice: 15, buyPrice: 0, levelRequired: 20 },
  { id: "herb-aether-bloom", name: "Aether Bloom", description: "Magical herb that glows faintly", category: "material", rarity: "rare", stackable: true, sellPrice: 40, buyPrice: 0, levelRequired: 40 },
  { id: "scrap-metal", name: "Scrap Metal", description: "Salvaged metal pieces", category: "material", rarity: "common", stackable: true, sellPrice: 2, buyPrice: 0, levelRequired: 1 },
  { id: "small-gear", name: "Small Gear", description: "A tiny mechanical gear", category: "material", rarity: "common", stackable: true, sellPrice: 3, buyPrice: 0, levelRequired: 1 },
  { id: "spider-silk", name: "Spider Silk Thread", description: "Strong silk from pipe spiders", category: "material", rarity: "common", stackable: true, sellPrice: 5, buyPrice: 0, levelRequired: 1 },
  { id: "automaton-gear", name: "Automaton Gear", description: "Complex gear from constructs", category: "material", rarity: "uncommon", stackable: true, sellPrice: 15, buyPrice: 0, levelRequired: 5 },
  { id: "bronze-scrap", name: "Bronze Scrap", description: "Scrap from bronze automatons", category: "material", rarity: "common", stackable: true, sellPrice: 5, buyPrice: 0, levelRequired: 5 },
  { id: "guardian-core", name: "Guardian Core", description: "Power core from a dungeon guardian", category: "material", rarity: "rare", stackable: true, sellPrice: 50, buyPrice: 0, levelRequired: 5 },
  { id: "ancient-stone", name: "Ancient Stone", description: "Inscribed stone from the forgotten depths", category: "material", rarity: "uncommon", stackable: true, sellPrice: 20, buyPrice: 0, levelRequired: 10 },
  { id: "shadow-essence", name: "Shadow Essence", description: "Captured darkness in a vial", category: "material", rarity: "rare", stackable: true, sellPrice: 35, buyPrice: 0, levelRequired: 10 },
  { id: "warden-key", name: "Warden Key", description: "Key from the Ancient Warden", category: "key", rarity: "epic", stackable: false, sellPrice: 0, buyPrice: 0, levelRequired: 10 },
  { id: "memory-shard", name: "Memory Shard", description: "A crystallized fragment of memory", category: "material", rarity: "rare", stackable: true, sellPrice: 30, buyPrice: 0, levelRequired: 20 },
  { id: "masters-key", name: "Master's Key", description: "The key to the Origin Chamber", category: "key", rarity: "legendary", stackable: false, sellPrice: 0, buyPrice: 0, levelRequired: 30 },
  { id: "truth-crystal", name: "Truth Crystal", description: "Contains the truth of the Gilded Cage", category: "key", rarity: "legendary", stackable: false, sellPrice: 0, buyPrice: 0, levelRequired: 30 },
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  { id: "smelt-bronze", name: "Smelt Bronze Bar", resultItemId: "bronze-bar", resultQuantity: 1, skill: "smithing", levelRequired: 1, xpGained: 12, ingredients: [{ itemId: "copper-ore", quantity: 1 }, { itemId: "tin-ore", quantity: 1 }] },
  { id: "smelt-iron", name: "Smelt Iron Bar", resultItemId: "iron-bar", resultQuantity: 1, skill: "smithing", levelRequired: 15, xpGained: 25, ingredients: [{ itemId: "iron-ore", quantity: 1 }] },
  { id: "smelt-steel", name: "Smelt Steel Bar", resultItemId: "steel-bar", resultQuantity: 1, skill: "smithing", levelRequired: 30, xpGained: 50, ingredients: [{ itemId: "iron-ore", quantity: 1 }, { itemId: "coal", quantity: 2 }] },
  { id: "smelt-mithril", name: "Smelt Mithril Bar", resultItemId: "mithril-bar", resultQuantity: 1, skill: "smithing", levelRequired: 50, xpGained: 100, ingredients: [{ itemId: "mithril-ore", quantity: 1 }, { itemId: "coal", quantity: 4 }] },
  { id: "forge-bronze-sword", name: "Forge Bronze Gear-Blade", resultItemId: "bronze-sword", resultQuantity: 1, skill: "smithing", levelRequired: 4, xpGained: 25, ingredients: [{ itemId: "bronze-bar", quantity: 2 }] },
  { id: "forge-iron-sword", name: "Forge Iron Piston-Blade", resultItemId: "iron-sword", resultQuantity: 1, skill: "smithing", levelRequired: 19, xpGained: 50, ingredients: [{ itemId: "iron-bar", quantity: 3 }] },
  { id: "forge-steel-sword", name: "Forge Steel Piston-Blade", resultItemId: "steel-sword", resultQuantity: 1, skill: "smithing", levelRequired: 34, xpGained: 100, ingredients: [{ itemId: "steel-bar", quantity: 3 }] },
  { id: "forge-bronze-armor", name: "Forge Bronze Chestplate", resultItemId: "leather-armor", resultQuantity: 1, skill: "smithing", levelRequired: 8, xpGained: 38, ingredients: [{ itemId: "bronze-bar", quantity: 5 }] },
  { id: "forge-iron-armor", name: "Forge Iron Steam-Plate", resultItemId: "iron-armor", resultQuantity: 1, skill: "smithing", levelRequired: 22, xpGained: 75, ingredients: [{ itemId: "iron-bar", quantity: 5 }] },
  { id: "cook-fish", name: "Cook Steamfish", resultItemId: "cooked-fish", resultQuantity: 1, skill: "cooking", levelRequired: 1, xpGained: 10, ingredients: [{ itemId: "raw-fish", quantity: 1 }] },
  { id: "cook-salmon", name: "Cook Cogstream Salmon", resultItemId: "cooked-salmon", resultQuantity: 1, skill: "cooking", levelRequired: 20, xpGained: 30, ingredients: [{ itemId: "raw-salmon", quantity: 1 }] },
  { id: "cook-lobster", name: "Cook Iron Lobster", resultItemId: "cooked-lobster", resultQuantity: 1, skill: "cooking", levelRequired: 35, xpGained: 60, ingredients: [{ itemId: "raw-lobster", quantity: 1 }] },
  { id: "brew-health-potion", name: "Brew Steam Elixir", resultItemId: "health-potion", resultQuantity: 1, skill: "alchemy", levelRequired: 1, xpGained: 15, ingredients: [{ itemId: "herb-steam-leaf", quantity: 2 }] },
  { id: "brew-health-greater", name: "Brew Greater Elixir", resultItemId: "health-potion-greater", resultQuantity: 1, skill: "alchemy", levelRequired: 20, xpGained: 40, ingredients: [{ itemId: "herb-iron-root", quantity: 2 }] },
  { id: "brew-mana-potion", name: "Brew Aether Vial", resultItemId: "mana-potion", resultQuantity: 1, skill: "alchemy", levelRequired: 5, xpGained: 18, ingredients: [{ itemId: "herb-steam-leaf", quantity: 1 }, { itemId: "small-gear", quantity: 1 }] },
  { id: "brew-str-potion", name: "Brew Might Tonic", resultItemId: "str-potion", resultQuantity: 1, skill: "alchemy", levelRequired: 12, xpGained: 30, ingredients: [{ itemId: "herb-steam-leaf", quantity: 1 }, { itemId: "iron-ore", quantity: 1 }] },
  { id: "brew-def-potion", name: "Brew Iron Skin", resultItemId: "def-potion", resultQuantity: 1, skill: "alchemy", levelRequired: 12, xpGained: 30, ingredients: [{ itemId: "herb-steam-leaf", quantity: 1 }, { itemId: "ancient-stone", quantity: 1 }] },
  { id: "craft-oak-staff", name: "Craft Oak Steam-Staff", resultItemId: "oak-staff", resultQuantity: 1, skill: "crafting", levelRequired: 5, xpGained: 20, ingredients: [{ itemId: "oak-log", quantity: 3 }] },
  { id: "craft-willow-staff", name: "Craft Willow Staff", resultItemId: "willow-staff", resultQuantity: 1, skill: "crafting", levelRequired: 25, xpGained: 50, ingredients: [{ itemId: "willow-log", quantity: 3 }, { itemId: "small-gear", quantity: 2 }] },
  { id: "craft-oak-bow", name: "Craft Oak Steambow", resultItemId: "oak-bow", resultQuantity: 1, skill: "crafting", levelRequired: 5, xpGained: 20, ingredients: [{ itemId: "oak-log", quantity: 2 }, { itemId: "spider-silk", quantity: 3 }] },
  { id: "craft-willow-bow", name: "Craft Willow Repeater", resultItemId: "willow-bow", resultQuantity: 1, skill: "crafting", levelRequired: 25, xpGained: 50, ingredients: [{ itemId: "willow-log", quantity: 2 }, { itemId: "spider-silk", quantity: 5 }, { itemId: "small-gear", quantity: 3 }] },
];

export const RESOURCE_NODES: ResourceNode[] = [
  { id: "copper-node", name: "Copper Vein", skill: "mining", levelRequired: 1, xpPerGather: 8, gatherTimeMs: 3000, drops: [{ itemId: "copper-ore", chance: 100, minQty: 1, maxQty: 1 }], locations: ["steam-tunnels", "town-mine"] },
  { id: "tin-node", name: "Tin Deposit", skill: "mining", levelRequired: 1, xpPerGather: 8, gatherTimeMs: 3000, drops: [{ itemId: "tin-ore", chance: 100, minQty: 1, maxQty: 1 }], locations: ["steam-tunnels", "town-mine"] },
  { id: "iron-node", name: "Iron Vein", skill: "mining", levelRequired: 15, xpPerGather: 20, gatherTimeMs: 5000, drops: [{ itemId: "iron-ore", chance: 100, minQty: 1, maxQty: 1 }], locations: ["gear-works", "forgotten-depths"] },
  { id: "coal-node", name: "Coal Deposit", skill: "mining", levelRequired: 20, xpPerGather: 25, gatherTimeMs: 5000, drops: [{ itemId: "coal", chance: 100, minQty: 1, maxQty: 1 }], locations: ["gear-works", "forgotten-depths"] },
  { id: "mithril-node", name: "Mithril Vein", skill: "mining", levelRequired: 40, xpPerGather: 60, gatherTimeMs: 8000, drops: [{ itemId: "mithril-ore", chance: 100, minQty: 1, maxQty: 1 }], locations: ["memory-halls"] },
  { id: "adamantite-node", name: "Adamantite Vein", skill: "mining", levelRequired: 55, xpPerGather: 100, gatherTimeMs: 12000, drops: [{ itemId: "adamantite-ore", chance: 100, minQty: 1, maxQty: 1 }], locations: ["origin-chamber"] },
  { id: "fish-spot", name: "Steam Pool", skill: "fishing", levelRequired: 1, xpPerGather: 10, gatherTimeMs: 4000, drops: [{ itemId: "raw-fish", chance: 100, minQty: 1, maxQty: 1 }], locations: ["steam-tunnels", "town-pond"] },
  { id: "salmon-spot", name: "Cogstream River", skill: "fishing", levelRequired: 20, xpPerGather: 25, gatherTimeMs: 5000, drops: [{ itemId: "raw-salmon", chance: 100, minQty: 1, maxQty: 1 }], locations: ["forgotten-depths"] },
  { id: "lobster-spot", name: "Deep Pool", skill: "fishing", levelRequired: 35, xpPerGather: 50, gatherTimeMs: 7000, drops: [{ itemId: "raw-lobster", chance: 100, minQty: 1, maxQty: 1 }], locations: ["memory-halls"] },
  { id: "oak-tree", name: "Oak Tree", skill: "woodcutting", levelRequired: 1, xpPerGather: 10, gatherTimeMs: 3500, drops: [{ itemId: "oak-log", chance: 100, minQty: 1, maxQty: 1 }], locations: ["town-outskirts", "steam-tunnels"] },
  { id: "willow-tree", name: "Willow Tree", skill: "woodcutting", levelRequired: 20, xpPerGather: 30, gatherTimeMs: 5000, drops: [{ itemId: "willow-log", chance: 100, minQty: 1, maxQty: 1 }], locations: ["forgotten-depths"] },
  { id: "yew-tree", name: "Yew Tree", skill: "woodcutting", levelRequired: 40, xpPerGather: 60, gatherTimeMs: 8000, drops: [{ itemId: "yew-log", chance: 100, minQty: 1, maxQty: 1 }], locations: ["memory-halls"] },
  { id: "steam-leaf-patch", name: "Steam Leaf Patch", skill: "herbalism", levelRequired: 1, xpPerGather: 8, gatherTimeMs: 3000, drops: [{ itemId: "herb-steam-leaf", chance: 100, minQty: 1, maxQty: 2 }], locations: ["steam-tunnels", "town-garden"] },
  { id: "iron-root-patch", name: "Iron Root Cluster", skill: "herbalism", levelRequired: 20, xpPerGather: 25, gatherTimeMs: 5000, drops: [{ itemId: "herb-iron-root", chance: 100, minQty: 1, maxQty: 1 }], locations: ["forgotten-depths"] },
  { id: "aether-bloom-patch", name: "Aether Bloom Garden", skill: "herbalism", levelRequired: 40, xpPerGather: 55, gatherTimeMs: 7000, drops: [{ itemId: "herb-aether-bloom", chance: 100, minQty: 1, maxQty: 1 }], locations: ["memory-halls"] },
];

export const COMBAT_ABILITIES: CombatAbility[] = [
  { id: "power-strike", name: "Power Strike", description: "A heavy melee blow", type: "physical", damage: 18, manaCost: 8, cooldown: 0, unlockLevel: 1, scaling: { stat: "strength", multiplier: 0.5 } },
  { id: "defensive-stance", name: "Defensive Stance", description: "Brace for impact, boosting defense", type: "support", damage: 0, manaCost: 12, cooldown: 3, unlockLevel: 3, effect: "shield", scaling: { stat: "defense", multiplier: 0.3 } },
  { id: "quick-strike", name: "Quick Strike", description: "Fast attack with bonus accuracy", type: "physical", damage: 12, manaCost: 6, cooldown: 0, unlockLevel: 5, scaling: { stat: "dexterity", multiplier: 0.6 } },
  { id: "healing-surge", name: "Healing Surge", description: "Restore health with steam magic", type: "support", damage: 0, manaCost: 18, cooldown: 3, unlockLevel: 7, effect: "heal", scaling: { stat: "magicPower", multiplier: 0.4 } },
  { id: "flame-burst", name: "Flame Burst", description: "Blast of magical fire", type: "magic", damage: 22, manaCost: 15, cooldown: 1, unlockLevel: 8, effect: "burn", effectChance: 30, skillRequired: { skill: "magic", level: 5 }, scaling: { stat: "magicPower", multiplier: 0.7 } },
  { id: "whirlwind", name: "Whirlwind Slash", description: "Spinning attack hitting all around", type: "physical", damage: 16, manaCost: 20, cooldown: 2, unlockLevel: 10, scaling: { stat: "strength", multiplier: 0.6 } },
  { id: "poison-blade", name: "Poison Blade", description: "Envenom your weapon", type: "physical", damage: 10, manaCost: 12, cooldown: 2, unlockLevel: 12, effect: "poison", effectChance: 60, skillRequired: { skill: "alchemy", level: 10 }, scaling: { stat: "dexterity", multiplier: 0.4 } },
  { id: "arcane-bolt", name: "Arcane Bolt", description: "Pure magical energy projectile", type: "magic", damage: 28, manaCost: 20, cooldown: 1, unlockLevel: 14, skillRequired: { skill: "magic", level: 15 }, scaling: { stat: "magicPower", multiplier: 0.8 } },
  { id: "executioner", name: "Executioner", description: "Massive damage to low health targets", type: "physical", damage: 45, manaCost: 25, cooldown: 4, unlockLevel: 18, scaling: { stat: "strength", multiplier: 0.8 } },
  { id: "lifesteal-strike", name: "Vampiric Strike", description: "Drain life from the enemy", type: "physical", damage: 15, manaCost: 18, cooldown: 2, unlockLevel: 16, effect: "lifesteal", scaling: { stat: "strength", multiplier: 0.5 } },
  { id: "ice-shard", name: "Ice Shard", description: "Frozen projectile that slows", type: "magic", damage: 20, manaCost: 16, cooldown: 1, unlockLevel: 11, effect: "stun", effectChance: 20, skillRequired: { skill: "magic", level: 10 }, scaling: { stat: "magicPower", multiplier: 0.6 } },
  { id: "mana-drain", name: "Mana Drain", description: "Steal mana from the enemy", type: "magic", damage: 12, manaCost: 10, cooldown: 2, unlockLevel: 15, effect: "drain", skillRequired: { skill: "magic", level: 20 }, scaling: { stat: "magicPower", multiplier: 0.5 } },
  { id: "memorys-fury", name: "Memory's Fury", description: "Channel forgotten rage into a devastating attack", type: "physical", damage: 55, manaCost: 35, cooldown: 5, unlockLevel: 25, scaling: { stat: "strength", multiplier: 1.0 } },
  { id: "thunder-strike", name: "Thunder Strike", description: "Call lightning upon your foe", type: "magic", damage: 40, manaCost: 30, cooldown: 3, unlockLevel: 22, effect: "stun", effectChance: 35, skillRequired: { skill: "magic", level: 30 }, scaling: { stat: "magicPower", multiplier: 0.9 } },
  { id: "full-restore", name: "Full Restore", description: "Fully heal and cure all ailments", type: "support", damage: 0, manaCost: 50, cooldown: 8, unlockLevel: 30, effect: "heal", skillRequired: { skill: "magic", level: 40 }, scaling: { stat: "magicPower", multiplier: 1.0 } },
];

export const MONSTERS: MonsterDefinition[] = [
  { id: "steam-rat", name: "Steam Rat", description: "A mechanical rodent scurrying through pipes", baseLevel: 1, sprite: "enemy-rust-rats", combatXp: 15, goldRange: [2, 8],
    baseStats: { maxHealth: 25, currentHealth: 25, maxMana: 0, currentMana: 0, attack: 6, defense: 2, specialAttack: 0, specialDefense: 1, accuracy: 55, dexterity: 8, strength: 4, luck: 2, dodge: 8, magicPower: 0, magicDefense: 1, speed: 10, critChance: 5 },
    abilities: [{ id: "bite", name: "Rusty Bite", description: "A corroded bite", type: "physical", damage: 6, manaCost: 0, cooldown: 0, unlockLevel: 1, scaling: { stat: "strength", multiplier: 0.3 } }],
    dropTable: [
      { itemId: "scrap-metal", baseChance: 60, rarity: "common", minQty: 1, maxQty: 2 },
      { itemId: "small-gear", baseChance: 35, rarity: "common", minQty: 1, maxQty: 1 },
      { itemId: "health-potion", baseChance: 5, rarity: "common", minQty: 1, maxQty: 1 },
    ], isBoss: false },
  { id: "pipe-spider", name: "Pipe Spider", description: "Spindly legs crawling through machinery", baseLevel: 2, sprite: "enemy-steam-spider", combatXp: 20, goldRange: [3, 10],
    baseStats: { maxHealth: 20, currentHealth: 20, maxMana: 5, currentMana: 5, attack: 8, defense: 1, specialAttack: 3, specialDefense: 2, accuracy: 60, dexterity: 12, strength: 5, luck: 3, dodge: 12, magicPower: 3, magicDefense: 2, speed: 13, critChance: 10 },
    abilities: [
      { id: "web", name: "Steam Web", description: "Entangling web", type: "physical", damage: 4, manaCost: 0, cooldown: 2, unlockLevel: 1, effect: "stun", effectChance: 40, scaling: { stat: "dexterity", multiplier: 0.3 } },
      { id: "venom-bite", name: "Venom Bite", description: "Poisonous fangs", type: "physical", damage: 8, manaCost: 0, cooldown: 1, unlockLevel: 1, effect: "poison", effectChance: 30, scaling: { stat: "strength", multiplier: 0.4 } },
    ],
    dropTable: [
      { itemId: "spider-silk", baseChance: 55, rarity: "common", minQty: 1, maxQty: 3 },
      { itemId: "small-gear", baseChance: 25, rarity: "common", minQty: 1, maxQty: 1 },
    ], isBoss: false },
  { id: "cog-golem", name: "Cog Golem", description: "Humanoid construct of interlocking gears", baseLevel: 5, sprite: "enemy-clockwork-golem", combatXp: 45, goldRange: [10, 25],
    baseStats: { maxHealth: 65, currentHealth: 65, maxMana: 0, currentMana: 0, attack: 14, defense: 10, specialAttack: 2, specialDefense: 5, accuracy: 50, dexterity: 3, strength: 16, luck: 2, dodge: 3, magicPower: 0, magicDefense: 5, speed: 4, critChance: 5 },
    abilities: [
      { id: "gear-smash", name: "Gear Smash", description: "Crushing mechanical blow", type: "physical", damage: 18, manaCost: 0, cooldown: 1, unlockLevel: 1, scaling: { stat: "strength", multiplier: 0.5 } },
      { id: "body-slam", name: "Body Slam", description: "Full weight impact", type: "physical", damage: 22, manaCost: 0, cooldown: 2, unlockLevel: 1, effect: "stun", effectChance: 25, scaling: { stat: "strength", multiplier: 0.6 } },
    ],
    dropTable: [
      { itemId: "automaton-gear", baseChance: 65, rarity: "uncommon", minQty: 1, maxQty: 2 },
      { itemId: "bronze-scrap", baseChance: 45, rarity: "common", minQty: 1, maxQty: 3 },
      { itemId: "iron-ore", baseChance: 15, rarity: "common", minQty: 1, maxQty: 1 },
    ], isBoss: false },
  { id: "steam-guardian", name: "Steam Guardian", description: "Towering automaton guardian", baseLevel: 8, sprite: "enemy-clockwork-golem", combatXp: 120, goldRange: [30, 60],
    baseStats: { maxHealth: 180, currentHealth: 180, maxMana: 20, currentMana: 20, attack: 20, defense: 14, specialAttack: 8, specialDefense: 8, accuracy: 55, dexterity: 4, strength: 22, luck: 3, dodge: 3, magicPower: 8, magicDefense: 8, speed: 6, critChance: 8 },
    abilities: [
      { id: "steam-blast", name: "Steam Blast", description: "Scalding steam eruption", type: "magic", damage: 28, manaCost: 5, cooldown: 2, unlockLevel: 1, effect: "burn", effectChance: 40, scaling: { stat: "magicPower", multiplier: 0.5 } },
      { id: "crushing-grip", name: "Crushing Grip", description: "Inescapable mechanical grasp", type: "physical", damage: 35, manaCost: 0, cooldown: 3, unlockLevel: 1, scaling: { stat: "strength", multiplier: 0.7 } },
    ],
    dropTable: [
      { itemId: "guardian-core", baseChance: 100, rarity: "rare", minQty: 1, maxQty: 1 },
      { itemId: "iron-ore", baseChance: 50, rarity: "common", minQty: 2, maxQty: 4 },
      { itemId: "automaton-gear", baseChance: 80, rarity: "uncommon", minQty: 2, maxQty: 3 },
    ], isBoss: true },
  { id: "stone-sentinel", name: "Stone Sentinel", description: "Ancient guardian carved from living rock", baseLevel: 12, sprite: "enemy-clockwork-golem", combatXp: 65, goldRange: [15, 35],
    baseStats: { maxHealth: 100, currentHealth: 100, maxMana: 0, currentMana: 0, attack: 16, defense: 20, specialAttack: 3, specialDefense: 12, accuracy: 48, dexterity: 2, strength: 20, luck: 2, dodge: 2, magicPower: 3, magicDefense: 12, speed: 3, critChance: 5 },
    abilities: [
      { id: "stone-fist", name: "Stone Fist", description: "Crushing rocky blow", type: "physical", damage: 24, manaCost: 0, cooldown: 1, unlockLevel: 1, scaling: { stat: "strength", multiplier: 0.5 } },
    ],
    dropTable: [
      { itemId: "ancient-stone", baseChance: 55, rarity: "uncommon", minQty: 1, maxQty: 2 },
      { itemId: "iron-ore", baseChance: 30, rarity: "common", minQty: 1, maxQty: 2 },
    ], isBoss: false },
  { id: "shadow-wisp", name: "Shadow Wisp", description: "Fragment of darkness drifting through ruins", baseLevel: 13, sprite: "enemy-shadow-wraith", combatXp: 55, goldRange: [12, 30],
    baseStats: { maxHealth: 40, currentHealth: 40, maxMana: 30, currentMana: 30, attack: 8, defense: 3, specialAttack: 18, specialDefense: 15, accuracy: 65, dexterity: 15, strength: 5, luck: 8, dodge: 25, magicPower: 20, magicDefense: 15, speed: 16, critChance: 18 },
    abilities: [
      { id: "life-drain", name: "Life Drain", description: "Siphon life force", type: "magic", damage: 15, manaCost: 8, cooldown: 2, unlockLevel: 1, effect: "lifesteal", scaling: { stat: "magicPower", multiplier: 0.6 } },
      { id: "shadow-bolt", name: "Shadow Bolt", description: "Dark energy projectile", type: "magic", damage: 18, manaCost: 5, cooldown: 0, unlockLevel: 1, scaling: { stat: "magicPower", multiplier: 0.5 } },
    ],
    dropTable: [
      { itemId: "shadow-essence", baseChance: 45, rarity: "rare", minQty: 1, maxQty: 1 },
      { itemId: "memory-shard", baseChance: 10, rarity: "rare", minQty: 1, maxQty: 1 },
    ], isBoss: false },
  { id: "ancient-warden", name: "Ancient Warden", description: "Keeper of the old prison depths", baseLevel: 18, sprite: "enemy-shadow-wraith", combatXp: 200, goldRange: [50, 100],
    baseStats: { maxHealth: 300, currentHealth: 300, maxMana: 40, currentMana: 40, attack: 24, defense: 22, specialAttack: 15, specialDefense: 18, accuracy: 58, dexterity: 5, strength: 28, luck: 5, dodge: 5, magicPower: 15, magicDefense: 18, speed: 5, critChance: 10 },
    abilities: [
      { id: "chains-of-binding", name: "Chains of Binding", description: "Spectral chains that immobilize", type: "magic", damage: 18, manaCost: 10, cooldown: 2, unlockLevel: 1, effect: "stun", effectChance: 50, scaling: { stat: "magicPower", multiplier: 0.4 } },
      { id: "warden-strike", name: "Warden's Strike", description: "Devastating overhead blow", type: "physical", damage: 40, manaCost: 0, cooldown: 3, unlockLevel: 1, scaling: { stat: "strength", multiplier: 0.7 } },
    ],
    dropTable: [
      { itemId: "warden-key", baseChance: 100, rarity: "epic", minQty: 1, maxQty: 1 },
      { itemId: "ancient-stone", baseChance: 80, rarity: "uncommon", minQty: 2, maxQty: 4 },
      { itemId: "shadow-essence", baseChance: 60, rarity: "rare", minQty: 1, maxQty: 2 },
    ], isBoss: true },
  { id: "memory-phantom", name: "Memory Phantom", description: "Ghostly image of someone you once knew", baseLevel: 22, sprite: "enemy-shadow-wraith", combatXp: 80, goldRange: [20, 45],
    baseStats: { maxHealth: 75, currentHealth: 75, maxMana: 50, currentMana: 50, attack: 12, defense: 5, specialAttack: 25, specialDefense: 20, accuracy: 70, dexterity: 12, strength: 8, luck: 10, dodge: 20, magicPower: 28, magicDefense: 20, speed: 14, critChance: 15 },
    abilities: [
      { id: "painful-memory", name: "Painful Memory", description: "Forces traumatic visions", type: "magic", damage: 28, manaCost: 10, cooldown: 2, unlockLevel: 1, effect: "weaken", effectChance: 40, scaling: { stat: "magicPower", multiplier: 0.7 } },
      { id: "fade", name: "Phase Strike", description: "Strikes from ethereal plane", type: "magic", damage: 20, manaCost: 5, cooldown: 0, unlockLevel: 1, scaling: { stat: "magicPower", multiplier: 0.5 } },
    ],
    dropTable: [
      { itemId: "memory-shard", baseChance: 65, rarity: "rare", minQty: 1, maxQty: 2 },
      { itemId: "herb-aether-bloom", baseChance: 15, rarity: "rare", minQty: 1, maxQty: 1 },
    ], isBoss: false },
  { id: "echo-of-self", name: "Echo of Your Past Self", description: "Shadow version of who you were", baseLevel: 28, sprite: "enemy-boss-dragon", combatXp: 350, goldRange: [80, 150],
    baseStats: { maxHealth: 400, currentHealth: 400, maxMana: 60, currentMana: 60, attack: 28, defense: 15, specialAttack: 28, specialDefense: 15, accuracy: 70, dexterity: 12, strength: 25, luck: 10, dodge: 12, magicPower: 28, magicDefense: 15, speed: 12, critChance: 15 },
    abilities: [
      { id: "mirror-strike", name: "Mirror Strike", description: "Copies your moves", type: "physical", damage: 35, manaCost: 5, cooldown: 1, unlockLevel: 1, scaling: { stat: "strength", multiplier: 0.7 } },
      { id: "forgotten-pain", name: "Forgotten Pain", description: "Weaponized lost memories", type: "magic", damage: 45, manaCost: 15, cooldown: 3, unlockLevel: 1, effect: "stun", effectChance: 35, scaling: { stat: "magicPower", multiplier: 0.8 } },
    ],
    dropTable: [
      { itemId: "memory-shard", baseChance: 100, rarity: "rare", minQty: 3, maxQty: 5 },
      { itemId: "mithril-ore", baseChance: 40, rarity: "rare", minQty: 1, maxQty: 2 },
    ], isBoss: true },
  { id: "the-first-master", name: "The First Master", description: "The immortal original owner of the prison", baseLevel: 35, sprite: "enemy-boss-dragon", combatXp: 800, goldRange: [200, 500],
    baseStats: { maxHealth: 600, currentHealth: 600, maxMana: 100, currentMana: 100, attack: 38, defense: 25, specialAttack: 38, specialDefense: 25, accuracy: 75, dexterity: 10, strength: 35, luck: 12, dodge: 10, magicPower: 40, magicDefense: 25, speed: 10, critChance: 18 },
    abilities: [
      { id: "contract-chains", name: "Contract Chains", description: "Binding magical chains", type: "magic", damage: 45, manaCost: 15, cooldown: 2, unlockLevel: 1, effect: "stun", effectChance: 45, scaling: { stat: "magicPower", multiplier: 0.7 } },
      { id: "soul-rend", name: "Soul Rend", description: "Tears at the soul", type: "magic", damage: 55, manaCost: 20, cooldown: 3, unlockLevel: 1, effect: "weaken", effectChance: 50, scaling: { stat: "magicPower", multiplier: 0.9 } },
      { id: "dark-dominion", name: "Dark Dominion", description: "Overwhelming dark power", type: "magic", damage: 40, manaCost: 25, cooldown: 4, unlockLevel: 1, effect: "burn", effectChance: 60, scaling: { stat: "magicPower", multiplier: 0.8 } },
    ],
    dropTable: [
      { itemId: "masters-key", baseChance: 100, rarity: "legendary", minQty: 1, maxQty: 1 },
      { itemId: "truth-crystal", baseChance: 100, rarity: "legendary", minQty: 1, maxQty: 1 },
      { itemId: "dragon-sword", baseChance: 5, rarity: "legendary", minQty: 1, maxQty: 1 },
      { itemId: "adamantite-ore", baseChance: 50, rarity: "epic", minQty: 2, maxQty: 5 },
    ], isBoss: true },
];

export function getMonsterForFloor(floorLevel: number): MonsterDefinition {
  const eligible = MONSTERS.filter(m => !m.isBoss && m.baseLevel <= floorLevel + 3);
  if (eligible.length === 0) return MONSTERS[0];
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export function getBossForFloor(floorLevel: number): MonsterDefinition | null {
  const bosses = MONSTERS.filter(m => m.isBoss && m.baseLevel <= floorLevel + 5);
  if (bosses.length === 0) return null;
  return bosses[bosses.length - 1];
}

export function rollDrops(dropTable: MonsterDrop[], playerLuck: number): InventoryItem[] {
  const drops: InventoryItem[] = [];
  for (const drop of dropTable) {
    const luckBonus = 1 + playerLuck * 0.01;
    const chance = drop.baseChance * luckBonus;
    if (Math.random() * 100 < chance) {
      const qty = drop.minQty + Math.floor(Math.random() * (drop.maxQty - drop.minQty + 1));
      drops.push({ itemId: drop.itemId, quantity: qty });
    }
  }
  return drops;
}

export function getItemById(itemId: string): ItemDefinition | undefined {
  return ITEMS.find(i => i.id === itemId);
}

export function getEquipmentStats(equipment: EquipmentSlots): Partial<FullCombatStats> {
  const totalStats: Partial<FullCombatStats> = {};
  for (const slotKey of Object.keys(equipment) as (keyof EquipmentSlots)[]) {
    const itemId = equipment[slotKey];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (!item?.stats) continue;
    for (const [stat, val] of Object.entries(item.stats)) {
      const key = stat as keyof FullCombatStats;
      (totalStats as any)[key] = ((totalStats as any)[key] || 0) + (val as number);
    }
  }
  return totalStats;
}

export function getEffectiveCombatStats(hero: FullHeroStats): FullCombatStats {
  const base = { ...hero.combatStats };
  const eqStats = getEquipmentStats(hero.equipment);
  for (const [stat, val] of Object.entries(eqStats)) {
    const key = stat as keyof FullCombatStats;
    (base as any)[key] = ((base as any)[key] || 0) + (val as number);
  }
  return base;
}

export const DUNGEON_FLOOR_THEMES: { minFloor: number; maxFloor: number; name: string; theme: string; description: string }[] = [
  { minFloor: 1, maxFloor: 4, name: "Steam Tunnels", theme: "steam", description: "Hissing pipes and basic mechanical threats" },
  { minFloor: 5, maxFloor: 9, name: "The Gear Works", theme: "mechanical", description: "Massive gears and aggressive machinery" },
  { minFloor: 10, maxFloor: 14, name: "The Forgotten Depths", theme: "ancient", description: "Ancient stone replaces metal, something older dwells here" },
  { minFloor: 15, maxFloor: 19, name: "The Underforges", theme: "mechanical", description: "Abandoned foundries where molten metal still flows" },
  { minFloor: 20, maxFloor: 24, name: "The Memory Halls", theme: "void", description: "Reality bends, visions of the past appear" },
  { minFloor: 25, maxFloor: 29, name: "The Abyss Gate", theme: "dark", description: "Where darkness becomes tangible and memories given form" },
  { minFloor: 30, maxFloor: 30, name: "The Origin Chamber", theme: "dark", description: "The deepest level where the truth awaits" },
];

export function getFloorTheme(floor: number) {
  return DUNGEON_FLOOR_THEMES.find(t => floor >= t.minFloor && floor <= t.maxFloor) || DUNGEON_FLOOR_THEMES[0];
}
