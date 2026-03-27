import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, ImageBackground, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { useGame } from "@/context/GameContext";
import { ImmersiveScene, SceneNarrative, SceneChoice } from "@/data/immersiveScenes";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface ImmersiveSceneScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "ImmersiveScene">;
  route: RouteProp<RootStackParamList, "ImmersiveScene">;
}

export default function ImmersiveSceneScreen({ navigation, route }: ImmersiveSceneScreenProps) {
  const { scene } = route.params;
  const insets = useSafeAreaInsets();
  const { addAffinityPoints, addClue, characters } = useGame();

  const [currentNarrativeIndex, setCurrentNarrativeIndex] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<SceneChoice | null>(null);
  const [sceneComplete, setSceneComplete] = useState(false);

  const currentNarrative = scene.narrative[currentNarrativeIndex];
  const isLastNarrative = currentNarrativeIndex >= scene.narrative.length - 1;

  const handleAdvance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isLastNarrative) {
      if (scene.choices && scene.choices.length > 0 && !selectedChoice) {
        setShowChoices(true);
      } else {
        completeScene();
      }
    } else {
      setCurrentNarrativeIndex(prev => prev + 1);
    }
  };

  const handleChoice = (choice: SceneChoice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChoice(choice);
    setShowChoices(false);

    if (choice.affinityChange) {
      choice.affinityChange.forEach(change => {
        addAffinityPoints(change.characterId, change.points);
      });
    }

    if (choice.unlockClue) {
      addClue(choice.unlockClue);
    }

    setTimeout(() => {
      completeScene();
    }, 2000);
  };

  const completeScene = () => {
    if (scene.rewards) {
      if (scene.rewards.clue) {
        addClue(scene.rewards.clue);
      }
      if (scene.rewards.affinityBonus) {
        scene.rewards.affinityBonus.forEach(bonus => {
          addAffinityPoints(bonus.characterId, bonus.points);
        });
      }
    }
    
    setSceneComplete(true);
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const getBackgroundForMood = () => {
    switch (scene.atmosphere.mood) {
      case "romantic":
        return require("../../assets/images/location-courtyard.png");
      case "mysterious":
        return require("../../assets/images/location-corridors.png");
      case "tense":
        return require("../../assets/images/location-main-hall.png");
      case "dark":
        return require("../../assets/images/location-cellar.png");
      case "revelatory":
        return require("../../assets/images/location-study.png");
      default:
        return require("../../assets/images/parchment-texture.png");
    }
  };

  const getNarrativeStyle = (narrative: SceneNarrative) => {
    switch (narrative.type) {
      case "flashback":
        return styles.flashbackText;
      case "thought":
        return styles.thoughtText;
      case "discovery":
        return styles.discoveryText;
      case "dialogue":
        return styles.dialogueText;
      default:
        return styles.descriptionText;
    }
  };

  const getSpeakerName = (speakerId?: string) => {
    if (!speakerId) return "";
    const character = characters.find(c => c.id === speakerId);
    return character?.name || speakerId;
  };

  return (
    <ImageBackground
      source={getBackgroundForMood()}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          <Animated.View entering={FadeInUp} style={styles.header}>
            <ThemedText style={styles.title}>{scene.title}</ThemedText>
            <ThemedText style={styles.atmosphere}>{scene.atmosphere.ambience}</ThemedText>
          </Animated.View>

          {!sceneComplete ? (
            <>
              <Animated.View 
                key={currentNarrativeIndex}
                entering={FadeIn.duration(500)}
                style={styles.narrativeContainer}
              >
                {currentNarrative.speaker ? (
                  <ThemedText style={styles.speakerName}>
                    {getSpeakerName(currentNarrative.speaker)}
                  </ThemedText>
                ) : null}
                
                <ThemedText style={[styles.narrativeText, getNarrativeStyle(currentNarrative)]}>
                  {currentNarrative.text}
                </ThemedText>

                {currentNarrative.emotion ? (
                  <ThemedText style={styles.emotionHint}>
                    *{currentNarrative.emotion}*
                  </ThemedText>
                ) : null}
              </Animated.View>

              {showChoices ? (
                <Animated.View entering={FadeInUp.delay(200)} style={styles.choicesContainer}>
                  <ThemedText style={styles.choicePrompt}>What do you do?</ThemedText>
                  {scene.choices?.map((choice, index) => (
                    <OrnateButton
                      key={choice.id}
                      onPress={() => handleChoice(choice)}
                      variant="secondary"
                      style={styles.choiceButton}
                    >
                      <View style={styles.choiceContent}>
                        <ThemedText style={styles.choiceText}>{choice.text}</ThemedText>
                        {choice.morality ? (
                          <View style={[
                            styles.moralityBadge,
                            choice.morality === "compassionate" && styles.compassionateBadge,
                            choice.morality === "pragmatic" && styles.pragmaticBadge,
                            choice.morality === "ruthless" && styles.ruthlessBadge,
                          ]}>
                            <Feather 
                              name={
                                choice.morality === "compassionate" ? "heart" :
                                choice.morality === "pragmatic" ? "target" : "zap"
                              } 
                              size={12} 
                              color={GameColors.parchment} 
                            />
                          </View>
                        ) : null}
                      </View>
                    </OrnateButton>
                  ))}
                </Animated.View>
              ) : selectedChoice ? (
                <Animated.View entering={FadeIn} style={styles.consequenceContainer}>
                  <Feather name="arrow-right" size={20} color={GameColors.accent} />
                  <ThemedText style={styles.consequenceText}>
                    {selectedChoice.consequence}
                  </ThemedText>
                </Animated.View>
              ) : (
                <Pressable onPress={handleAdvance} style={styles.advanceButton}>
                  <ThemedText style={styles.advanceText}>
                    {isLastNarrative && !scene.choices ? "Continue..." : "Tap to continue..."}
                  </ThemedText>
                </Pressable>
              )}
            </>
          ) : (
            <Animated.View entering={FadeIn} style={styles.completeContainer}>
              <Feather name="check-circle" size={48} color={GameColors.success} />
              <ThemedText style={styles.completeText}>Scene Complete</ThemedText>
              
              {scene.rewards?.clue ? (
                <View style={styles.rewardItem}>
                  <Feather name="key" size={16} color={GameColors.accent} />
                  <ThemedText style={styles.rewardText}>New clue discovered</ThemedText>
                </View>
              ) : null}
              
              {scene.rewards?.memoryFragment ? (
                <View style={styles.rewardItem}>
                  <Feather name="eye" size={16} color={GameColors.accent} />
                  <ThemedText style={styles.rewardText}>Memory fragment recovered</ThemedText>
                </View>
              ) : null}

              <OrnateButton onPress={handleExit} style={styles.exitButton}>
                Continue Your Journey
              </OrnateButton>
            </Animated.View>
          )}
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 28,
    color: GameColors.accent,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  atmosphere: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.8,
  },
  narrativeContainer: {
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  speakerName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  narrativeText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 16,
    color: GameColors.parchment,
    lineHeight: 26,
  },
  descriptionText: {
    fontStyle: "normal",
  },
  dialogueText: {
    fontStyle: "normal",
  },
  thoughtText: {
    fontStyle: "italic",
    color: GameColors.accent,
  },
  flashbackText: {
    fontStyle: "italic",
    color: "#B8A9C9",
  },
  discoveryText: {
    fontWeight: "bold",
    color: GameColors.success,
  },
  emotionHint: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.7,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  advanceButton: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  advanceText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    opacity: 0.7,
  },
  choicesContainer: {
    gap: Spacing.md,
  },
  choicePrompt: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.accent,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  choiceButton: {
    width: "100%",
  },
  choiceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  choiceText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    flex: 1,
  },
  moralityBadge: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.round,
    marginLeft: Spacing.sm,
  },
  compassionateBadge: {
    backgroundColor: "#4CAF50",
  },
  pragmaticBadge: {
    backgroundColor: "#FF9800",
  },
  ruthlessBadge: {
    backgroundColor: "#F44336",
  },
  consequenceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  consequenceText: {
    flex: 1,
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    fontStyle: "italic",
  },
  completeContainer: {
    alignItems: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  completeText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 24,
    color: GameColors.accent,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rewardText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
  },
  exitButton: {
    marginTop: Spacing.lg,
  },
});
