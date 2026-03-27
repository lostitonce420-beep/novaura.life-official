import React, { useState } from "react";
import { StyleSheet, View, ImageBackground, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { GameColors, Spacing, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { PuzzleLock } from "@/components/PuzzleLock";
import { DialogueBox } from "@/components/DialogueBox";
import { useGame } from "@/context/GameContext";
import { puzzleIntroDialogue, puzzleSolvedDialogue } from "@/data/dialogues";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface PuzzleScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Puzzle">;
}

const TOTAL_PUZZLES = 3;

export default function PuzzleScreen({ navigation }: PuzzleScreenProps) {
  const insets = useSafeAreaInsets();
  const { solvePuzzle, gameState, completeQuest, unlockItem, addClue } = useGame();
  
  const completedPuzzleQuests = ["mq7", "mq8", "mq9"].filter(
    q => gameState.completedQuests.includes(q)
  ).length;
  
  const [currentPuzzle, setCurrentPuzzle] = useState(completedPuzzleQuests + 1);
  const [showIntro, setShowIntro] = useState(completedPuzzleQuests === 0);
  const [introIndex, setIntroIndex] = useState(0);
  const [allSolved, setAllSolved] = useState(false);
  const [solvedDialogueIndex, setSolvedDialogueIndex] = useState(0);

  const handleIntroAdvance = () => {
    if (introIndex < puzzleIntroDialogue.length - 1) {
      setIntroIndex((prev) => prev + 1);
    } else {
      setShowIntro(false);
    }
  };

  const handlePuzzleSolved = () => {
    solvePuzzle();
    
    const questIds = ["mq7", "mq8", "mq9"];
    const currentQuestId = questIds[currentPuzzle - 1];
    if (currentQuestId) {
      completeQuest(currentQuestId);
    }
    
    if (currentPuzzle < TOTAL_PUZZLES) {
      setCurrentPuzzle((prev) => prev + 1);
    } else {
      unlockItem("deed");
      addClue("The master deed is within your grasp. Now you must make a choice.");
      setAllSolved(true);
    }
  };

  const handleSolvedDialogueAdvance = () => {
    if (solvedDialogueIndex < puzzleSolvedDialogue.length - 1) {
      setSolvedDialogueIndex((prev) => prev + 1);
    } else {
      navigation.navigate("Choice");
    }
  };

  if (showIntro) {
    return (
      <ImageBackground
        source={require("../../assets/images/location-study.png")}
        style={styles.container}
        resizeMode="cover"
      >
        <View
          style={[
            styles.overlay,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.spacer} />
          <Animated.View
            key={introIndex}
            entering={FadeIn.duration(300)}
          >
            <DialogueBox
              line={puzzleIntroDialogue[introIndex]}
              onContinue={handleIntroAdvance}
            />
          </Animated.View>
        </View>
      </ImageBackground>
    );
  }

  if (allSolved) {
    return (
      <ImageBackground
        source={require("../../assets/images/location-study.png")}
        style={styles.container}
        resizeMode="cover"
      >
        <View
          style={[
            styles.overlay,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.spacer} />
          <Animated.View
            key={solvedDialogueIndex}
            entering={FadeIn.duration(300)}
          >
            <DialogueBox
              line={puzzleSolvedDialogue[solvedDialogueIndex]}
              onContinue={handleSolvedDialogueAdvance}
            />
          </Animated.View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/location-study.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View entering={FadeInUp} style={styles.header}>
          <ThemedText style={styles.title}>The Secret Study</ThemedText>
          <ThemedText style={styles.progress}>
            Lock {currentPuzzle} of {TOTAL_PUZZLES}
          </ThemedText>
        </Animated.View>

        <Animated.View
          key={currentPuzzle}
          entering={FadeIn.duration(500)}
          style={styles.puzzleContainer}
        >
          <PuzzleLock
            puzzleNumber={currentPuzzle}
            onSolve={handlePuzzleSolved}
          />
        </Animated.View>

        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_PUZZLES }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index < currentPuzzle && styles.progressDotCompleted,
                index === currentPuzzle - 1 && styles.progressDotCurrent,
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  spacer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
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
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  progress: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    opacity: 0.8,
  },
  puzzleContainer: {
    marginBottom: Spacing.xl,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GameColors.backgroundDark,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  progressDotCompleted: {
    backgroundColor: GameColors.success,
    borderColor: GameColors.success,
  },
  progressDotCurrent: {
    backgroundColor: GameColors.accent,
  },
});
