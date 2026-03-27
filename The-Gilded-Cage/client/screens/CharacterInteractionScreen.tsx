import React from "react";
import { StyleSheet, View, ScrollView, ImageBackground, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { useGame } from "@/context/GameContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width } = Dimensions.get("window");

interface CharacterInteractionScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "CharacterInteraction">;
  route: RouteProp<RootStackParamList, "CharacterInteraction">;
}

export default function CharacterInteractionScreen({ navigation, route }: CharacterInteractionScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { characterId } = route.params;
  const { characters, gameState, getAffinityLevel, getCharacterPortrait } = useGame();

  const character = characters.find(c => c.id === characterId);
  if (!character) {
    navigation.goBack();
    return null;
  }

  const affinityLevel = getAffinityLevel(characterId);
  const affinityPoints = gameState.affinityPoints[characterId] || 0;
  const portrait = getCharacterPortrait(characterId);

  const getAffinityColor = () => {
    switch (affinityLevel) {
      case "intimate": return GameColors.danger;
      case "close": return "#E066FF";
      case "friendly": return GameColors.success;
      default: return GameColors.textSecondary;
    }
  };

  const getAffinityLabel = () => {
    switch (affinityLevel) {
      case "intimate": return "Devoted";
      case "close": return "Close Friend";
      case "friendly": return "Friendly";
      default: return "Acquaintance";
    }
  };

  const getProgressToNext = () => {
    if (affinityLevel === "intimate") return 100;
    const thresholds = { neutral: 10, friendly: 25, close: 50 };
    const current = affinityLevel === "neutral" ? 0 : 
                    affinityLevel === "friendly" ? 10 : 25;
    const next = thresholds[affinityLevel as keyof typeof thresholds] || 50;
    return Math.min(100, ((affinityPoints - current) / (next - current)) * 100);
  };

  return (
    <ImageBackground
      source={require("../../assets/images/tavern-interior.png")}
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
          <Animated.View entering={FadeInUp.delay(100)} style={styles.portraitSection}>
            <View style={styles.portraitWrapper}>
              <Image
                source={portrait}
                style={styles.portrait}
                contentFit="cover"
              />
              <Image
                source={require("../../assets/images/ornate-frame.png")}
                style={styles.frame}
                contentFit="cover"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)} style={styles.infoSection}>
            <ThemedText style={styles.characterName}>{character.name}</ThemedText>
            <ThemedText style={styles.characterSpecies}>{character.species}</ThemedText>
            
            <View style={styles.affinitySection}>
              <View style={styles.affinityHeader}>
                <Feather name="heart" size={16} color={getAffinityColor()} />
                <ThemedText style={[styles.affinityLabel, { color: getAffinityColor() }]}>
                  {getAffinityLabel()}
                </ThemedText>
              </View>
              <View style={styles.affinityBar}>
                <Animated.View 
                  style={[
                    styles.affinityProgress, 
                    { 
                      width: `${getProgressToNext()}%`,
                      backgroundColor: getAffinityColor(),
                    }
                  ]} 
                />
              </View>
              <ThemedText style={styles.affinityPoints}>
                {affinityPoints} affinity points
              </ThemedText>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(300)} style={styles.backstorySection}>
            <ThemedText style={styles.sectionTitle}>Her Story</ThemedText>
            <ThemedText style={styles.backstoryText}>{character.backstory}</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400)} style={styles.statusSection}>
            <ThemedText style={styles.sectionTitle}>Current Status</ThemedText>
            <View style={styles.statusContent}>
              {affinityLevel === "neutral" ? (
                <ThemedText style={styles.statusText}>
                  {character.name} regards you with cautious curiosity. Build trust by completing quests that help her.
                </ThemedText>
              ) : affinityLevel === "friendly" ? (
                <ThemedText style={styles.statusText}>
                  {character.name} has warmed to you and shares small confidences. Continue building your bond.
                </ThemedText>
              ) : affinityLevel === "close" ? (
                <ThemedText style={styles.statusText}>
                  {character.name} trusts you deeply and values your friendship. She may share her most guarded secrets.
                </ThemedText>
              ) : (
                <ThemedText style={styles.statusText}>
                  {character.name} is devoted to you completely. Your bond transcends the darkness of this place.
                </ThemedText>
              )}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500)} style={styles.actionSection}>
            <OrnateButton 
              onPress={() => navigation.goBack()}
              variant="secondary"
            >
              Return to Exploration
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  portraitSection: {
    marginBottom: Spacing.xl,
  },
  portraitWrapper: {
    width: width * 0.6,
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: GameColors.accent,
    position: "relative",
  },
  portrait: {
    width: "100%",
    height: "100%",
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  infoSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    width: "100%",
  },
  characterName: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 28,
    color: GameColors.accent,
    marginBottom: Spacing.xs,
  },
  characterSpecies: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 16,
    color: GameColors.parchment,
    opacity: 0.8,
    marginBottom: Spacing.lg,
  },
  affinitySection: {
    width: "100%",
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  affinityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  affinityLabel: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
  },
  affinityBar: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  affinityProgress: {
    height: "100%",
    borderRadius: 4,
  },
  affinityPoints: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.7,
    textAlign: "right",
  },
  backstorySection: {
    width: "100%",
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  sectionTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.accent,
    marginBottom: Spacing.md,
  },
  backstoryText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    lineHeight: 22,
    fontStyle: "italic",
  },
  statusSection: {
    width: "100%",
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  statusContent: {},
  statusText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    lineHeight: 22,
  },
  actionSection: {
    width: "100%",
  },
});
