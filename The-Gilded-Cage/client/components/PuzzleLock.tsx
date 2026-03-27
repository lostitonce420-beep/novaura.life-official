import React, { useState } from "react";
import { StyleSheet, View, Pressable, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";

interface PuzzleLockProps {
  puzzleNumber: number;
  onSolve: () => void;
}

const { width } = Dimensions.get("window");

const generateSequence = (length: number): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * 4));
};

const SYMBOLS = ["moon", "sun", "star", "heart"] as const;
const SYMBOL_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  moon: "moon",
  sun: "sun",
  star: "star",
  heart: "heart",
};

export function PuzzleLock({ puzzleNumber, onSolve }: PuzzleLockProps) {
  const sequenceLength = 3 + puzzleNumber;
  const [targetSequence] = useState(() => generateSequence(sequenceLength));
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(true);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isSolved, setSolved] = useState(false);

  const buttonScales = [
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
  ];

  React.useEffect(() => {
    if (showingSequence) {
      const timer = setTimeout(() => {
        if (currentShowIndex < targetSequence.length) {
          buttonScales[targetSequence[currentShowIndex]].value = withSequence(
            withTiming(1.3, { duration: 200 }),
            withTiming(1, { duration: 200 })
          );
          setCurrentShowIndex((prev) => prev + 1);
        } else {
          setShowingSequence(false);
          setCurrentShowIndex(0);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showingSequence, currentShowIndex]);

  const handleSymbolPress = (index: number) => {
    if (showingSequence || isSolved) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScales[index].value = withSequence(
      withSpring(0.9),
      withSpring(1)
    );

    const newSequence = [...playerSequence, index];
    setPlayerSequence(newSequence);

    if (index !== targetSequence[newSequence.length - 1]) {
      setIsError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setPlayerSequence([]);
        setIsError(false);
        setShowingSequence(true);
        setCurrentShowIndex(0);
      }, 1000);
      return;
    }

    if (newSequence.length === targetSequence.length) {
      setSolved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(onSolve, 500);
    }
  };

  const resetPuzzle = () => {
    setPlayerSequence([]);
    setShowingSequence(true);
    setCurrentShowIndex(0);
    setIsError(false);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>
        Puzzle Lock {puzzleNumber}
      </ThemedText>

      <ThemedText style={styles.instructions}>
        {showingSequence
          ? "Watch the sequence..."
          : isError
          ? "Wrong! Try again..."
          : `Repeat the pattern (${playerSequence.length}/${sequenceLength})`}
      </ThemedText>

      <View style={styles.symbolGrid}>
        {SYMBOLS.map((symbol, index) => {
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: buttonScales[index].value }],
          }));

          const isHighlighted =
            showingSequence && targetSequence[currentShowIndex - 1] === index;

          return (
            <Animated.View key={symbol} style={[styles.symbolWrapper, animatedStyle]}>
              <Pressable
                onPress={() => handleSymbolPress(index)}
                style={[
                  styles.symbolButton,
                  isHighlighted && styles.symbolHighlighted,
                  isError && styles.symbolError,
                  isSolved && styles.symbolSolved,
                ]}
              >
                <Feather
                  name={SYMBOL_ICONS[symbol]}
                  size={32}
                  color={
                    isHighlighted || isSolved
                      ? GameColors.parchment
                      : GameColors.accent
                  }
                />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.progressContainer}>
        {targetSequence.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index < playerSequence.length && styles.progressDotFilled,
              isError && index < playerSequence.length && styles.progressDotError,
            ]}
          />
        ))}
      </View>

      {!showingSequence && !isSolved ? (
        <OrnateButton
          variant="secondary"
          size="small"
          onPress={resetPuzzle}
          style={styles.resetButton}
        >
          Show Sequence Again
        </OrnateButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(44, 36, 22, 0.95)",
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: GameColors.accent,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    alignItems: "center",
  },
  title: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 24,
    color: GameColors.accent,
    marginBottom: Spacing.md,
  },
  instructions: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 16,
    color: GameColors.parchment,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  symbolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  symbolWrapper: {
    width: (width - Spacing.xl * 4 - Spacing.lg * 2) / 2,
    aspectRatio: 1,
  },
  symbolButton: {
    flex: 1,
    backgroundColor: GameColors.backgroundDark,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: GameColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolHighlighted: {
    backgroundColor: GameColors.accent,
    borderColor: GameColors.accent,
  },
  symbolError: {
    backgroundColor: GameColors.danger,
    borderColor: GameColors.danger,
  },
  symbolSolved: {
    backgroundColor: GameColors.success,
    borderColor: GameColors.success,
  },
  progressContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GameColors.backgroundDark,
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  progressDotFilled: {
    backgroundColor: GameColors.accent,
  },
  progressDotError: {
    backgroundColor: GameColors.danger,
    borderColor: GameColors.danger,
  },
  resetButton: {
    marginTop: Spacing.md,
  },
});
