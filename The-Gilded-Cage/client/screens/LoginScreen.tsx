import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import {
  GameColors,
  Spacing,
  BorderRadius,
  GameTypography,
} from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { useAuth } from "@/context/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { login, register, user, isLoading: authLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  React.useEffect(() => {
    if (!authLoading && user) {
      navigation.replace("Title");
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Image
          source={require("../../assets/images/title-background.png")}
          style={styles.background}
          contentFit="cover"
        />
        <View style={styles.darkOverlay} />
        <Animated.View entering={FadeIn} style={styles.loadingPanel}>
          <View style={styles.loadingIcon}>
            <Feather name="key" size={32} color={GameColors.accent} />
          </View>
          <ThemedText style={styles.loadingTitle}>The Gilded Cage</ThemedText>
          <ThemedText style={styles.loadingText}>Unlocking the gates...</ThemedText>
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.loadingDot, { opacity: 0.3 + i * 0.35 }]} />
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      navigation.replace("Title");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestPlay = async () => {
    setError(null);
    setIsGuest(true);
    setIsLoading(true);
    try {
      const guestId = `guest_${Date.now().toString(36)}`;
      const guestPass = `g${Math.random().toString(36).slice(2, 14)}`;
      await register(guestId, guestPass);
      navigation.replace("Title");
    } catch (e: any) {
      setError("Could not start guest session. Please try again.");
    } finally {
      setIsLoading(false);
      setIsGuest(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Image
        source={require("../../assets/images/title-background.png")}
        style={styles.background}
        contentFit="cover"
      />
      <View style={styles.darkOverlay} />

      <Animated.View entering={FadeInUp.duration(600)} style={styles.panel}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Feather name="key" size={28} color={GameColors.accent} />
          </View>
          <ThemedText style={styles.title}>The Gilded Cage</ThemedText>
        </View>

        <ThemedText style={styles.subtitle}>Welcome back, traveller</ThemedText>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Username</ThemedText>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={16} color={GameColors.accent} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="rgba(240, 227, 196, 0.35)"
                autoCapitalize="none"
                autoCorrect={false}
                testID="input-username"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={16} color={GameColors.accent} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="rgba(240, 227, 196, 0.35)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                testID="input-password"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                testID="button-toggle-password"
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color="rgba(240, 227, 196, 0.5)"
                />
              </Pressable>
            </View>
          </View>

          {error ? (
            <Animated.View entering={FadeIn} style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={GameColors.danger} />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </Animated.View>
          ) : null}

          <OrnateButton
            onPress={handleLogin}
            style={styles.loginButton}
            testID="button-login"
          >
            {isLoading ? "Signing in..." : "Enter the Cage"}
          </OrnateButton>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <ThemedText style={styles.dividerText}>or</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={() => navigation.navigate("Register")}
          style={styles.registerLink}
          testID="button-go-register"
        >
          <ThemedText style={styles.registerLinkText}>
            New to Ironhaven?{" "}
          </ThemedText>
          <ThemedText style={styles.registerLinkHighlight}>
            Create an account
          </ThemedText>
        </Pressable>

        <View style={styles.guestDivider}>
          <View style={styles.guestLine} />
          <ThemedText style={styles.guestDividerText}>or skip the gates</ThemedText>
          <View style={styles.guestLine} />
        </View>

        <Pressable
          onPress={handleGuestPlay}
          style={styles.guestButton}
          testID="button-guest-play"
          disabled={isLoading}
        >
          <Feather name="wind" size={14} color="rgba(240, 227, 196, 0.5)" />
          <ThemedText style={styles.guestButtonText}>
            {isGuest ? "Entering as guest..." : "Play as Guest"}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  panel: {
    width: "90%",
    maxWidth: 380,
    backgroundColor: "rgba(44, 36, 22, 0.97)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  title: {
    fontFamily: GameTypography.display.fontFamily,
    fontSize: 22,
    color: GameColors.accent,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
    opacity: 0.6,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.7,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.6)",
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 15,
    color: GameColors.parchment,
    height: 48,
  },
  passwordInput: {
    paddingRight: Spacing.md,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(139, 37, 0, 0.2)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(139, 37, 0, 0.4)",
  },
  errorText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 13,
    color: GameColors.danger,
    flex: 1,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },
  dividerText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.4,
  },
  registerLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerLinkText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    opacity: 0.6,
  },
  registerLinkHighlight: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
  },
  guestDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  guestLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  guestDividerText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.3,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(240, 227, 196, 0.12)",
    borderStyle: "dashed",
  },
  guestButtonText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 13,
    color: "rgba(240, 227, 196, 0.45)",
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: "relative",
  },
  loadingPanel: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  loadingTitle: {
    fontFamily: GameTypography.display.fontFamily,
    fontSize: 28,
    color: GameColors.accent,
    letterSpacing: 3,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 15,
    color: GameColors.parchment,
    opacity: 0.6,
    fontStyle: "italic",
    marginBottom: Spacing.xl,
  },
  loadingDots: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GameColors.accent,
  },
});
