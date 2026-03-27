import React, { useState } from "react";
import { StyleSheet, View, ScrollView, ImageBackground } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInUp } from "react-native-reanimated";

import { GameColors, Spacing, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { CharacterCard } from "@/components/CharacterCard";
import { OrnateButton } from "@/components/OrnateButton";
import { useGame } from "@/context/GameContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface CharacterSelectionScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "CharacterSelection">;
}

export default function CharacterSelectionScreen({
  navigation,
}: CharacterSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { characters, selectCharacter, gameState, startQuest, addAffinityPoints } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(
    gameState.selectedCharacter
  );

  const handleCharacterPress = (characterId: string) => {
    setSelectedId(characterId);
  };

  const handleConfirm = () => {
    if (selectedId) {
      selectCharacter(selectedId);
      addAffinityPoints(selectedId, 10);
      navigation.navigate("Dialogue");
    }
  };

  const characterCards = characters.map((char) => ({
    ...char,
    portrait: char.portraits.neutral,
  }));

  return (
    <ImageBackground
      source={require("../../assets/images/parchment-texture.png")}
      style={styles.container}
      resizeMode="repeat"
    >
      <View style={[styles.overlay, { paddingTop: headerHeight + Spacing.md }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing["5xl"] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
            <ThemedText style={styles.title}>Choose Your Companion</ThemedText>
            <ThemedText style={styles.subtitle}>
              Seven souls await your decision. Each holds secrets about this
              place...
            </ThemedText>
          </Animated.View>

          <View style={styles.grid}>
            {characterCards.map((character, index) => (
              <Animated.View
                key={character.id}
                entering={FadeInUp.delay(200 + index * 100)}
              >
                <CharacterCard
                  character={character}
                  onPress={() => handleCharacterPress(character.id)}
                  isSelected={selectedId === character.id}
                />
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {selectedId ? (
          <Animated.View
            entering={FadeInUp}
            style={[
              styles.confirmContainer,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <OrnateButton onPress={handleConfirm} size="large">
              Speak with{" "}
              {characters.find((c) => c.id === selectedId)?.name || "them"}
            </OrnateButton>
          </Animated.View>
        ) : null}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.surface,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(244, 231, 215, 0.85)",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 28,
    color: GameColors.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  confirmContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(44, 36, 22, 0.95)",
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 2,
    borderTopColor: GameColors.accent,
  },
});
