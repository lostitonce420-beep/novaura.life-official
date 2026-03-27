import React, { useState, useEffect, useRef } from "react";
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
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
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
  dungeonFloors,
  EnemyType,
  DungeonEvent,
} from "@/data/steampunkWorld";
import { useGame } from "@/context/GameContext";
import {
  getMonsterForFloor,
  getBossForFloor,
  getFloorTheme,
  RESOURCE_NODES,
  getItemById,
  RARITY_COLORS,
  ResourceNode,
} from "@/data/rpgSystems";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ROOM_IMAGES: Record<string, any> = {
  corridor: require("../../assets/images/sprites/dungeon-corridor.png"),
  treasure: require("../../assets/images/sprites/dungeon-treasure.png"),
  rest: require("../../assets/images/sprites/dungeon-rest.png"),
};

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

function AmbientDust() {
  const particles = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      delay: i * 400,
    }))
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <DustMote key={i} particle={p} />
      ))}
    </View>
  );
}

function DustMote({ particle }: { particle: { x: number; y: number; size: number; delay: number } }) {
  const anim = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      anim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, particle.delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimation(anim);
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.5, 1], [0, 0.4, 0]),
    transform: [
      { translateY: interpolate(anim.value, [0, 1], [0, -20]) },
      { translateX: interpolate(anim.value, [0, 1], [0, 8]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: "rgba(212, 175, 55, 0.3)",
        },
        style,
      ]}
    />
  );
}

function TorchFlicker() {
  const flicker = useSharedValue(0);

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(flicker);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(flicker.value, [0, 1], [0.03, 0.12]),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255, 140, 20, 1)" }, style]}
      pointerEvents="none"
    />
  );
}

interface DungeonScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Dungeon">;
}

type RoomType =
  | "empty"
  | "enemy"
  | "treasure"
  | "trap"
  | "event"
  | "stairs"
  | "boss"
  | "rest"
  | "resource";

interface DungeonRoom {
  id: string;
  type: RoomType;
  explored: boolean;
  content?: EnemyType | DungeonEvent | ResourceNode | string;
}

const getRoomScene = (type: RoomType): any => {
  switch (type) {
    case "treasure":
      return ROOM_IMAGES.treasure;
    case "rest":
      return ROOM_IMAGES.rest;
    default:
      return ROOM_IMAGES.corridor;
  }
};

const getRoomTypeColor = (type: RoomType): string => {
  switch (type) {
    case "enemy": return GameColors.danger;
    case "boss": return "#9C27B0";
    case "treasure": return GameColors.accent;
    case "trap": return "#FF5722";
    case "event": return "#2196F3";
    case "stairs": return GameColors.success;
    case "rest": return "#4CAF50";
    case "resource": return "#00BCD4";
    default: return GameColors.parchment;
  }
};

const getRoomTypeIcon = (type: RoomType): string => {
  switch (type) {
    case "enemy": return "alert-triangle";
    case "boss": return "alert-octagon";
    case "treasure": return "gift";
    case "trap": return "zap-off";
    case "event": return "message-circle";
    case "stairs": return "arrow-down-circle";
    case "rest": return "moon";
    case "resource": return "box";
    default: return "circle";
  }
};

