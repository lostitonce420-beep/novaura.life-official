import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  useSharedValue,
  cancelAnimation,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import {
  GameColors,
  Spacing,
  BorderRadius,
  GameTypography,
} from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { HeroSkill } from "@/data/steampunkWorld";
import { useGame } from "@/context/GameContext";
import {
  getItemById,
  rollDrops,
  MONSTERS,
  MonsterDefinition,
  scaleMonsterStats,
  FullCombatStats,
  RARITY_COLORS,
} from "@/data/rpgSystems";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width } = Dimensions.get("window");

const ENEMY_SPRITES: Record<string, any> = {
  "steam-rat": require("../../assets/images/sprites/enemy-rust-rats.png"),
  "pipe-spider": require("../../assets/images/sprites/enemy-steam-spider.png"),
  "cog-golem": require("../../assets/images/sprites/enemy-clockwork-golem.png"),
  "steam-guardian": require("../../assets/images/sprites/enemy-clockwork-golem.png"),
  "stone-sentinel": require("../../assets/images/sprites/enemy-clockwork-golem.png"),
  "shadow-wisp": require("../../assets/images/sprites/enemy-shadow-wraith.png"),
  "ancient-warden": require("../../assets/images/sprites/enemy-shadow-wraith.png"),
  "memory-phantom": require("../../assets/images/sprites/enemy-shadow-wraith.png"),
  "echo-of-self": require("../../assets/images/sprites/enemy-boss-dragon.png"),
  "the-first-master": require("../../assets/images/sprites/enemy-boss-dragon.png"),
};

const HERO_PORTRAIT = require("../../assets/images/sprites/hero-portrait.png");

function AttackSparks({ visible, target }: { visible: boolean; target: "hero" | "enemy" }) {
  const sparks = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60) * (Math.PI / 180);
    const dist = 20 + Math.random() * 25;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 3 + Math.random() * 4 };
  });
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {sparks.map((s, i) => (
        <Animated.View
          key={`${target}-spark-${i}`}
          entering={FadeIn.duration(100)}
          style={{
            position: "absolute", left: "50%", top: "50%",
            marginLeft: s.x - s.size / 2, marginTop: s.y - s.size / 2,
            width: s.size, height: s.size, borderRadius: s.size / 2,
            backgroundColor: target === "enemy" ? GameColors.accent : GameColors.danger,
            opacity: 0.9,
          }}
        />
      ))}
    </View>
  );
}

function IdleBreath({ children }: { children: React.ReactNode }) {
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    );
    return () => cancelAnimation(breath);
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(breath.value, [0, 1], [1, 1.03]) },
      { translateY: interpolate(breath.value, [0, 1], [0, -2]) },
    ],
  }));
  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

interface CombatScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Combat">;
  route: RouteProp<RootStackParamList, "Combat">;
}

type CombatPhase = "player-turn" | "enemy-turn" | "victory" | "defeat" | "fled";

interface CombatLog {
  text: string;
  type: "player" | "enemy" | "system" | "critical" | "dodge" | "heal";
}

