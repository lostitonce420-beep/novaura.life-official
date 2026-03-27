import React from "react";
import { StyleSheet, View, ScrollView, ImageBackground, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { useGame } from "@/context/GameContext";

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { characters, setCustomPortrait, getAffinityLevel, getCharacterPortrait, gameState } = useGame();

  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  const handleUploadPortrait = async (characterId: string) => {
    if (!mediaPermission?.granted) {
      if (mediaPermission?.status === "denied" && !mediaPermission.canAskAgain) {
        Alert.alert(
          "Permission Required",
          "Please enable photo library access in your device settings to upload custom portraits."
        );
        return;
      }
      const result = await requestMediaPermission();
      if (!result.granted) return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCustomPortrait(characterId, result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to load image. Please try again.");
    }
  };

  const getAffinityColor = (level: string) => {
    switch (level) {
      case "intimate": return GameColors.danger;
      case "close": return "#E066FF";
      case "friendly": return GameColors.success;
      default: return GameColors.textSecondary;
    }
  };

  const getAffinityLabel = (level: string) => {
    switch (level) {
      case "intimate": return "Devoted";
      case "close": return "Close Friend";
      case "friendly": return "Friendly";
      default: return "Acquaintance";
    }
  };

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
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
            <ThemedText style={styles.title}>Character Gallery</ThemedText>
            <ThemedText style={styles.subtitle}>
              View and customize your companions' portraits
            </ThemedText>
          </Animated.View>

          {characters.map((character, index) => {
            const affinityLevel = getAffinityLevel(character.id);
            const portrait = getCharacterPortrait(character.id);
            const affinityPoints = gameState.affinityPoints[character.id] || 0;

            return (
              <Animated.View
                key={character.id}
                entering={FadeInUp.delay(200 + index * 100)}
                style={styles.characterCard}
              >
                <View style={styles.cardContent}>
                  <View style={styles.portraitSection}>
                    <View style={styles.portraitWrapper}>
                      <Image
                        source={portrait}
                        style={styles.portrait}
                        contentFit="cover"
                      />
                    </View>
                    <OrnateButton
                      onPress={() => handleUploadPortrait(character.id)}
                      variant="secondary"
                      size="small"
                      style={styles.uploadButton}
                    >
                      <View style={styles.uploadButtonContent}>
                        <Feather name="camera" size={14} color={GameColors.accent} />
                        <ThemedText style={styles.uploadText}>Change</ThemedText>
                      </View>
                    </OrnateButton>
                  </View>

                  <View style={styles.infoSection}>
                    <ThemedText style={styles.characterName}>
                      {character.name}
                    </ThemedText>
                    <ThemedText style={styles.characterSpecies}>
                      {character.species}
                    </ThemedText>
                    
                    <View style={styles.affinityRow}>
                      <Feather 
                        name="heart" 
                        size={14} 
                        color={getAffinityColor(affinityLevel)} 
                      />
                      <ThemedText style={[
                        styles.affinityLabel,
                        { color: getAffinityColor(affinityLevel) }
                      ]}>
                        {getAffinityLabel(affinityLevel)}
                      </ThemedText>
                      <ThemedText style={styles.affinityPoints}>
                        ({affinityPoints} pts)
                      </ThemedText>
                    </View>

                    <ThemedText style={styles.characterTagline}>
                      "{character.tagline}"
                    </ThemedText>
                    <ThemedText style={styles.characterBackstory} numberOfLines={3}>
                      {character.backstory}
                    </ThemedText>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
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
  characterCard: {
    backgroundColor: GameColors.backgroundDark,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GameColors.primary,
  },
  cardContent: {
    flexDirection: "row",
    padding: Spacing.md,
  },
  portraitSection: {
    alignItems: "center",
    marginRight: Spacing.md,
  },
  portraitWrapper: {
    width: 100,
    height: 130,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  portrait: {
    width: "100%",
    height: "100%",
  },
  uploadButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  uploadButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  uploadText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.accent,
  },
  infoSection: {
    flex: 1,
    justifyContent: "flex-start",
  },
  characterName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 20,
    color: GameColors.accent,
    marginBottom: Spacing.xs,
  },
  characterSpecies: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.8,
    marginBottom: Spacing.sm,
  },
  affinityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  affinityLabel: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    fontWeight: "600",
  },
  affinityPoints: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.parchment,
    opacity: 0.6,
  },
  characterTagline: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 12,
    color: GameColors.accent,
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
  characterBackstory: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.9,
    lineHeight: 16,
  },
});