export default function DungeonScreen({ navigation }: DungeonScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    gameState, setDungeonFloor, addItemToInventory, addGold,
    takeDamage, healHealth, restoreMana, trainSkill, fullRestore, getSkillLevel,
  } = useGame();
  const [currentFloor, setCurrentFloor] = useState(gameState.dungeonFloor);
  const [rooms, setRooms] = useState<DungeonRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState(0);
  const [showEvent, setShowEvent] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<DungeonEvent | null>(null);
  const [eventResult, setEventResult] = useState<string | null>(null);
  const [exploredFloors, setExploredFloors] = useState<number[]>([]);
  const miniMapRef = useRef<ScrollView>(null);

  const floorData =
    dungeonFloors.find((f) => f.level === currentFloor) || dungeonFloors[0];
  const floorTheme = getFloorTheme(currentFloor);

  useEffect(() => {
    generateFloor();
  }, [currentFloor]);

  const doHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const generateFloor = () => {
    const roomCount = 5 + Math.floor(currentFloor / 2);
    const newRooms: DungeonRoom[] = [];

    const themeLocationMap: Record<string, string> = {
      "Steam Tunnels": "steam-tunnels",
      "The Gear Works": "gear-works",
      "The Forgotten Depths": "forgotten-depths",
      "The Underforges": "gear-works",
      "The Memory Halls": "memory-halls",
      "The Origin Chamber": "origin-chamber",
    };
    const currentLocation = themeLocationMap[floorTheme?.name || ""] || "steam-tunnels";
    const floorNodes = RESOURCE_NODES.filter(n =>
      n.locations.includes(currentLocation) && currentFloor >= n.levelRequired
    );

    for (let i = 0; i < roomCount; i++) {
      const isLast = i === roomCount - 1;
      const isBossFloor = currentFloor % 5 === 0;

      let type: RoomType;
      if (isLast) {
        type = isBossFloor ? "boss" : "stairs";
      } else if (i === Math.floor(roomCount / 2)) {
        type = "rest";
      } else {
        const roll = Math.random() * 100;
        if (roll < 40) type = "enemy";
        else if (roll < 52) type = "treasure";
        else if (roll < 62) type = "resource";
        else if (roll < 72) type = "trap";
        else if (roll < 85) type = "event";
        else type = "empty";
      }

      let content;
      if (type === "enemy" || type === "boss") {
        const enemies =
          type === "boss" && floorData.boss
            ? [floorData.boss]
            : floorData.enemies;
        content = enemies[Math.floor(Math.random() * enemies.length)];
      } else if (type === "event" && floorData.events.length > 0) {
        content =
          floorData.events[Math.floor(Math.random() * floorData.events.length)];
      } else if (type === "treasure") {
        const loot = floorData.loot;
        content = loot[Math.floor(Math.random() * loot.length)];
      } else if (type === "resource" && floorNodes.length > 0) {
        content = floorNodes[Math.floor(Math.random() * floorNodes.length)];
      }

      newRooms.push({
        id: `room-${currentFloor}-${i}`,
        type,
        explored: i === 0,
        content,
      });
    }

    setRooms(newRooms);
    setCurrentRoom(0);
  };

  const handleExploreRoom = (index: number) => {
    if (index !== currentRoom + 1) return;
    doHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const room = rooms[index];
    setRooms((prev) =>
      prev.map((r, i) => (i === index ? { ...r, explored: true } : r))
    );
    setCurrentRoom(index);

    setTimeout(() => {
      miniMapRef.current?.scrollTo({
        x: Math.max(0, index * 56 - SCREEN_WIDTH / 2 + 28),
        animated: true,
      });
    }, 100);

    switch (room.type) {
      case "enemy":
      case "boss":
        navigation.navigate("Combat", {
          enemy: room.content as EnemyType,
          dungeonFloor: currentFloor,
        });
        break;
      case "event":
        setCurrentEvent(room.content as DungeonEvent);
        setShowEvent(true);
        break;
      case "treasure": {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const goldFound = 10 + currentFloor * 5 + Math.floor(Math.random() * 20);
        addGold(goldFound);
        const treasureItem = room.content as string;
        if (treasureItem) {
          addItemToInventory(treasureItem);
          const itemDef = getItemById(treasureItem);
          setEventResult(`Found ${goldFound} gold and ${itemDef?.name || treasureItem}!`);
        } else {
          setEventResult(`Found ${goldFound} gold!`);
        }
        setTimeout(() => setEventResult(null), 3000);
        break;
      }
      case "resource": {
        const node = room.content as ResourceNode;
        if (node && node.drops && node.drops.length > 0) {
          const skillLvl = getSkillLevel(node.skill);
          if (skillLvl >= node.levelRequired) {
            const drop = node.drops[0];
            const qty = drop.minQty + Math.floor(Math.random() * (drop.maxQty - drop.minQty + 1));
            addItemToInventory(drop.itemId, qty);
            trainSkill(node.skill, node.xpPerGather * qty);
            const itemDef = getItemById(drop.itemId);
            setEventResult(`Gathered ${qty}x ${itemDef?.name || drop.itemId}! (+${node.xpPerGather * qty} ${node.skill} XP)`);
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            setEventResult(`Need ${node.skill} Lv.${node.levelRequired} to gather here.`);
          }
        } else {
          setEventResult("The resource node is depleted.");
        }
        setTimeout(() => setEventResult(null), 3000);
        break;
      }
      case "trap": {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        const trapDmg = 5 + currentFloor * 2;
        takeDamage(trapDmg);
        setEventResult(`Triggered a trap! Lost ${trapDmg} HP.`);
        setTimeout(() => setEventResult(null), 2500);
        break;
      }
      case "stairs":
        setExploredFloors((prev) => [...prev, currentFloor]);
        break;
      case "rest":
        fullRestore();
        setEventResult("Found a safe room. Health and mana fully restored!");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setEventResult(null), 2500);
        break;
    }
  };

  const handleDescend = () => {
    doHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    const nextFloor = currentFloor + 1;
    setCurrentFloor(nextFloor);
    setDungeonFloor(nextFloor);
  };

  const handleEventChoice = (outcome: string) => {
    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setEventResult(outcome);
    setShowEvent(false);
    setTimeout(() => setEventResult(null), 3000);
  };

  const handleReturnToTown = () => {
    navigation.goBack();
  };

  const currentRoomData = rooms[currentRoom];
  const nextRoom =
    currentRoom + 1 < rooms.length ? rooms[currentRoom + 1] : null;
  const canDescend =
    currentRoomData?.explored &&
    currentRoomData.type === "stairs" &&
    currentRoom === rooms.length - 1;

  const getThemeColor = () => {
    if (currentFloor <= 4) return "#8B6914";
    if (currentFloor <= 9) return "#6B4226";
    if (currentFloor <= 19) return "#3D3D6B";
    if (currentFloor <= 29) return "#5B2C6F";
    return "#1A1A2E";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Image
        source={getRoomScene(currentRoomData?.type || "empty")}
        style={styles.sceneImage}
        contentFit="cover"
      />

      <LinearGradient
        colors={[`${getThemeColor()}CC`, "transparent", `${getThemeColor()}AA`]}
        locations={[0, 0.4, 1]}
        style={styles.sceneOverlay}
        pointerEvents="none"
      />

      <TorchFlicker />
      <AmbientDust />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown} style={styles.floorHeader}>
          <View style={styles.floorInfo}>
            <ThemedText style={styles.floorLevel}>
              F{currentFloor}
            </ThemedText>
            <View style={styles.floorNameBox}>
              <ThemedText style={styles.floorName}>
                {floorTheme?.name || floorData.name}
              </ThemedText>
              <ThemedText style={styles.floorDesc}>
                {floorTheme?.description || floorData.description}
              </ThemedText>
            </View>
          </View>
          <View style={styles.heroBarsMini}>
            <View style={styles.miniBarRow}>
              <Feather name="heart" size={10} color="#E74C3C" />
              <View style={styles.miniBarOuter}>
                <View style={[styles.miniBarFill, { width: `${Math.max(0, (gameState.hero.combatStats.currentHealth / gameState.hero.combatStats.maxHealth) * 100)}%`, backgroundColor: "#E74C3C" }]} />
              </View>
              <ThemedText style={styles.miniBarText}>{gameState.hero.combatStats.currentHealth}</ThemedText>
            </View>
            <View style={styles.miniBarRow}>
              <Feather name="droplet" size={10} color="#3498DB" />
              <View style={styles.miniBarOuter}>
                <View style={[styles.miniBarFill, { width: `${Math.max(0, (gameState.hero.combatStats.currentMana / gameState.hero.combatStats.maxMana) * 100)}%`, backgroundColor: "#3498DB" }]} />
              </View>
              <ThemedText style={styles.miniBarText}>{gameState.hero.combatStats.currentMana}</ThemedText>
            </View>
          </View>
        </Animated.View>

        <View style={styles.mainView}>
          {currentRoomData ? (
            <Animated.View
              entering={ZoomIn.duration(400)}
              key={currentRoomData.id}
              style={styles.roomView}
            >
              {currentRoomData.type === "enemy" || currentRoomData.type === "boss" ? (
                <View style={styles.enemyEncounter}>
                  <Image
                    source={
                      ENEMY_SPRITES[(currentRoomData.content as EnemyType)?.id] ||
                      ENEMY_SPRITES["cog-golem"]
                    }
                    style={styles.encounterSprite}
                    contentFit="contain"
                  />
                  <ThemedText style={styles.encounterLabel}>
                    {(currentRoomData.content as EnemyType)?.name || "Enemy"}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.roomCenter}>
                  <View
                    style={[
                      styles.roomTypeIcon,
                      {
                        borderColor: getRoomTypeColor(currentRoomData.type),
                        backgroundColor: `${getRoomTypeColor(currentRoomData.type)}22`,
                      },
                    ]}
                  >
                    <Feather
                      name={getRoomTypeIcon(currentRoomData.type) as any}
                      size={40}
                      color={getRoomTypeColor(currentRoomData.type)}
                    />
                  </View>
                  <ThemedText style={styles.roomTypeLabel}>
                    {currentRoomData.type === "stairs"
                      ? "Stairway Down"
                      : currentRoomData.type === "resource" && currentRoomData.content
                      ? (currentRoomData.content as ResourceNode).name
                      : currentRoomData.type.charAt(0).toUpperCase() +
                        currentRoomData.type.slice(1)}
                  </ThemedText>
                </View>
              )}

              {nextRoom ? (
                <Pressable
                  onPress={() => handleExploreRoom(currentRoom + 1)}
                  style={styles.advanceButton}
                  testID="button-advance"
                >
                  <ThemedText style={styles.advanceText}>
                    Advance Forward
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={24}
                    color={GameColors.accent}
                  />
                </Pressable>
              ) : null}

              {canDescend ? (
                <Pressable onPress={handleDescend} style={styles.descendButton}>
                  <Feather
                    name="arrow-down-circle"
                    size={24}
                    color={GameColors.success}
                  />
                  <ThemedText style={styles.descendText}>
                    Descend to Floor {currentFloor + 1}
                  </ThemedText>
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}
        </View>

        {eventResult ? (
          <Animated.View entering={FadeIn} style={styles.resultBanner}>
            <ThemedText style={styles.resultText}>{eventResult}</ThemedText>
          </Animated.View>
        ) : null}

        <View style={styles.miniMapSection}>
          <ThemedText style={styles.miniMapLabel}>
            Room {currentRoom + 1} / {rooms.length}
          </ThemedText>
          <ScrollView
            ref={miniMapRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.miniMapTrack}
          >
            {rooms.map((room, index) => {
              const isCurrent = index === currentRoom;
              const isNext = index === currentRoom + 1;
              const isExplored = room.explored;

              return (
                <View key={room.id} style={styles.miniMapItem}>
                  <Pressable
                    onPress={() => {
                      if (isNext) handleExploreRoom(index);
                    }}
                    style={[
                      styles.miniMapNode,
                      isExplored && {
                        borderColor: getRoomTypeColor(room.type),
                        backgroundColor: `${getRoomTypeColor(room.type)}33`,
                      },
                      isCurrent && styles.miniMapCurrent,
                      isNext && styles.miniMapNext,
                    ]}
                  >
                    {isExplored ? (
                      <Feather
                        name={getRoomTypeIcon(room.type) as any}
                        size={14}
                        color={getRoomTypeColor(room.type)}
                      />
                    ) : (
                      <ThemedText style={styles.miniMapUnknown}>?</ThemedText>
                    )}
                  </Pressable>
                  {index < rooms.length - 1 ? (
                    <View
                      style={[
                        styles.miniMapLine,
                        isExplored && styles.miniMapLineExplored,
                      ]}
                    />
                  ) : null}
                  {isCurrent ? (
                    <View style={styles.miniMapYou}>
                      <ThemedText style={styles.miniMapYouText}>
                        You
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View
          style={[
            styles.actionBar,
            { paddingBottom: insets.bottom + Spacing.xs },
          ]}
        >
          <View style={styles.progressArea}>
            <View style={styles.progressBarOuter}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${((currentRoom + 1) / rooms.length) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
          <OrnateButton
            onPress={handleReturnToTown}
            variant="secondary"
            size="small"
          >
            Town
          </OrnateButton>
        </View>
      </View>

      {showEvent && currentEvent ? (
        <Animated.View entering={FadeIn} style={styles.eventOverlay}>
          <View style={styles.eventPanel}>
            <View style={styles.eventIcon}>
              <Feather name="book-open" size={28} color={GameColors.accent} />
            </View>
            <ThemedText style={styles.eventTitle}>
              {currentEvent.type === "story"
                ? "Discovery"
                : currentEvent.type.toUpperCase()}
            </ThemedText>
            <ThemedText style={styles.eventDescription}>
              {currentEvent.description}
            </ThemedText>

            {currentEvent.choices ? (
              <View style={styles.eventChoices}>
                {currentEvent.choices.map((choice, idx) => (
                  <OrnateButton
                    key={idx}
                    onPress={() => handleEventChoice(choice.outcome)}
                    variant="secondary"
                    size="small"
                    style={styles.eventChoiceBtn}
                  >
                    {choice.text}
                  </OrnateButton>
                ))}
              </View>
            ) : (
              <OrnateButton onPress={() => setShowEvent(false)}>
                Continue
              </OrnateButton>
            )}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.backgroundDark,
  },
  sceneImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sceneOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
  },
  floorHeader: {
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderBottomWidth: 2,
    borderBottomColor: GameColors.accent,
    padding: Spacing.md,
  },
  floorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  floorLevel: {
    fontFamily: GameTypography.display.fontFamily,
    fontSize: 32,
    color: GameColors.accent,
    marginRight: Spacing.md,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  floorNameBox: {
    flex: 1,
  },
  floorName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.parchment,
  },
  floorDesc: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.7,
  },
  mainView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  roomView: {
    width: "100%",
    alignItems: "center",
  },
  enemyEncounter: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  encounterSprite: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: "rgba(139, 37, 0, 0.6)",
    marginBottom: Spacing.md,
  },
  encounterLabel: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    color: GameColors.danger,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  roomCenter: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  roomTypeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    marginBottom: Spacing.md,
  },
  roomTypeLabel: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 20,
    color: GameColors.parchment,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  advanceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: GameColors.accent,
    gap: Spacing.sm,
  },
  advanceText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.accent,
  },
  descendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: GameColors.success,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  descendText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.success,
  },
  resultBanner: {
    position: "absolute",
    top: "45%",
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: "rgba(212, 175, 55, 0.95)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    zIndex: 10,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  resultText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.backgroundDark,
    textAlign: "center",
  },
  miniMapSection: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 69, 19, 0.4)",
  },
  miniMapLabel: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.parchment,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  miniMapTrack: {
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  miniMapItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniMapNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(139, 69, 19, 0.4)",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  miniMapCurrent: {
    borderColor: GameColors.accent,
    borderWidth: 3,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  miniMapNext: {
    borderColor: GameColors.success,
    borderStyle: "dashed",
  },
  miniMapUnknown: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.5,
  },
  miniMapLine: {
    width: 20,
    height: 2,
    backgroundColor: "rgba(139, 69, 19, 0.3)",
  },
  miniMapLineExplored: {
    backgroundColor: "rgba(212, 175, 55, 0.5)",
  },
  miniMapYou: {
    position: "absolute",
    bottom: -14,
    alignSelf: "center",
    left: 4,
  },
  miniMapYouText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 8,
    color: GameColors.accent,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(44, 36, 22, 0.95)",
    borderTopWidth: 2,
    borderTopColor: GameColors.primary,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  progressArea: {
    flex: 1,
  },
  progressBarOuter: {
    height: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.3)",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: GameColors.accent,
    borderRadius: 5,
  },
  eventOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    zIndex: 100,
  },
  eventPanel: {
    backgroundColor: "rgba(44, 36, 22, 0.97)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: GameColors.accent,
    maxWidth: 320,
    width: "100%",
  },
  eventIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GameColors.accent,
    marginBottom: Spacing.md,
  },
  eventTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 20,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  eventDescription: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  eventChoices: {
    gap: Spacing.sm,
    width: "100%",
  },
  eventChoiceBtn: {
    width: "100%",
  },
  heroBarsMini: {
    marginTop: Spacing.xs,
  },
  miniBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  miniBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 3,
    overflow: "hidden",
  },
  miniBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  miniBarText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 9,
    color: GameColors.parchment,
    opacity: 0.7,
    width: 28,
    textAlign: "right",
  },
});