export default function CombatScreen({ navigation, route }: CombatScreenProps) {
  const { enemy, dungeonFloor } = route.params;
  const insets = useSafeAreaInsets();
  const {
    gameState, getEffectiveStats, getAvailableSkills,
    addCombatXp, addGold, addItemToInventory, addMonsterKill,
    takeDamage, healHealth, restoreMana, spendMana, trainSkill,
    removeItemFromInventory,
  } = useGame();

  const heroStats = getEffectiveStats();
  const hero = gameState.hero;

  const monsterDef = MONSTERS.find(m => m.id === enemy.id);
  const scaledEnemyStats = monsterDef
    ? scaleMonsterStats(monsterDef.baseStats, monsterDef.baseLevel, dungeonFloor)
    : {
        maxHealth: enemy.stats.maxHealth, currentHealth: enemy.stats.maxHealth,
        maxMana: 0, currentMana: 0, attack: enemy.stats.attack, defense: enemy.stats.defense,
        specialAttack: 0, specialDefense: 0, accuracy: 55, dexterity: 5, strength: enemy.stats.attack,
        luck: 3, dodge: 5, magicPower: 0, magicDefense: 5, speed: enemy.stats.speed, critChance: enemy.stats.critChance,
      } as FullCombatStats;

  const [enemyHealth, setEnemyHealth] = useState(scaledEnemyStats.maxHealth);
  const [enemyMana, setEnemyMana] = useState(scaledEnemyStats.maxMana);
  const [phase, setPhase] = useState<CombatPhase>("player-turn");
  const [combatLog, setCombatLog] = useState<CombatLog[]>([
    { text: `A wild ${enemy.name} appears!`, type: "system" },
  ]);
  const [showSkills, setShowSkills] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [turn, setTurn] = useState(1);
  const [loot, setLoot] = useState<{ itemId: string; quantity: number }[]>([]);
  const [expGained, setExpGained] = useState(0);
  const [goldGained, setGoldGained] = useState(0);
  const [showDamage, setShowDamage] = useState<{
    amount: number; target: "hero" | "enemy"; isCrit: boolean; isDodge?: boolean; isHeal?: boolean;
  } | null>(null);
  const [showSparks, setShowSparks] = useState<"hero" | "enemy" | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);

  const heroShake = useSharedValue(0);
  const enemyShake = useSharedValue(0);
  const enemyFlash = useSharedValue(1);
  const heroFlash = useSharedValue(1);

  const addLog = (text: string, type: CombatLog["type"]) => {
    setCombatLog((prev) => [...prev.slice(-5), { text, type }]);
  };

  const calcPhysDamage = (atk: FullCombatStats, def: FullCombatStats, baseDmg: number) => {
    const hitChance = (atk.accuracy + atk.dexterity * 0.5) / (atk.accuracy + atk.dexterity * 0.5 + def.dodge * 0.8);
    if (Math.random() > hitChance) return { damage: 0, isCrit: false, isDodged: true };
    const atkPower = atk.attack + atk.strength * 0.4;
    const defPower = def.defense + def.dexterity * 0.2;
    const variance = 0.85 + Math.random() * 0.3;
    let dmg = baseDmg * (atkPower / (atkPower + defPower)) * variance;
    const effectiveCrit = atk.critChance + atk.luck * 0.3;
    const isCrit = Math.random() * 100 < effectiveCrit;
    if (isCrit) dmg *= 1.5 + atk.luck * 0.01;
    return { damage: Math.max(1, Math.floor(dmg)), isCrit, isDodged: false };
  };

  const calcMagDamage = (atk: FullCombatStats, def: FullCombatStats, baseDmg: number) => {
    const hitChance = (atk.accuracy + atk.magicPower * 0.3) / (atk.accuracy + atk.magicPower * 0.3 + def.magicDefense * 0.5);
    if (Math.random() > hitChance) return { damage: 0, isCrit: false, isDodged: true };
    const magAtk = atk.magicPower + atk.specialAttack * 0.5;
    const magDef = def.magicDefense + def.specialDefense * 0.4;
    const variance = 0.85 + Math.random() * 0.3;
    let dmg = baseDmg * (magAtk / (magAtk + magDef)) * variance;
    const isCrit = Math.random() * 100 < (atk.critChance + atk.luck * 0.2);
    if (isCrit) dmg *= 1.4;
    return { damage: Math.max(1, Math.floor(dmg)), isCrit, isDodged: false };
  };

  const showDamageNumber = (amount: number, target: "hero" | "enemy", isCrit: boolean, isDodge?: boolean, isHeal?: boolean) => {
    setShowDamage({ amount, target, isCrit, isDodge, isHeal });
    if (!isDodge && !isHeal) setShowSparks(target);
    setTimeout(() => setShowDamage(null), 1200);
    setTimeout(() => setShowSparks(null), 400);
    if (isCrit) { setScreenFlash(true); setTimeout(() => setScreenFlash(false), 200); }
  };

  const doHaptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") Haptics.impactAsync(style);
  }, []);

  const shakeTarget = (target: "hero" | "enemy") => {
    const sv = target === "hero" ? heroShake : enemyShake;
    const fv = target === "hero" ? heroFlash : enemyFlash;
    sv.value = withSequence(
      withTiming(-12, { duration: 50 }), withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }), withTiming(0, { duration: 50 })
    );
    fv.value = withSequence(withTiming(0.3, { duration: 80 }), withTiming(1, { duration: 200 }));
  };

  const handleAttack = () => {
    if (phase !== "player-turn") return;
    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const result = calcPhysDamage(heroStats, scaledEnemyStats, heroStats.attack);
    if (result.isDodged) {
      addLog(`${enemy.name} dodged your attack!`, "dodge");
      showDamageNumber(0, "enemy", false, true);
    } else {
      if (result.isCrit) {
        addLog(`Critical hit! You deal ${result.damage} damage!`, "critical");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        addLog(`You attack for ${result.damage} damage!`, "player");
      }
      showDamageNumber(result.damage, "enemy", result.isCrit);
      shakeTarget("enemy");
    }
    const newHealth = Math.max(0, enemyHealth - result.damage);
    setEnemyHealth(newHealth);
    trainSkill("combat", 4);
    if (newHealth <= 0) { handleVictory(); } else { setPhase("enemy-turn"); setTimeout(() => handleEnemyTurn(), 1200); }
  };

  const handleSkill = (skill: HeroSkill) => {
    if (phase !== "player-turn") return;
    if (cooldowns[skill.id] > 0) return;
    if (hero.combatStats.currentMana < skill.cost) {
      addLog("Not enough mana!", "system");
      return;
    }
    doHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setShowSkills(false);
    const spent = spendMana(skill.cost);
    if (!spent) {
      addLog("Not enough mana!", "system");
      return;
    }

    if (skill.effect === "heal-30" || skill.effect === "full-heal") {
      const healAmt = skill.effect === "full-heal" ? hero.combatStats.maxHealth : 30 + Math.floor(heroStats.magicPower * 0.5);
      healHealth(healAmt);
      addLog(`${skill.name} restores ${healAmt} HP!`, "heal");
      showDamageNumber(healAmt, "hero", false, false, true);
      trainSkill("magic", 6);
    } else if (skill.effect === "defense-boost") {
      addLog(`${skill.name} boosts your defense!`, "player");
      trainSkill("combat", 4);
    } else {
      const isM = skill.type === "magic";
      const result = isM ? calcMagDamage(heroStats, scaledEnemyStats, skill.damage) : calcPhysDamage(heroStats, scaledEnemyStats, skill.damage);
      if (result.isDodged) {
        addLog(`${enemy.name} dodged ${skill.name}!`, "dodge");
        showDamageNumber(0, "enemy", false, true);
      } else {
        addLog(`${skill.name} deals ${result.damage} damage!`, result.isCrit ? "critical" : "player");
        showDamageNumber(result.damage, "enemy", result.isCrit);
        shakeTarget("enemy");
        if (skill.effect === "lifesteal") {
          const stolen = Math.floor(result.damage * 0.3);
          healHealth(stolen);
          addLog(`Drained ${stolen} HP!`, "heal");
        }
      }
      const newHealth = Math.max(0, enemyHealth - result.damage);
      setEnemyHealth(newHealth);
      trainSkill(isM ? "magic" : "combat", 6);
      if (newHealth <= 0) { handleVictory(); setCooldowns(prev => ({ ...prev, [skill.id]: skill.cooldown })); return; }
    }
    setCooldowns(prev => ({ ...prev, [skill.id]: skill.cooldown }));
    setPhase("enemy-turn");
    setTimeout(() => handleEnemyTurn(), 1200);
  };

  const onUseItem = (itemId: string) => {
    if (phase !== "player-turn") return;
    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setShowItems(false);
    const itemDef = getItemById(itemId);
    if (!itemDef?.effect) return;
    const removed = removeItemFromInventory(itemId);
    if (!removed) {
      addLog("Item not available!", "system");
      return;
    }
    if (itemDef.effect.type === "heal") {
      healHealth(itemDef.effect.value);
      addLog(`Used ${itemDef.name}, restored ${itemDef.effect.value} HP!`, "heal");
      showDamageNumber(itemDef.effect.value, "hero", false, false, true);
    } else if (itemDef.effect.type === "manaRestore") {
      restoreMana(itemDef.effect.value);
      addLog(`Used ${itemDef.name}, restored ${itemDef.effect.value} MP!`, "heal");
      showDamageNumber(itemDef.effect.value, "hero", false, false, true);
    }
    setPhase("enemy-turn");
    setTimeout(() => handleEnemyTurn(), 1200);
  };

  const handleFlee = () => {
    if (phase !== "player-turn") return;
    doHaptic(Haptics.ImpactFeedbackStyle.Light);
    const fleeChance = (heroStats.speed / (heroStats.speed + scaledEnemyStats.speed)) * 100 + heroStats.luck;
    if (Math.random() * 100 < fleeChance) {
      addLog("You escaped successfully!", "system");
      setPhase("fled");
    } else {
      addLog("Couldn't escape!", "system");
      setPhase("enemy-turn");
      setTimeout(() => handleEnemyTurn(), 1200);
    }
  };

  const handleEnemyTurn = () => {
    const abilities = monsterDef?.abilities || enemy.abilities.map(a => ({
      ...a, type: "physical" as const, manaCost: 0, unlockLevel: 1,
      description: a.name, scaling: { stat: "strength" as const, multiplier: 0.5 },
    }));
    const ability = abilities[Math.floor(Math.random() * abilities.length)];
    const isM = ability.type === "magic";
    const baseDmg = ability.damage;
    const result = isM ? calcMagDamage(scaledEnemyStats, heroStats, baseDmg) : calcPhysDamage(scaledEnemyStats, heroStats, baseDmg);

    if (result.isDodged) {
      addLog(`You dodged ${enemy.name}'s ${ability.name}!`, "dodge");
      showDamageNumber(0, "hero", false, true);
    } else {
      if (result.isCrit) {
        addLog(`${enemy.name} lands a critical ${ability.name} for ${result.damage}!`, "critical");
      } else {
        addLog(`${enemy.name} uses ${ability.name} for ${result.damage} damage!`, "enemy");
      }
      showDamageNumber(result.damage, "hero", result.isCrit);
      shakeTarget("hero");
      doHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      takeDamage(result.damage);
    }

    if (hero.combatStats.currentHealth - result.damage <= 0) {
      handleDefeat();
    } else {
      setCooldowns(prev => {
        const updated: Record<string, number> = {};
        Object.keys(prev).forEach(key => { if (prev[key] > 0) updated[key] = prev[key] - 1; });
        return updated;
      });
      setTurn(prev => prev + 1);
      setPhase("player-turn");
    }
  };

  const handleVictory = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase("victory");

    const drops = monsterDef ? rollDrops(monsterDef.dropTable, heroStats.luck) : [];
    setLoot(drops);
    drops.forEach(d => addItemToInventory(d.itemId, d.quantity));

    const xp = monsterDef ? monsterDef.combatXp + dungeonFloor * 5 : enemy.stats.maxHealth + dungeonFloor * 10;
    const gold = monsterDef
      ? monsterDef.goldRange[0] + Math.floor(Math.random() * (monsterDef.goldRange[1] - monsterDef.goldRange[0]))
      : Math.floor(enemy.stats.maxHealth / 2) + dungeonFloor * 5;

    setExpGained(xp);
    setGoldGained(gold);
    addCombatXp(xp);
    addGold(gold);
    addMonsterKill();

    addLog(`Victory! +${xp} EXP, +${gold} gold!`, "system");
  };

  const handleDefeat = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setPhase("defeat");
    addLog("You have been defeated...", "system");
  };

  const handleContinue = () => { navigation.goBack(); };

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: heroShake.value }], opacity: heroFlash.value,
  }));
  const enemyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: enemyShake.value }], opacity: enemyFlash.value,
  }));

  const healthPct = (current: number, max: number) => Math.max(0, Math.min(100, (current / max) * 100));
  const getHealthColor = (pct: number) => pct > 60 ? GameColors.success : pct > 30 ? "#FF9800" : GameColors.danger;

  const availableSkills = getAvailableSkills();
  const consumables = hero.inventory.filter(i => {
    const def = getItemById(i.itemId);
    return def && def.category === "consumable" && def.effect;
  });

  const enemySprite = ENEMY_SPRITES[enemy.id] || require("../../assets/images/sprites/enemy-clockwork-golem.png");
  const heroHpPct = healthPct(hero.combatStats.currentHealth, hero.combatStats.maxHealth);
  const heroMpPct = healthPct(hero.combatStats.currentMana, hero.combatStats.maxMana);
  const enemyHpPct = healthPct(enemyHealth, scaledEnemyStats.maxHealth);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Image source={require("../../assets/images/dungeon-battle.png")} style={styles.backgroundImage} contentFit="cover" />
      <LinearGradient colors={["rgba(0,0,0,0.3)", "transparent", "rgba(44,36,22,0.4)"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {screenFlash ? <Animated.View entering={FadeIn.duration(50)} style={styles.screenFlash} pointerEvents="none" /> : null}

      <View style={styles.overlay}>
        <View style={styles.combatHeader}>
          <ThemedText style={styles.floorLabel}>Floor {dungeonFloor}</ThemedText>
          <ThemedText style={styles.turnLabel}>Turn {turn}</ThemedText>
        </View>

        <View style={styles.battleStage}>
          <Animated.View style={[styles.enemyArea, enemyAnimatedStyle]} entering={FadeInDown.duration(600)}>
            <ThemedText style={styles.enemyName}>{enemy.name}</ThemedText>
            {enemy.isBoss ? <View style={styles.bossTag}><ThemedText style={styles.bossTagText}>BOSS</ThemedText></View> : null}
            <ThemedText style={styles.levelTag}>Lv. {monsterDef?.baseLevel || dungeonFloor}</ThemedText>
            <View style={styles.enemySpriteContainer}>
              <IdleBreath>
                <Image source={enemySprite} style={styles.enemySpriteImage} contentFit="contain" />
              </IdleBreath>
              <AttackSparks visible={showSparks === "enemy"} target="enemy" />
              {showDamage && showDamage.target === "enemy" ? (
                <Animated.View entering={FadeInUp.duration(400)} style={styles.damagePopup}>
                  <ThemedText style={[styles.damageText, showDamage.isCrit && styles.critDamageText, showDamage.isDodge && styles.dodgeText, showDamage.isHeal && styles.healText]}>
                    {showDamage.isDodge ? "MISS" : showDamage.isHeal ? `+${showDamage.amount}` : `-${showDamage.amount}`}
                  </ThemedText>
                </Animated.View>
              ) : null}
            </View>
            <View style={styles.healthBarOuter}>
              <View style={[styles.healthBarFill, { width: `${enemyHpPct}%`, backgroundColor: getHealthColor(enemyHpPct) }]} />
            </View>
            <ThemedText style={styles.hpText}>{enemyHealth} / {scaledEnemyStats.maxHealth}</ThemedText>
          </Animated.View>

          <View style={styles.vsDivider}>
            <View style={styles.vsLine} />
            <ThemedText style={styles.vsText}>VS</ThemedText>
            <View style={styles.vsLine} />
          </View>

          <Animated.View style={[styles.heroArea, heroAnimatedStyle]} entering={FadeInUp.duration(600)}>
            <View style={styles.heroSpriteContainer}>
              <Image source={HERO_PORTRAIT} style={styles.heroSpriteImage} contentFit="cover" />
              <AttackSparks visible={showSparks === "hero"} target="hero" />
              {showDamage && showDamage.target === "hero" ? (
                <Animated.View entering={FadeInUp.duration(400)} style={styles.damagePopup}>
                  <ThemedText style={[styles.damageText, showDamage.isCrit && styles.critDamageText, showDamage.isDodge && styles.dodgeText, showDamage.isHeal && styles.healText]}>
                    {showDamage.isDodge ? "DODGE" : showDamage.isHeal ? `+${showDamage.amount}` : `-${showDamage.amount}`}
                  </ThemedText>
                </Animated.View>
              ) : null}
            </View>
            <View style={styles.heroStats}>
              <ThemedText style={styles.heroNameLabel}>Lv.{hero.level} Wanderer</ThemedText>
              <View style={styles.healthBarOuter}>
                <View style={[styles.healthBarFill, { width: `${heroHpPct}%`, backgroundColor: getHealthColor(heroHpPct) }]} />
              </View>
              <ThemedText style={styles.hpText}>HP: {hero.combatStats.currentHealth}/{hero.combatStats.maxHealth}</ThemedText>
              <View style={[styles.healthBarOuter, { borderColor: "rgba(52,152,219,0.5)" }]}>
                <View style={[styles.healthBarFill, { width: `${heroMpPct}%`, backgroundColor: "#3498DB" }]} />
              </View>
              <ThemedText style={styles.hpText}>MP: {hero.combatStats.currentMana}/{hero.combatStats.maxMana}</ThemedText>
            </View>
          </Animated.View>
        </View>

        <View style={styles.logContainer}>
          <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
            {combatLog.map((log, index) => (
              <ThemedText key={index} style={[
                styles.logText,
                log.type === "player" && styles.playerLog,
                log.type === "enemy" && styles.enemyLog,
                log.type === "critical" && styles.criticalLog,
                log.type === "system" && styles.systemLog,
                log.type === "dodge" && styles.dodgeLog,
                log.type === "heal" && styles.healLog,
              ]}>{log.text}</ThemedText>
            ))}
          </ScrollView>
        </View>

        {phase === "player-turn" ? (
          <Animated.View entering={FadeInUp} style={[styles.actionPanel, { paddingBottom: insets.bottom + Spacing.sm }]}>
            {showSkills ? (
              <View style={styles.subMenu}>
                <ThemedText style={styles.subMenuTitle}>Skills</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillScroll}>
                  {availableSkills.map((skill) => {
                    const onCd = cooldowns[skill.id] > 0;
                    const noMana = hero.combatStats.currentMana < skill.cost;
                    return (
                      <Pressable
                        key={skill.id}
                        onPress={() => handleSkill(skill)}
                        style={[styles.skillButton, (onCd || noMana) && styles.disabledButton]}
                        disabled={onCd || noMana}
                      >
                        <Feather name={skill.type === "magic" ? "zap" : skill.type === "support" ? "heart" : "crosshair"} size={16}
                          color={onCd || noMana ? GameColors.textSecondary : skill.type === "magic" ? "#9B59B6" : GameColors.accent} />
                        <ThemedText style={styles.skillName}>{skill.name}</ThemedText>
                        {skill.damage > 0 ? <ThemedText style={styles.skillDamage}>DMG: {skill.damage}</ThemedText> : null}
                        <ThemedText style={[styles.skillDamage, { color: noMana ? GameColors.danger : "#3498DB" }]}>{skill.cost} MP</ThemedText>
                        {onCd ? <ThemedText style={styles.cooldownText}>CD: {cooldowns[skill.id]}</ThemedText> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable onPress={() => setShowSkills(false)} style={styles.backBtn}>
                  <ThemedText style={styles.backBtnText}>Back</ThemedText>
                </Pressable>
              </View>
            ) : showItems ? (
              <View style={styles.subMenu}>
                <ThemedText style={styles.subMenuTitle}>Items</ThemedText>
                <ScrollView style={{ maxHeight: 120 }}>
                  {consumables.length > 0 ? consumables.map(inv => {
                    const def = getItemById(inv.itemId)!;
                    return (
                      <Pressable key={inv.itemId} onPress={() => onUseItem(inv.itemId)} style={styles.itemButton}>
                        <View style={styles.itemIcon}>
                          <Feather name={def.effect?.type === "heal" ? "heart" : def.effect?.type === "manaRestore" ? "droplet" : "package"} size={16}
                            color={def.effect?.type === "heal" ? GameColors.success : "#3498DB"} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.itemName}>{def.name} x{inv.quantity}</ThemedText>
                          <ThemedText style={styles.itemDesc}>{def.description}</ThemedText>
                        </View>
                      </Pressable>
                    );
                  }) : <ThemedText style={styles.noItems}>No usable items</ThemedText>}
                </ScrollView>
                <Pressable onPress={() => setShowItems(false)} style={styles.backBtn}>
                  <ThemedText style={styles.backBtnText}>Back</ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.mainActions}>
                <Pressable onPress={handleAttack} style={styles.actionButton} testID="button-attack">
                  <View style={[styles.actionIcon, { backgroundColor: "rgba(212,175,55,0.2)" }]}>
                    <Feather name="crosshair" size={22} color={GameColors.accent} />
                  </View>
                  <ThemedText style={styles.actionText}>Attack</ThemedText>
                </Pressable>
                <Pressable onPress={() => setShowSkills(true)} style={styles.actionButton} testID="button-skills">
                  <View style={[styles.actionIcon, { backgroundColor: "rgba(33,150,243,0.2)" }]}>
                    <Feather name="zap" size={22} color="#2196F3" />
                  </View>
                  <ThemedText style={styles.actionText}>Skills</ThemedText>
                </Pressable>
                <Pressable onPress={() => setShowItems(true)} style={styles.actionButton} testID="button-items">
                  <View style={[styles.actionIcon, { backgroundColor: "rgba(76,175,80,0.2)" }]}>
                    <Feather name="package" size={22} color="#4CAF50" />
                  </View>
                  <ThemedText style={styles.actionText}>Items</ThemedText>
                </Pressable>
                <Pressable onPress={handleFlee} style={styles.actionButton} testID="button-flee">
                  <View style={[styles.actionIcon, { backgroundColor: "rgba(139,37,0,0.2)" }]}>
                    <Feather name="log-out" size={22} color={GameColors.danger} />
                  </View>
                  <ThemedText style={styles.actionText}>Flee</ThemedText>
                </Pressable>
              </View>
            )}
          </Animated.View>
        ) : phase === "enemy-turn" ? (
          <View style={[styles.waitingPanel, { paddingBottom: insets.bottom + Spacing.sm }]}>
            <ThemedText style={styles.waitingText}>{enemy.name} is attacking...</ThemedText>
          </View>
        ) : (
          <Animated.View entering={FadeIn} style={[styles.resultPanel, { paddingBottom: insets.bottom + Spacing.sm }]}>
            {phase === "victory" ? (
              <>
                <Image source={enemySprite} style={styles.resultSprite} contentFit="contain" />
                <ThemedText style={styles.resultTitle}>Victory!</ThemedText>
                <ThemedText style={styles.resultSubtext}>{enemy.name} has been defeated!</ThemedText>
                <ThemedText style={styles.rewardText}>+{expGained} EXP  |  +{goldGained} Gold</ThemedText>
                {loot.length > 0 ? (
                  <View style={styles.lootContainer}>
                    {loot.map((l, i) => {
                      const def = getItemById(l.itemId);
                      return (
                        <ThemedText key={i} style={[styles.lootItemText, def ? { color: RARITY_COLORS[def.rarity] } : null]}>
                          {def?.name || l.itemId} x{l.quantity}
                        </ThemedText>
                      );
                    })}
                  </View>
                ) : null}
              </>
            ) : phase === "defeat" ? (
              <>
                <Image source={HERO_PORTRAIT} style={[styles.resultSprite, styles.defeatSprite]} contentFit="contain" />
                <ThemedText style={styles.resultTitleDefeat}>Defeated...</ThemedText>
                <ThemedText style={styles.resultSubtext}>You wake up back in town, weakened but alive.</ThemedText>
              </>
            ) : (
              <>
                <ThemedText style={styles.resultTitle}>Escaped!</ThemedText>
                <ThemedText style={styles.resultSubtext}>You flee from {enemy.name}.</ThemedText>
              </>
            )}
            <OrnateButton onPress={handleContinue} style={styles.continueBtn}>Continue</OrnateButton>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GameColors.backgroundDark },
  backgroundImage: { position: "absolute", width: "100%", height: "100%" },
  screenFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,200,0.35)", zIndex: 100 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  combatHeader: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: "rgba(44,36,22,0.8)", borderBottomWidth: 1, borderBottomColor: GameColors.primary },
  floorLabel: { fontFamily: GameTypography.caption.fontFamily, fontSize: 12, color: GameColors.parchment, opacity: 0.7 },
  turnLabel: { fontFamily: GameTypography.heading.fontFamily, fontSize: 14, color: GameColors.accent },
  battleStage: { flex: 1, justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  enemyArea: { alignItems: "center" },
  enemyName: { fontFamily: GameTypography.heading.fontFamily, fontSize: 18, color: GameColors.danger, marginBottom: Spacing.xs, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  bossTag: { backgroundColor: GameColors.danger, paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.sm, marginBottom: Spacing.xs },
  bossTagText: { fontFamily: GameTypography.heading.fontFamily, fontSize: 10, color: GameColors.parchment, letterSpacing: 2 },
  levelTag: { fontFamily: GameTypography.caption.fontFamily, fontSize: 11, color: GameColors.parchment, opacity: 0.6, marginBottom: 4 },
  enemySpriteContainer: { width: 140, height: 140, justifyContent: "center", alignItems: "center", marginBottom: Spacing.sm },
  enemySpriteImage: { width: 130, height: 130, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: "rgba(139,37,0,0.6)" },
  heroArea: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.md },
  heroSpriteContainer: { width: 100, height: 120, justifyContent: "center", alignItems: "center" },
  heroSpriteImage: { width: 90, height: 110, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: GameColors.accent },
  heroStats: { flex: 1, maxWidth: 180 },
  heroNameLabel: { fontFamily: GameTypography.heading.fontFamily, fontSize: 14, color: GameColors.accent, marginBottom: Spacing.xs },
  healthBarOuter: { height: 14, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 7, overflow: "hidden", borderWidth: 1, borderColor: "rgba(139,69,19,0.5)", marginBottom: 4 },
  healthBarFill: { height: "100%", borderRadius: 7 },
  hpText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: GameColors.parchment, opacity: 0.8 },
  damagePopup: { position: "absolute", top: -10, right: -10, zIndex: 10 },
  damageText: { fontFamily: GameTypography.display.fontFamily, fontSize: 28, color: GameColors.danger, textShadowColor: "rgba(0,0,0,1)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  critDamageText: { fontSize: 36, color: GameColors.accent },
  dodgeText: { fontSize: 22, color: "#AAAAAA" },
  healText: { fontSize: 28, color: GameColors.success },
  vsDivider: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: Spacing.sm },
  vsLine: { flex: 1, height: 1, backgroundColor: "rgba(212,175,55,0.3)", marginHorizontal: Spacing.md },
  vsText: { fontFamily: GameTypography.display.fontFamily, fontSize: 20, color: GameColors.accent, opacity: 0.7 },
  logContainer: { height: 80, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, backgroundColor: "rgba(0,0,0,0.75)", borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: "rgba(139,69,19,0.3)" },
  logScroll: { flex: 1 },
  logText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 11, marginBottom: 3 },
  playerLog: { color: GameColors.success },
  enemyLog: { color: "#FF6B6B" },
  criticalLog: { color: GameColors.accent, fontFamily: GameTypography.heading.fontFamily },
  systemLog: { color: GameColors.parchment, fontStyle: "italic", opacity: 0.8 },
  dodgeLog: { color: "#AAAAAA", fontStyle: "italic" },
  healLog: { color: "#2ECC71" },
  actionPanel: { backgroundColor: "rgba(44,36,22,0.97)", borderTopWidth: 2, borderTopColor: GameColors.accent, padding: Spacing.md },
  mainActions: { flexDirection: "row", justifyContent: "space-around" },
  actionButton: { alignItems: "center", padding: Spacing.sm, minWidth: 70 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(212,175,55,0.3)", marginBottom: 4 },
  actionText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 11, color: GameColors.parchment },
  subMenu: { alignItems: "center" },
  subMenuTitle: { fontFamily: GameTypography.heading.fontFamily, fontSize: 16, color: GameColors.accent, marginBottom: Spacing.sm },
  skillScroll: { paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  skillButton: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: BorderRadius.md, padding: Spacing.md, minWidth: 100, alignItems: "center", borderWidth: 1, borderColor: GameColors.primary },
  disabledButton: { opacity: 0.4 },
  skillName: { fontFamily: GameTypography.heading.fontFamily, fontSize: 11, color: GameColors.accent, marginTop: 4 },
  skillDamage: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: GameColors.parchment, opacity: 0.7 },
  cooldownText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: GameColors.danger },
  itemButton: { flexDirection: "row", alignItems: "center", gap: Spacing.md, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: GameColors.success, marginBottom: Spacing.xs },
  itemIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(76,175,80,0.2)", justifyContent: "center", alignItems: "center" },
  itemName: { fontFamily: GameTypography.body.fontFamily, fontSize: 13, color: GameColors.parchment },
  itemDesc: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: GameColors.parchment, opacity: 0.5 },
  noItems: { fontFamily: GameTypography.body.fontFamily, fontSize: 14, color: GameColors.parchment, opacity: 0.5, fontStyle: "italic" },
  backBtn: { marginTop: Spacing.md, padding: Spacing.sm },
  backBtnText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 12, color: GameColors.parchment, opacity: 0.6 },
  waitingPanel: { backgroundColor: "rgba(44,36,22,0.97)", borderTopWidth: 2, borderTopColor: GameColors.danger, padding: Spacing.xl, alignItems: "center" },
  waitingText: { fontFamily: GameTypography.heading.fontFamily, fontSize: 16, color: GameColors.danger },
  resultPanel: { backgroundColor: "rgba(44,36,22,0.97)", borderTopWidth: 2, borderTopColor: GameColors.accent, padding: Spacing.xl, alignItems: "center" },
  resultSprite: { width: 80, height: 80, borderRadius: BorderRadius.md, marginBottom: Spacing.md, opacity: 0.6 },
  defeatSprite: { opacity: 0.4 },
  resultTitle: { fontFamily: GameTypography.title.fontFamily, fontSize: 28, color: GameColors.accent, marginBottom: Spacing.xs },
  resultTitleDefeat: { fontFamily: GameTypography.title.fontFamily, fontSize: 28, color: GameColors.danger, marginBottom: Spacing.xs },
  resultSubtext: { fontFamily: GameTypography.body.fontFamily, fontSize: 14, color: GameColors.parchment, opacity: 0.8, marginBottom: Spacing.sm, textAlign: "center" },
  rewardText: { fontFamily: GameTypography.heading.fontFamily, fontSize: 14, color: GameColors.accent, marginBottom: Spacing.sm },
  lootContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  lootItemText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 12, color: GameColors.parchment },
  continueBtn: { marginTop: Spacing.md },
});
