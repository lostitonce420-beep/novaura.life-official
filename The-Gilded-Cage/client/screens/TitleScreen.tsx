import React, { useEffect, useState } from "react";
import { StyleSheet, View, ImageBackground, Dimensions, Pressable } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  FadeIn,
} from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { GameColors, Spacing, GameTypography, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width, height } = Dimensions.get("window");

interface TitleScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Title">;
}

export default function TitleScreen({ navigation }: TitleScreenProps) {
  const insets = useSafeAreaInsets();
  const { loadGame, resetGame, startNewGame, gameState } = useGame();
  const { user, logout } = useAuth();
  const [hasSavedGame, setHasSavedGame] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigation.replace("Login");
  };

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    checkForSavedGame();
    animateIn();
  }, []);

  const checkForSavedGame = async () => {
    const hasGame = await loadGame();
    setHasSavedGame(hasGame && gameState.gameStarted);
  };

  const animateIn = () => {
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(300, withTiming(0, { duration: 800 }));
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
  };

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleNewGame = () => {
    startNewGame();
    navigation.navigate("QuestDialogue", { questId: "mq1" });
  };

  const handleContinue = () => {
    if (gameState.completedQuests.length === 0) {
      navigation.navigate("QuestDialogue", { questId: "mq1" });
    } else {
      navigation.navigate("Exploration");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/title-background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { paddingTop: insets.top + Spacing.xl }]}>
        {user ? (
          <Animated.View entering={FadeIn.delay(1000)} style={[styles.userBadge, { top: insets.top + Spacing.sm }]}>
            <Feather name="user" size={12} color={GameColors.accent} />
            <ThemedText style={styles.userBadgeText}>{user.username}</ThemedText>
            <Pressable onPress={handleLogout} style={styles.logoutButton} testID="button-logout">
              <Feather name="log-out" size={12} color="rgba(240, 227, 196, 0.5)" />
            </Pressable>
          </Animated.View>
        ) : null}

        <Animated.View style={[styles.logoContainer, glowAnimatedStyle]}>
          <View style={styles.glowEffect} />
        </Animated.View>

        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={styles.title}>The Gilded Cage</ThemedText>
          <ThemedText style={styles.subtitle}>
            A Tale of Mystery and Choice
          </ThemedText>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + Spacing.xl },
            buttonAnimatedStyle,
          ]}
        >
          <OrnateButton
            onPress={handleNewGame}
            size="large"
            style={styles.button}
          >
            New Game
          </OrnateButton>

          {hasSavedGame ? (
            <OrnateButton
              onPress={handleContinue}
              variant="secondary"
              size="large"
              style={styles.button}
            >
              Continue
            </OrnateButton>
          ) : null}

          <Pressable
            onPress={() => navigation.navigate("Town")}
            style={styles.devSkipButton}
            testID="button-skip-to-town"
          >
            <Feather name="fast-forward" size={14} color="rgba(240, 227, 196, 0.4)" />
            <ThemedText style={styles.devSkipText}>Skip to Ironhaven</ThemedText>
          </Pressable>
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    position: "absolute",
    top: height * 0.2,
    alignItems: "center",
  },
  glowEffect: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: GameColors.accent,
    position: "absolute",
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: GameTypography.display.fontFamily,
    fontSize: 36,
    color: GameColors.accent,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 16,
    color: GameColors.parchment,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: Spacing["3xl"],
    gap: Spacing.lg,
  },
  button: {
    width: "100%",
  },
  userBadge: {
    position: "absolute",
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(44, 36, 22, 0.85)",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    zIndex: 10,
  },
  userBadgeText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
  },
  logoutButton: {
    padding: 2,
    marginLeft: 2,
  },
  devSkipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    opacity: 0.5,
  },
  devSkipText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: "rgba(240, 227, 196, 0.4)",
  },
});
