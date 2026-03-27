import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import Animated, {
  FadeIn,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
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
import {
  townBuildings,
  TownNPC,
  ShopItem,
  InteriorObject,
} from "@/data/steampunkWorld";
import { useGame } from "@/context/GameContext";
import { getItemById } from "@/data/rpgSystems";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const NPC_PORTRAITS: Record<string, any> = {
  "town-crier": require("../../assets/images/sprites/npc-shopkeeper.png"),
  shopkeeper: require("../../assets/images/sprites/npc-shopkeeper.png"),
  blacksmith: require("../../assets/images/sprites/npc-blacksmith.png"),
  barkeep: require("../../assets/images/sprites/npc-bartender.png"),
  veteran: require("../../assets/images/sprites/npc-guildmaster.png"),
  guildmaster: require("../../assets/images/sprites/npc-guildmaster.png"),
  "gate-guard": require("../../assets/images/sprites/npc-guildmaster.png"),
  lord: require("../../assets/images/sprites/npc-bartender.png"),
};

const BUILDING_SPRITES: Record<string, any> = {
  "town-square": require("../../assets/images/sprites/building-town-square.png"),
  "general-store": require("../../assets/images/sprites/building-general-store.png"),
  blacksmith: require("../../assets/images/sprites/building-blacksmith.png"),
  tavern: require("../../assets/images/sprites/building-tavern.png"),
  "guild-hall": require("../../assets/images/sprites/building-guild.png"),
  "dungeon-entrance": require("../../assets/images/sprites/building-dungeon.png"),
  mansion: require("../../assets/images/sprites/building-manor.png"),
};

function WarmGlow() {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(glow);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.02, 0.08]),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255, 200, 100, 1)" }, style]}
      pointerEvents="none"
    />
  );
}

interface BuildingInteriorScreenProps {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "BuildingInterior"
  >;
  route: RouteProp<RootStackParamList, "BuildingInterior">;
}

type InteractionMode = "explore" | "dialogue" | "shop" | "examine";

