import React, { useEffect } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  SlideInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { DialogueLine } from "@/data/dialogues";
import { OrnateButton } from "@/components/OrnateButton";

interface DialogueBoxProps {
  line: DialogueLine;
  speakerName?: string;
  onContinue: () => void;
  onChoice?: (nextIndex: number) => void;
  characterPortrait?: any;
}

export function DialogueBox({
  line,
  speakerName,
  onContinue,
  onChoice,
  characterPortrait,
}: DialogueBoxProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, [line]);

  const getSpeakerDisplayName = () => {
    switch (line.speaker) {
      case "owner":
        return "Tavern Owner";
      case "hero":
        return "You";
      case "character":
        return speakerName || "???";
      case "narrator":
        return null;
      default:
        return null;
    }
  };

  const getSpeakerColor = () => {
    switch (line.speaker) {
      case "owner":
        return GameColors.danger;
      case "hero":
        return GameColors.success;
      case "character":
        return GameColors.accent;
      default:
        return GameColors.textSecondary;
    }
  };

  const getPortrait = () => {
    switch (line.speaker) {
      case "owner":
        return require("../../assets/images/portrait-owner.png");
      case "character":
        return characterPortrait;
      default:
        return null;
    }
  };

  const portrait = getPortrait();
  const displayName = getSpeakerDisplayName();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinue();
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {portrait ? (
        <View style={styles.portraitSection}>
          <View style={styles.portraitWrapper}>
            <Image
              source={portrait}
              style={styles.portrait}
              contentFit="cover"
            />
          </View>
        </View>
      ) : null}

      <View style={styles.textSection}>
        {displayName ? (
          <ThemedText style={[styles.speakerName, { color: getSpeakerColor() }]}>
            {displayName}
          </ThemedText>
        ) : null}

        <ThemedText
          style={[
            styles.dialogueText,
            line.speaker === "narrator" && styles.narratorText,
          ]}
        >
          {line.text}
        </ThemedText>

        {line.choices && line.choices.length > 0 ? (
          <View style={styles.choicesContainer}>
            {line.choices.map((choice, index) => (
              <OrnateButton
                key={index}
                variant="secondary"
                size="small"
                onPress={() => onChoice?.(choice.nextIndex)}
                style={styles.choiceButton}
              >
                {choice.text}
              </OrnateButton>
            ))}
          </View>
        ) : (
          <Pressable onPress={handleContinue} style={styles.continueHint}>
            <ThemedText style={styles.continueText}>
              Tap to continue...
            </ThemedText>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(44, 36, 22, 0.95)",
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: GameColors.accent,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  portraitSection: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  portraitWrapper: {
    width: 100,
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  portrait: {
    width: "100%",
    height: "100%",
  },
  textSection: {
    flex: 1,
  },
  speakerName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    marginBottom: Spacing.sm,
  },
  dialogueText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 16,
    lineHeight: 26,
    color: GameColors.parchment,
  },
  narratorText: {
    fontStyle: "italic",
    color: GameColors.textSecondary,
  },
  continueHint: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  continueText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.accent,
    opacity: 0.7,
  },
  choicesContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  choiceButton: {
    marginBottom: Spacing.sm,
  },
});
