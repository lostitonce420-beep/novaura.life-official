import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeIn, FadeInRight, FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  SKILLS,
  ITEMS,
  CRAFTING_RECIPES,
  RARITY_COLORS,
  getItemById,
  levelFromXp,
  xpToNextLevel,
  combatXpForLevel,
  EquipmentSlots,
  Rarity,
} from "@/data/rpgSystems";

const HERO_PORTRAIT = require("../../assets/images/sprites/hero-portrait.png");

type TabType = "stats" | "skills" | "equipment" | "crafting";

interface HeroStatusScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "HeroStatus">;
}

export default function HeroStatusScreen({ navigation }: HeroStatusScreenProps) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { gameState, getEffectiveStats, getAvailableSkills, equipItem, unequipItem, craftItem, getSkillLevel, getItemCount } = useGame();
  const [activeTab, setActiveTab] = useState<TabType>("stats");

  const hero = gameState.hero;
  const effectiveStats = getEffectiveStats();
  const xpInfo = xpToNextLevel(hero.experience);

  const doHaptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <Pressable
      key={tab}
      onPress={() => { setActiveTab(tab); doHaptic(); }}
      style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
    >
      <Feather name={icon as any} size={16} color={activeTab === tab ? GameColors.accent : GameColors.parchment} />
      <ThemedText style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{label}</ThemedText>
    </Pressable>
  );

  const rarityColor = (rarity: Rarity) => RARITY_COLORS[rarity] || GameColors.parchment;

  const renderStatsTab = () => {
    const statRows = [
      { label: "HP", value: `${hero.combatStats.currentHealth}/${hero.combatStats.maxHealth}`, icon: "heart", color: "#E74C3C" },
      { label: "Mana", value: `${hero.combatStats.currentMana}/${hero.combatStats.maxMana}`, icon: "droplet", color: "#3498DB" },
      { label: "ATK", value: effectiveStats.attack, icon: "crosshair", color: "#E67E22" },
      { label: "DEF", value: effectiveStats.defense, icon: "shield", color: "#3498DB" },
      { label: "Sp.ATK", value: effectiveStats.specialAttack, icon: "zap", color: "#9B59B6" },
      { label: "Sp.DEF", value: effectiveStats.specialDefense, icon: "shield", color: "#8E44AD" },
      { label: "ACC", value: effectiveStats.accuracy, icon: "target", color: "#E67E22" },
      { label: "DEX", value: effectiveStats.dexterity, icon: "activity", color: "#2ECC71" },
      { label: "STR", value: effectiveStats.strength, icon: "trending-up", color: "#E74C3C" },
      { label: "LCK", value: effectiveStats.luck, icon: "star", color: "#F39C12" },
      { label: "DGE", value: effectiveStats.dodge, icon: "wind", color: "#1ABC9C" },
      { label: "M.PWR", value: effectiveStats.magicPower, icon: "zap", color: "#8E44AD" },
      { label: "M.DEF", value: effectiveStats.magicDefense, icon: "shield", color: "#9B59B6" },
      { label: "SPD", value: effectiveStats.speed, icon: "fast-forward", color: "#2ECC71" },
      { label: "CRIT", value: `${effectiveStats.critChance}%`, icon: "alert-triangle", color: "#F39C12" },
    ];

    return (
      <Animated.View entering={FadeIn}>
        <View style={styles.statsGrid}>
          {statRows.map((stat, i) => (
            <Animated.View key={stat.label} entering={FadeInRight.delay(i * 30)} style={styles.statItem}>
              <Feather name={stat.icon as any} size={14} color={stat.color} />
              <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
              <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
            </Animated.View>
          ))}
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Combat Abilities</ThemedText>
          {getAvailableSkills().length > 0 ? (
            getAvailableSkills().map((skill) => (
              <View key={skill.id} style={styles.skillRow}>
                <Feather name={skill.type === "magic" ? "zap" : skill.type === "support" ? "heart" : "crosshair"} size={14} color={skill.type === "magic" ? "#9B59B6" : skill.type === "support" ? "#2ECC71" : GameColors.accent} />
                <View style={styles.skillInfo}>
                  <ThemedText style={styles.skillNameText}>{skill.name}</ThemedText>
                  <ThemedText style={styles.skillDesc}>{skill.description}</ThemedText>
                </View>
                <View style={styles.skillMeta}>
                  {skill.damage > 0 ? <ThemedText style={styles.skillDmg}>{skill.damage} DMG</ThemedText> : null}
                  <ThemedText style={styles.skillCost}>{skill.cost} MP</ThemedText>
                </View>
              </View>
            ))
          ) : (
            <ThemedText style={styles.emptyText}>Level up to unlock abilities</ThemedText>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderSkillsTab = () => (
    <Animated.View entering={FadeIn}>
      <View style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Training Skills</ThemedText>
        {SKILLS.map((skill, i) => {
          const xp = hero.skills[skill.id] || 0;
          const lvl = levelFromXp(xp);
          const prog = xpToNextLevel(xp);
          return (
            <Animated.View key={skill.id} entering={FadeInRight.delay(i * 40)} style={styles.trainingRow}>
              <View style={styles.trainingIcon}>
                <Feather name={skill.icon as any} size={16} color={GameColors.accent} />
              </View>
              <View style={styles.trainingInfo}>
                <View style={styles.trainingHeader}>
                  <ThemedText style={styles.trainingName}>{skill.name}</ThemedText>
                  <ThemedText style={styles.trainingLevel}>Lv. {lvl}</ThemedText>
                </View>
                <View style={styles.xpBar}>
                  <View style={[styles.xpFill, { width: `${Math.min(100, prog.progress * 100)}%` }]} />
                </View>
                <ThemedText style={styles.xpText}>{prog.current} / {prog.needed} XP</ThemedText>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderEquipmentTab = () => {
    const slots: { key: keyof EquipmentSlots; label: string; icon: string }[] = [
      { key: "weapon", label: "Weapon", icon: "crosshair" },
      { key: "offhand", label: "Off-hand", icon: "shield" },
      { key: "helmet", label: "Helmet", icon: "hard-hat" as any },
      { key: "body", label: "Body", icon: "layers" },
      { key: "legs", label: "Legs", icon: "minus" },
      { key: "boots", label: "Boots", icon: "navigation" },
      { key: "gloves", label: "Gloves", icon: "hand" as any },
      { key: "cape", label: "Cape", icon: "wind" },
      { key: "amulet", label: "Amulet", icon: "disc" },
      { key: "ring", label: "Ring", icon: "circle" },
    ];

    const equipableItems = hero.inventory.filter(inv => {
      const def = getItemById(inv.itemId);
      return def && def.equipSlot;
    });

    return (
      <Animated.View entering={FadeIn}>
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Equipped</ThemedText>
          {slots.map((slot) => {
            const equippedId = hero.equipment[slot.key];
            const itemDef = equippedId ? getItemById(equippedId) : null;
            return (
              <Pressable
                key={slot.key}
                style={styles.equipRow}
                onPress={() => { if (equippedId) { unequipItem(slot.key); doHaptic(); } }}
              >
                <Feather name={slot.icon as any} size={14} color={GameColors.accent} />
                <ThemedText style={styles.equipSlot}>{slot.label}</ThemedText>
                <ThemedText style={[styles.equipItemName, itemDef ? { color: rarityColor(itemDef.rarity) } : null]}>
                  {itemDef ? itemDef.name : "Empty"}
                </ThemedText>
                {equippedId ? <Feather name="x" size={12} color={GameColors.danger} /> : null}
              </Pressable>
            );
          })}
        </View>

        {equipableItems.length > 0 ? (
          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Equip from Inventory</ThemedText>
            {equipableItems.map((inv) => {
              const def = getItemById(inv.itemId)!;
              return (
                <Pressable
                  key={inv.itemId}
                  style={styles.equipRow}
                  onPress={() => { equipItem(inv.itemId); doHaptic(); }}
                >
                  <View style={[styles.rarityDot, { backgroundColor: rarityColor(def.rarity) }]} />
                  <ThemedText style={[styles.equipItemName, { color: rarityColor(def.rarity), flex: 1 }]}>{def.name}</ThemedText>
                  <ThemedText style={styles.equipSlot}>x{inv.quantity}</ThemedText>
                  <Feather name="chevron-right" size={14} color={GameColors.accent} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Inventory</ThemedText>
          <View style={styles.goldRow}>
            <Feather name="dollar-sign" size={16} color={GameColors.accent} />
            <ThemedText style={styles.goldText}>{hero.gold} Gold</ThemedText>
          </View>
          {hero.inventory.length > 0 ? (
            hero.inventory.map((inv) => {
              const def = getItemById(inv.itemId);
              return (
                <View key={inv.itemId} style={styles.inventoryRow}>
                  <View style={[styles.rarityDot, { backgroundColor: rarityColor(def?.rarity || "common") }]} />
                  <ThemedText style={styles.invItemName}>{def?.name || inv.itemId}</ThemedText>
                  <ThemedText style={styles.invQty}>x{inv.quantity}</ThemedText>
                </View>
              );
            })
          ) : (
            <ThemedText style={styles.emptyText}>Inventory is empty</ThemedText>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderCraftingTab = () => {
    const availableRecipes = CRAFTING_RECIPES.filter(r => {
      const lvl = getSkillLevel(r.skill);
      return lvl >= r.levelRequired;
    });

    const lockedRecipes = CRAFTING_RECIPES.filter(r => {
      const lvl = getSkillLevel(r.skill);
      return lvl < r.levelRequired && lvl >= r.levelRequired - 10;
    });

    return (
      <Animated.View entering={FadeIn}>
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Available Recipes</ThemedText>
          {availableRecipes.length > 0 ? (
            availableRecipes.map((recipe) => {
              const resultDef = getItemById(recipe.resultItemId);
              const canCraft = recipe.ingredients.every(ing => getItemCount(ing.itemId) >= ing.quantity);
              return (
                <Pressable
                  key={recipe.id}
                  style={[styles.recipeRow, !canCraft && styles.recipeLocked]}
                  onPress={() => { if (canCraft) { craftItem(recipe.id); doHaptic(); } }}
                  disabled={!canCraft}
                >
                  <View style={styles.recipeInfo}>
                    <ThemedText style={[styles.recipeName, { color: rarityColor(resultDef?.rarity || "common") }]}>
                      {recipe.name}
                    </ThemedText>
                    <ThemedText style={styles.recipeSkill}>
                      {SKILLS.find(s => s.id === recipe.skill)?.name} Lv.{recipe.levelRequired} | +{recipe.xpGained} XP
                    </ThemedText>
                    <View style={styles.ingredientList}>
                      {recipe.ingredients.map((ing) => {
                        const ingDef = getItemById(ing.itemId);
                        const have = getItemCount(ing.itemId);
                        return (
                          <ThemedText key={ing.itemId} style={[styles.ingredientText, have < ing.quantity && styles.ingredientMissing]}>
                            {ingDef?.name || ing.itemId} ({have}/{ing.quantity})
                          </ThemedText>
                        );
                      })}
                    </View>
                  </View>
                  {canCraft ? <Feather name="plus-circle" size={20} color={GameColors.success} /> : null}
                </Pressable>
              );
            })
          ) : (
            <ThemedText style={styles.emptyText}>Train skills to unlock recipes</ThemedText>
          )}
        </View>

        {lockedRecipes.length > 0 ? (
          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Upcoming Recipes</ThemedText>
            {lockedRecipes.map((recipe) => (
              <View key={recipe.id} style={[styles.recipeRow, styles.recipeLocked]}>
                <View style={styles.recipeInfo}>
                  <ThemedText style={styles.recipeName}>{recipe.name}</ThemedText>
                  <ThemedText style={styles.recipeSkill}>
                    Requires {SKILLS.find(s => s.id === recipe.skill)?.name} Lv.{recipe.levelRequired}
                  </ThemedText>
                </View>
                <Feather name="lock" size={16} color={GameColors.textSecondary} />
              </View>
            ))}
          </View>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + 100 }]}
    >
      <Animated.View entering={FadeIn} style={styles.heroCard}>
        <Image source={HERO_PORTRAIT} style={styles.heroPortrait} contentFit="cover" />
        <View style={styles.heroInfo}>
          <ThemedText style={styles.heroName}>The Wanderer</ThemedText>
          <ThemedText style={styles.heroLevel}>Level {hero.level}</ThemedText>
          <View style={styles.expBar}>
            <View style={[styles.expFill, { width: `${Math.min(100, xpInfo.progress * 100)}%` }]} />
          </View>
          <ThemedText style={styles.expText}>
            {xpInfo.current} / {xpInfo.needed} EXP
          </ThemedText>
          <View style={styles.heroMeta}>
            <View style={styles.metaBadge}>
              <Feather name="dollar-sign" size={12} color={GameColors.accent} />
              <ThemedText style={styles.metaText}>{hero.gold}</ThemedText>
            </View>
            <View style={styles.metaBadge}>
              <Feather name="package" size={12} color={GameColors.parchment} />
              <ThemedText style={styles.metaText}>{hero.inventory.length}</ThemedText>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.tabBar}>
        {renderTabButton("stats", "Stats", "bar-chart-2")}
        {renderTabButton("skills", "Skills", "book")}
        {renderTabButton("equipment", "Gear", "briefcase")}
        {renderTabButton("crafting", "Craft", "settings")}
      </View>

      {activeTab === "stats" ? renderStatsTab() : null}
      {activeTab === "skills" ? renderSkillsTab() : null}
      {activeTab === "equipment" ? renderEquipmentTab() : null}
      {activeTab === "crafting" ? renderCraftingTab() : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GameColors.backgroundDark },
  content: { padding: Spacing.lg },
  heroCard: {
    flexDirection: "row",
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  heroPortrait: {
    width: 80, height: 100, borderRadius: BorderRadius.md,
    marginRight: Spacing.lg, borderWidth: 2, borderColor: GameColors.accent,
  },
  heroInfo: { flex: 1, justifyContent: "center" },
  heroName: { fontFamily: GameTypography.heading.fontFamily, fontSize: 20, color: GameColors.accent },
  heroLevel: { fontFamily: GameTypography.caption.fontFamily, fontSize: 14, color: GameColors.parchment, marginBottom: Spacing.xs },
  expBar: { height: 8, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 4, overflow: "hidden", marginBottom: 4 },
  expFill: { height: "100%", backgroundColor: "#9B59B6", borderRadius: 4 },
  expText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: GameColors.parchment, opacity: 0.7 },
  heroMeta: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.xs },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 12, color: GameColors.parchment },
  tabBar: {
    flexDirection: "row", backgroundColor: "rgba(44,36,22,0.9)", borderRadius: BorderRadius.md,
    padding: 4, marginBottom: Spacing.md, borderWidth: 1, borderColor: GameColors.primary,
  },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
  tabBtnActive: { backgroundColor: "rgba(212,175,55,0.2)" },
  tabLabel: { fontFamily: GameTypography.caption.fontFamily, fontSize: 11, color: GameColors.parchment, opacity: 0.6 },
  tabLabelActive: { color: GameColors.accent, opacity: 1 },
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap", backgroundColor: "rgba(44,36,22,0.9)",
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: GameColors.primary,
  },
  statItem: { width: "33.3%", alignItems: "center", paddingVertical: Spacing.sm, gap: 2 },
  statValue: { fontFamily: GameTypography.heading.fontFamily, fontSize: 16, color: GameColors.parchment },
  statLabel: { fontFamily: GameTypography.caption.fontFamily, fontSize: 9, color: GameColors.parchment, opacity: 0.6 },
  card: {
    backgroundColor: "rgba(44,36,22,0.9)", borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: GameColors.primary,
  },
  sectionTitle: { fontFamily: GameTypography.heading.fontFamily, fontSize: 16, color: GameColors.accent, marginBottom: Spacing.md },
  skillRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: "rgba(212,175,55,0.1)" },
  skillInfo: { flex: 1 },
  skillNameText: { fontFamily: GameTypography.heading.fontFamily, fontSize: 13, color: GameColors.parchment },
  skillDesc: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: GameColors.parchment, opacity: 0.6 },
  skillMeta: { alignItems: "flex-end" },
  skillDmg: { fontFamily: GameTypography.caption.fontFamily, fontSize: 11, color: GameColors.accent },
  skillCost: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: "#3498DB" },
  trainingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: "rgba(212,175,55,0.1)" },
  trainingIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(212,175,55,0.15)", justifyContent: "center", alignItems: "center" },
  trainingInfo: { flex: 1 },
  trainingHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  trainingName: { fontFamily: GameTypography.heading.fontFamily, fontSize: 13, color: GameColors.parchment },
  trainingLevel: { fontFamily: GameTypography.heading.fontFamily, fontSize: 13, color: GameColors.accent },
  xpBar: { height: 6, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 3, overflow: "hidden", marginBottom: 2 },
  xpFill: { height: "100%", backgroundColor: "#2ECC71", borderRadius: 3 },
  xpText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 9, color: GameColors.parchment, opacity: 0.5 },
  equipRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: "rgba(212,175,55,0.1)" },
  equipSlot: { fontFamily: GameTypography.caption.fontFamily, fontSize: 11, color: GameColors.parchment, opacity: 0.6, width: 60 },
  equipItemName: { fontFamily: GameTypography.body.fontFamily, fontSize: 13, color: GameColors.parchment, flex: 1 },
  rarityDot: { width: 8, height: 8, borderRadius: 4 },
  goldRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  goldText: { fontFamily: GameTypography.heading.fontFamily, fontSize: 16, color: GameColors.accent },
  inventoryRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: 6 },
  invItemName: { fontFamily: GameTypography.body.fontFamily, fontSize: 13, color: GameColors.parchment, flex: 1 },
  invQty: { fontFamily: GameTypography.caption.fontFamily, fontSize: 12, color: GameColors.parchment, opacity: 0.6 },
  recipeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: "rgba(212,175,55,0.1)" },
  recipeLocked: { opacity: 0.4 },
  recipeInfo: { flex: 1 },
  recipeName: { fontFamily: GameTypography.heading.fontFamily, fontSize: 13, color: GameColors.parchment },
  recipeSkill: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: GameColors.parchment, opacity: 0.6, marginTop: 2 },
  ingredientList: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: 4 },
  ingredientText: { fontFamily: GameTypography.caption.fontFamily, fontSize: 10, color: GameColors.success },
  ingredientMissing: { color: GameColors.danger },
  emptyText: { fontFamily: GameTypography.body.fontFamily, fontSize: 13, color: GameColors.parchment, opacity: 0.4, fontStyle: "italic" },
});
