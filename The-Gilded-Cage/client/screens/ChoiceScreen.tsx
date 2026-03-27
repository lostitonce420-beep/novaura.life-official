import React, { useState } from "react";
import { StyleSheet, View, ImageBackground, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { DialogueBox } from "@/components/DialogueBox";
import { useGame } from "@/context/GameContext";
import { liberationEnding, takeoverEnding } from "@/data/dialogues";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface ChoiceScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Choice">;
}

export default function ChoiceScreen({ navigation }: ChoiceScreenProps) {
  const insets = useSafeAreaInsets();
  const { makeChoice, gameState, resetGame } = useGame();
  const [phase, setPhase] = useState<"choice" | "ending">("choice");
  const [endingIndex, setEndingIndex] = useState(0);

  const choiceMade = gameState.choiceMade;
  const endingDialogue =
    choiceMade === "liberate" ? liberationEnding : takeoverEnding;

  const handleChoice = (choice: "liberate" | "takeover") => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    makeChoice(choice);
    setPhase("ending");
  };

  const handleEndingAdvance = () => {
    if (endingIndex < endingDialogue.length - 1) {
      setEndingIndex((prev) => prev + 1);
    } else {
      navigation.navigate("Ending");
    }
  };

  if (phase === "ending" && choiceMade) {
    return (
      <ImageBackground
        source={require("../../assets/images/tavern-interior.png")}
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
            key={endingIndex}
            entering={FadeIn.duration(300)}
          >
            <DialogueBox
              line={endingDialogue[endingIndex]}
              onContinue={handleEndingAdvance}
            />
          </Animated.View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/tavern-interior.png")}
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
          <ThemedText style={styles.title}>The Master Deed</ThemedText>
          <ThemedText style={styles.subtitle}>
            The power of seven souls rests in your hands. What will you do?
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300)} style={styles.deedContainer}>
          <View style={styles.deedPaper}>
            <ThemedText style={styles.deedTitle}>Soul Contract</ThemedText>
            <ThemedText style={styles.deedText}>
              By the binding of this deed, the following souls are bound to this
              establishment for all eternity:
            </ThemedText>
            <ThemedText style={styles.deedNames}>
              Willow, Pip, Gerta, Brunhilda, Vesper, Luna, Mittens
            </ThemedText>
            <ThemedText style={styles.deedText}>
              The bearer of this contract holds absolute authority over these
              souls. To destroy the deed is to free them. To sign is to claim
              ownership.
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)} style={styles.choicesContainer}>
          <OrnateButton
            onPress={() => handleChoice("liberate")}
            size="large"
            style={styles.choiceButton}
          >
            Tear the Deed - Free Them All
          </OrnateButton>

          <OrnateButton
            onPress={() => handleChoice("takeover")}
            variant="danger"
            size="large"
            style={styles.choiceButton}
          >
            Sign Your Name - Claim Ownership
          </OrnateButton>
        </Animated.View>
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
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 32,
    color: GameColors.accent,
    textAlign: "center",
    marginBottom: Spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 16,
    color: GameColors.parchment,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.9,
    paddingHorizontal: Spacing.lg,
  },
  deedContainer: {
    marginBottom: Spacing.xl,
  },
  deedPaper: {
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: GameColors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  deedTitle: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 22,
    color: GameColors.danger,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  deedText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  deedNames: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.primary,
    textAlign: "center",
    marginBottom: Spacing.md,
    fontStyle: "italic",
  },
  choicesContainer: {
    gap: Spacing.lg,
  },
  choiceButton: {
    width: "100%",
  },
});
