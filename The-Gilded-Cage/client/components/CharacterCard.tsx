import React from "react";
import { StyleSheet, View, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    species: string;
    tagline: string;
    portrait: any;
    customPortrait?: string;
    unlocked: boolean;
  };
  onPress: () => void;
  isSelected?: boolean;
  showLocked?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CharacterCard({
  character,
  onPress,
  isSelected = false,
  showLocked = false,
}: CharacterCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const isLocked = showLocked && !character.unlocked;
  const portraitSource = character.customPortrait
    ? { uri: character.customPortrait }
    : character.portrait;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        isSelected && styles.selected,
        animatedStyle,
      ]}
    >
      <View style={styles.portraitContainer}>
        <Image
          source={
            isLocked
              ? require("../../assets/images/locked-character.png")
              : portraitSource
          }
          style={styles.portrait}
          contentFit="cover"
        />
        <Image
          source={require("../../assets/images/ornate-frame.png")}
          style={styles.frame}
          contentFit="cover"
        />
      </View>
      <View style={styles.infoContainer}>
        <ThemedText style={styles.name}>
          {isLocked ? "???" : character.name}
        </ThemedText>
        <ThemedText style={styles.species}>
          {isLocked ? "Unknown" : character.species}
        </ThemedText>
        <ThemedText style={styles.tagline} numberOfLines={2}>
          {isLocked ? "Unlock to reveal" : character.tagline}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GameColors.primary,
    marginBottom: Spacing.lg,
  },
  selected: {
    borderColor: GameColors.accent,
    borderWidth: 3,
    shadowColor: GameColors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  portraitContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    position: "relative",
  },
  portrait: {
    width: "100%",
    height: "100%",
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  infoContainer: {
    padding: Spacing.md,
    backgroundColor: GameColors.backgroundDark,
  },
  name: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.accent,
    marginBottom: Spacing.xs,
  },
  species: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.6,
    fontStyle: "italic",
  },
});