export default function BuildingInteriorScreen({
  navigation,
  route,
}: BuildingInteriorScreenProps) {
  const { buildingId } = route.params;
  const insets = useSafeAreaInsets();
  const { gameState, buyItem, sellItem, hasItem, getItemCount } = useGame();

  const building = townBuildings.find((b) => b.id === buildingId);

  const [mode, setMode] = useState<InteractionMode>("explore");
  const [selectedNPC, setSelectedNPC] = useState<TownNPC | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [discoveredMemory, setDiscoveredMemory] = useState<string | null>(null);

  if (!building) {
    return (
      <View style={styles.container}>
        <ThemedText>Building not found</ThemedText>
      </View>
    );
  }

  const doHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const handleTalkToNPC = (npc: TownNPC) => {
    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedNPC(npc);
    setMode("dialogue");
    setCurrentTopic(null);
    setShowShop(false);
  };

  const handleSelectTopic = (topicId: string) => {
    doHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTopic(topicId);

    const topic = selectedNPC?.dialogue.topics.find((t) => t.id === topicId);
    if (topic?.revealsMemory) {
      setTimeout(() => {
        setDiscoveredMemory(topic.revealsMemory!);
      }, 1500);
    }

    if (topicId === "shop" && selectedNPC?.shopInventory) {
      setShowShop(true);
    }
  };

  const handleExamineObject = (obj: InteriorObject) => {
    doHaptic(Haptics.ImpactFeedbackStyle.Medium);

    if (obj.result.type === "memory") {
      setDiscoveredMemory(obj.result.value as string);
    }
  };

  const [buyFeedback, setBuyFeedback] = useState<string | null>(null);

  const handleBuyItem = (item: ShopItem) => {
    if (gameState.hero.gold < item.price) {
      setBuyFeedback("Not enough gold!");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setBuyFeedback(null), 1500);
      return;
    }
    const success = buyItem(item.id, item.price);
    if (success) {
      setBuyFeedback(`Bought ${item.name}!`);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setBuyFeedback("Purchase failed!");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setTimeout(() => setBuyFeedback(null), 1500);
  };

  const handleBackToExplore = () => {
    setMode("explore");
    setSelectedNPC(null);
    setCurrentTopic(null);
    setShowShop(false);
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const dismissMemory = () => {
    setDiscoveredMemory(null);
  };

  const currentResponse = currentTopic
    ? selectedNPC?.dialogue.topics.find((t) => t.id === currentTopic)?.response
    : selectedNPC?.dialogue.greeting;

  const npcPortrait = selectedNPC
    ? NPC_PORTRAITS[selectedNPC.id] || NPC_PORTRAITS["town-crier"]
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Image
        source={require("../../assets/images/building-interior.png")}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      <LinearGradient
        colors={["rgba(44, 36, 22, 0.6)", "transparent", "rgba(44, 36, 22, 0.7)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <WarmGlow />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Pressable onPress={handleExit} style={styles.backButton}>
            <Feather
              name="arrow-left"
              size={24}
              color={GameColors.parchment}
            />
          </Pressable>
          <Image
            source={BUILDING_SPRITES[buildingId]}
            style={styles.headerThumb}
            contentFit="contain"
          />
          <ThemedText style={styles.locationName}>{building.name}</ThemedText>
        </View>

        {mode === "explore" ? (
          <ScrollView
            contentContainerStyle={[
              styles.exploreContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={FadeIn.delay(100)}
              style={styles.section}
            >
              <ThemedText style={styles.sectionTitle}>People Here</ThemedText>
              {building.interior.npcs.length > 0 ? (
                building.interior.npcs.map((npc, index) => (
                  <Animated.View
                    key={npc.id}
                    entering={FadeInRight.delay(index * 100)}
                  >
                    <Pressable
                      onPress={() => handleTalkToNPC(npc)}
                      style={styles.npcCard}
                      testID={`npc-${npc.id}`}
                    >
                      <Image
                        source={
                          NPC_PORTRAITS[npc.id] || NPC_PORTRAITS["town-crier"]
                        }
                        style={styles.npcPortrait}
                        contentFit="cover"
                      />
                      <View style={styles.npcInfo}>
                        <ThemedText style={styles.npcName}>
                          {npc.name}
                        </ThemedText>
                        <ThemedText style={styles.npcRole}>
                          {npc.role}
                        </ThemedText>
                      </View>
                      <View style={styles.talkBadge}>
                        <Feather
                          name="message-circle"
                          size={16}
                          color={GameColors.accent}
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>
                  No one here right now
                </ThemedText>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeIn.delay(200)}
              style={styles.section}
            >
              <ThemedText style={styles.sectionTitle}>
                Things to Examine
              </ThemedText>
              {building.interior.interactables.length > 0 ? (
                building.interior.interactables.map((obj, index) => (
                  <Animated.View
                    key={obj.id}
                    entering={FadeInRight.delay(100 + index * 50)}
                  >
                    <Pressable
                      onPress={() => handleExamineObject(obj)}
                      style={styles.objectCard}
                    >
                      <View style={styles.objectIcon}>
                        <Feather
                          name="search"
                          size={18}
                          color={GameColors.accent}
                        />
                      </View>
                      <View style={styles.objectInfo}>
                        <ThemedText style={styles.objectName}>
                          {obj.name}
                        </ThemedText>
                        <ThemedText style={styles.objectDesc}>
                          {obj.description}
                        </ThemedText>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>
                  Nothing of interest
                </ThemedText>
              )}
            </Animated.View>
          </ScrollView>
        ) : mode === "dialogue" && selectedNPC ? (
          <View style={styles.dialogueContainer}>
            <View style={styles.dialogueBox}>
              <View style={styles.speakerHeader}>
                <Image
                  source={npcPortrait}
                  style={styles.speakerPortrait}
                  contentFit="cover"
                />
                <View style={styles.speakerInfo}>
                  <ThemedText style={styles.speakerName}>
                    {selectedNPC.name}
                  </ThemedText>
                  <ThemedText style={styles.speakerRole}>
                    {selectedNPC.role}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.dialogueText}>
                "{currentResponse}"
              </ThemedText>
            </View>

            {showShop && selectedNPC.shopInventory ? (
              <Animated.View
                entering={FadeIn}
                style={styles.shopContainer}
              >
                <View style={styles.shopHeader}>
                  <ThemedText style={styles.shopTitle}>
                    Available Items
                  </ThemedText>
                  <View style={styles.goldBadge}>
                    <Feather name="dollar-sign" size={14} color={GameColors.accent} />
                    <ThemedText style={styles.goldBadgeText}>{gameState.hero.gold}</ThemedText>
                  </View>
                </View>
                {buyFeedback ? (
                  <Animated.View entering={FadeIn} style={styles.feedbackBanner}>
                    <ThemedText style={[styles.feedbackText, buyFeedback.includes("Not") && styles.feedbackError]}>{buyFeedback}</ThemedText>
                  </Animated.View>
                ) : null}
                <ScrollView style={styles.shopList}>
                  {selectedNPC.shopInventory.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleBuyItem(item)}
                      style={styles.shopItem}
                    >
                      <View style={styles.shopItemInfo}>
                        <ThemedText style={styles.shopItemName}>
                          {item.name}
                        </ThemedText>
                        <ThemedText style={styles.shopItemDesc}>
                          {item.description}
                        </ThemedText>
                        {item.stats ? (
                          <View style={styles.itemStats}>
                            {item.stats.attack ? (
                              <ThemedText style={styles.statText}>
                                ATK +{item.stats.attack}
                              </ThemedText>
                            ) : null}
                            {item.stats.defense ? (
                              <ThemedText style={styles.statText}>
                                DEF +{item.stats.defense}
                              </ThemedText>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.priceTag}>
                        <Feather
                          name="dollar-sign"
                          size={12}
                          color={GameColors.accent}
                        />
                        <ThemedText style={styles.priceText}>
                          {item.price}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
                <OrnateButton
                  onPress={() => setShowShop(false)}
                  variant="secondary"
                >
                  Done Shopping
                </OrnateButton>
              </Animated.View>
            ) : (
              <ScrollView
                style={styles.topicsContainer}
                showsVerticalScrollIndicator={false}
              >
                <ThemedText style={styles.topicsTitle}>
                  What would you like to discuss?
                </ThemedText>
                {selectedNPC.dialogue.topics.map((topic) => (
                  <Pressable
                    key={topic.id}
                    onPress={() => handleSelectTopic(topic.id)}
                    style={[
                      styles.topicButton,
                      currentTopic === topic.id && styles.selectedTopic,
                    ]}
                  >
                    <ThemedText style={styles.topicText}>
                      {topic.prompt}
                    </ThemedText>
                    <Feather
                      name="chevron-right"
                      size={16}
                      color={GameColors.accent}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <OrnateButton
              onPress={handleBackToExplore}
              style={styles.backExploreButton}
            >
              Back
            </OrnateButton>
          </View>
        ) : null}

        {discoveredMemory ? (
          <Animated.View entering={FadeIn} style={styles.memoryOverlay}>
            <View style={styles.memoryPanel}>
              <View style={styles.memoryIcon}>
                <Feather name="eye" size={32} color="#B8A9C9" />
              </View>
              <ThemedText style={styles.memoryTitle}>
                Memory Fragment
              </ThemedText>
              <ThemedText style={styles.memoryText}>
                {discoveredMemory}
              </ThemedText>
              <OrnateButton onPress={dismissMemory}>Remember</OrnateButton>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.backgroundDark,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: GameColors.accent,
    backgroundColor: "rgba(44, 36, 22, 0.92)",
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerThumb: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  locationName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    color: GameColors.accent,
    flex: 1,
  },
  exploreContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.accent,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.3)",
    paddingBottom: Spacing.xs,
  },
  npcCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(44, 36, 22, 0.92)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  npcPortrait: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  npcInfo: {
    flex: 1,
  },
  npcName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.parchment,
  },
  npcRole: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.7,
  },
  talkBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  objectCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(44, 36, 22, 0.85)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: GameColors.primary,
    gap: Spacing.md,
  },
  objectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  objectInfo: {
    flex: 1,
  },
  objectName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
    marginBottom: 4,
  },
  objectDesc: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.8,
  },
  emptyText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    opacity: 0.5,
    fontStyle: "italic",
  },
  dialogueContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  dialogueBox: {
    backgroundColor: "rgba(44, 36, 22, 0.97)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: GameColors.accent,
    marginBottom: Spacing.lg,
  },
  speakerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  speakerPortrait: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    color: GameColors.accent,
  },
  speakerRole: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.7,
  },
  dialogueText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    lineHeight: 22,
    fontStyle: "italic",
  },
  topicsContainer: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  topicsTitle: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.6,
    marginBottom: Spacing.sm,
  },
  topicButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(44, 36, 22, 0.85)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  selectedTopic: {
    borderColor: GameColors.accent,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
  },
  topicText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    flex: 1,
  },
  backExploreButton: {
    marginTop: "auto",
  },
  shopContainer: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  shopTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  shopList: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  shopItem: {
    flexDirection: "row",
    backgroundColor: "rgba(44, 36, 22, 0.85)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: GameColors.primary,
    alignItems: "center",
  },
  shopItemInfo: {
    flex: 1,
  },
  shopItemName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
  },
  shopItemDesc: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.8,
    marginTop: 2,
  },
  itemStats: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  statText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.success,
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  priceText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
  },
  memoryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    zIndex: 100,
  },
  memoryPanel: {
    backgroundColor: "rgba(44, 36, 22, 0.97)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#B8A9C9",
    maxWidth: 320,
  },
  memoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(184, 169, 201, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B8A9C9",
    marginBottom: Spacing.md,
  },
  memoryTitle: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 20,
    color: "#B8A9C9",
    marginBottom: Spacing.lg,
  },
  memoryText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: Spacing.lg,
  },
  shopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  goldBadgeText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
  },
  feedbackBanner: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: "center",
  },
  feedbackText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 13,
    color: GameColors.success,
  },
  feedbackError: {
    color: GameColors.danger,
  },
});
