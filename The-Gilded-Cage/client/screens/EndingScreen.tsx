import React, { useEffect } from "react";
import { StyleSheet, View, ImageBackground } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";

import { GameColors, Spacing, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { useGame } from "@/context/GameContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface EndingScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Ending">;
}

export default function EndingScreen({ navigation }: EndingScreenProps) {
  const insets = useSafeAreaInsets();
  const { gameState, resetGame, characters } = useGame();

  const isLiberation = gameState.choiceMade === "liberate";
  const selectedCharacter = characters.find(
    (c) => c.id === gameState.selectedCharacter
  );

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePlayAgain = () => {
    resetGame();
    navigation.reset({
      index: 0,
      routes: [{ name: "Title" }],
    });
  };

  const handleGallery = () => {
    navigation.navigate("Gallery");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/title-background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
          <ThemedText style={styles.endingType}>
            {isLiberation ? "The Liberation" : "The Takeover"}
          </ThemedText>
          <ThemedText style={styles.title}>
            {isLiberation ? "Freedom's Light" : "A New Master"}
          </ThemedText>
        </Animated.View>

        <Animated.View style={[styles.content, fadeStyle]}>
          {selectedCharacter ? (
            <View style={styles.characterSection}>
              <View style={styles.portraitContainer}>
                <Image
                  source={
                    selectedCharacter.customPortrait
                      ? { uri: selectedCharacter.customPortrait }
                      : selectedCharacter.portrait
                  }
                  style={styles.portrait}
                  contentFit="cover"
                />
              </View>
              <ThemedText style={styles.characterName}>
                {selectedCharacter.name}
              </ThemedText>
              <ThemedText style={styles.characterText}>
                {isLiberation
                  ? `With the deed destroyed, ${selectedCharacter.name} ${
                      selectedCharacter.id === "nymph"
                        ? "returned to the Eldergrove, healing both herself and the forest."
                        : selectedCharacter.id === "goblin"
                        ? "danced barefoot in the rain for the first time in years."
                        : selectedCharacter.id === "gnome"
                        ? "built a workshop where she invents devices to help others escape captivity."
                        : selectedCharacter.id === "dwarf"
                        ? "returned to her clan, her honor restored."
                        : selectedCharacter.id === "succubus"
                        ? "now uses her magic to help rather than harm."
                        : selectedCharacter.id === "werewolf"
                        ? "runs free under the moon once more."
                        : "explores new worlds with boundless curiosity."
                    }`
                  : `Under your ownership, ${selectedCharacter.name} remains bound, her fate now in your hands.`}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.statsSection}>
            <ThemedText style={styles.statsTitle}>Your Journey</ThemedText>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Puzzles Solved</ThemedText>
              <ThemedText style={styles.statValue}>
                {gameState.puzzlesSolved}
              </ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Companion Chosen</ThemedText>
              <ThemedText style={styles.statValue}>
                {selectedCharacter?.name || "None"}
              </ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText style={styles.statLabel}>Final Choice</ThemedText>
              <ThemedText
                style={[
                  styles.statValue,
                  { color: isLiberation ? GameColors.success : GameColors.danger },
                ]}
              >
                {isLiberation ? "Liberation" : "Takeover"}
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(1500)}
          style={styles.buttonContainer}
        >
          {isLiberation ? (
            <>
              <View style={styles.revelationBox}>
                <ThemedText style={styles.revelationText}>
                  But wait... where did you come from? Who are you, really?
                </ThemedText>
                <ThemedText style={styles.revelationSubtext}>
                  The freedom you've won reveals a greater mystery. 
                  Your journey has only just begun...
                </ThemedText>
              </View>
              <OrnateButton
                onPress={() => navigation.navigate("Town")}
                size="large"
                style={styles.button}
              >
                Continue Your Journey
              </OrnateButton>
            </>
          ) : (
            <OrnateButton
              onPress={() => navigation.navigate("Town")}
              size="large"
              style={styles.button}
            >
              Discover Your Past
            </OrnateButton>
          )}
          <OrnateButton
            onPress={handlePlayAgain}
            variant="secondary"
            size="large"
            style={styles.button}
          >
            Play Again
          </OrnateButton>
          <OrnateButton
            onPress={handleGallery}
            variant="secondary"
            size="large"
            style={styles.button}
          >
            Character Gallery
          </OrnateButton>
        </Animated.View>
      </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  endingType: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: GameTypography.display.fontFamily,
    fontSize: 32,
    color: GameColors.parchment,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  characterSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  portraitContainer: {
    width: 120,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: GameColors.accent,
    marginBottom: Spacing.md,
  },
  portrait: {
    width: "100%",
    height: "100%",
  },
  characterName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 20,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  characterText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  statsSection: {
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: GameColors.primary,
  },
  statsTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    color: GameColors.accent,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.2)",
  },
  statLabel: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
  },
  statValue: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  button: {
    width: "100%",
  },
  revelationBox: {
    backgroundColor: "rgba(184, 169, 201, 0.2)",
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#B8A9C9",
  },
  revelationText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: "#B8A9C9",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  revelationSubtext: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.9,
  },
});
