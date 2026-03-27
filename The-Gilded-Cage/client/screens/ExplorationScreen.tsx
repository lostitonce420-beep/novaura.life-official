import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, ImageBackground, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { useGame } from "@/context/GameContext";
import { locations, getNextMainQuest, getAvailableSideQuests, getLocationById } from "@/data/quests";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width } = Dimensions.get("window");

interface ExplorationScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Exploration">;
}

export default function ExplorationScreen({ navigation }: ExplorationScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { 
    gameState, 
    setCurrentLocation, 
    characters, 
    getAffinityLevel,
    startQuest,
    getCharacterPortrait
  } = useGame();

  const currentLocation = getLocationById(gameState.currentLocation) || locations[0];
  const nextMainQuest = getNextMainQuest(gameState.completedQuests);

  const handleLocationChange = (locationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (locationId === "hotsprings") {
      navigation.navigate("HotSprings");
    } else {
      setCurrentLocation(locationId);
    }
  };

  const handleStartQuest = () => {
    if (nextMainQuest) {
      startQuest(nextMainQuest.id);
      navigation.navigate("QuestDialogue", { questId: nextMainQuest.id });
    }
  };

  const handleTalkToCharacter = (characterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const availableQuests = getAvailableSideQuests(characterId, gameState.completedQuests);
    if (availableQuests.length > 0) {
      startQuest(availableQuests[0].id);
      navigation.navigate("QuestDialogue", { questId: availableQuests[0].id });
    } else {
      navigation.navigate("CharacterInteraction", { characterId });
    }
  };

  const handleViewQuestLog = () => {
    navigation.navigate("QuestLog");
  };

  const charactersInLocation = characters.filter(c => 
    currentLocation.characters?.includes(c.id)
  );

  return (
    <ImageBackground
      source={currentLocation.image}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { paddingTop: headerHeight + Spacing.md }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100)} style={styles.locationHeader}>
            <ThemedText style={styles.locationName}>{currentLocation.name}</ThemedText>
            <ThemedText style={styles.locationDescription}>
              {currentLocation.description}
            </ThemedText>
          </Animated.View>

          {nextMainQuest && nextMainQuest.locationId === currentLocation.id ? (
            <Animated.View entering={FadeIn.delay(200)} style={styles.questSection}>
              <View style={styles.questBanner}>
                <Feather name="flag" size={20} color={GameColors.accent} />
                <ThemedText style={styles.questTitle}>
                  Main Quest: {nextMainQuest.title}
                </ThemedText>
              </View>
              <ThemedText style={styles.questDescription}>
                {nextMainQuest.description}
              </ThemedText>
              <OrnateButton onPress={handleStartQuest} style={styles.questButton}>
                Begin Quest
              </OrnateButton>
            </Animated.View>
          ) : null}

          {charactersInLocation.length > 0 ? (
            <Animated.View entering={FadeIn.delay(300)} style={styles.charactersSection}>
              <ThemedText style={styles.sectionTitle}>Present Here</ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.charactersScroll}
              >
                {charactersInLocation.map((character) => {
                  const affinityLevel = getAffinityLevel(character.id);
                  const portrait = getCharacterPortrait(character.id);
                  const hasQuest = getAvailableSideQuests(character.id, gameState.completedQuests).length > 0;
                  
                  return (
                    <Pressable
                      key={character.id}
                      onPress={() => handleTalkToCharacter(character.id)}
                      style={styles.characterCard}
                    >
                      <View style={styles.characterPortraitWrapper}>
                        <Image
                          source={portrait}
                          style={styles.characterPortrait}
                          contentFit="cover"
                        />
                        {hasQuest ? (
                          <View style={styles.questIndicator}>
                            <Feather name="star" size={12} color={GameColors.parchment} />
                          </View>
                        ) : null}
                      </View>
                      <ThemedText style={styles.characterName}>{character.name}</ThemedText>
                      <ThemedText style={styles.affinityBadge}>
                        {affinityLevel === "intimate" ? "Devoted" :
                         affinityLevel === "close" ? "Close" :
                         affinityLevel === "friendly" ? "Friendly" : "Acquaintance"}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeIn.delay(400)} style={styles.locationsSection}>
            <ThemedText style={styles.sectionTitle}>Travel To</ThemedText>
            <View style={styles.locationsGrid}>
              {locations.filter(l => l.id !== currentLocation.id).map((location) => (
                <Pressable
                  key={location.id}
                  onPress={() => handleLocationChange(location.id)}
                  style={styles.locationCard}
                >
                  <Image
                    source={location.image}
                    style={styles.locationThumb}
                    contentFit="cover"
                  />
                  <View style={styles.locationCardOverlay}>
                    <ThemedText style={styles.locationCardName}>{location.name}</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(500)} style={styles.actionsSection}>
            <OrnateButton 
              onPress={handleViewQuestLog} 
              variant="secondary"
              style={styles.actionButton}
            >
              <View style={styles.buttonContent}>
                <Feather name="book" size={18} color={GameColors.accent} />
                <ThemedText style={styles.buttonText}>Quest Log</ThemedText>
              </View>
            </OrnateButton>
          </Animated.View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  locationHeader: {
    marginBottom: Spacing.xl,
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  locationName: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 24,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  locationDescription: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    lineHeight: 22,
  },
  questSection: {
    backgroundColor: "rgba(74, 124, 78, 0.3)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: GameColors.success,
  },
  questBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  questTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.accent,
  },
  questDescription: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    marginBottom: Spacing.md,
  },
  questButton: {
    alignSelf: "flex-start",
  },
  charactersSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    color: GameColors.accent,
    marginBottom: Spacing.md,
  },
  charactersScroll: {
    gap: Spacing.md,
  },
  characterCard: {
    alignItems: "center",
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.primary,
    width: 100,
  },
  characterPortraitWrapper: {
    width: 70,
    height: 90,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: GameColors.accent,
    position: "relative",
  },
  characterPortrait: {
    width: "100%",
    height: "100%",
  },
  questIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: GameColors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  characterName: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    textAlign: "center",
  },
  affinityBadge: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.accent,
    opacity: 0.8,
  },
  locationsSection: {
    marginBottom: Spacing.xl,
  },
  locationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  locationCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  locationThumb: {
    width: "100%",
    height: "100%",
  },
  locationCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    padding: Spacing.sm,
  },
  locationCardName: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    fontWeight: "600",
  },
  actionsSection: {
    gap: Spacing.md,
  },
  actionButton: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
  },
});
