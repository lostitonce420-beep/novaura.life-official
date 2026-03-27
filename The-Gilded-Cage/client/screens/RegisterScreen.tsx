import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
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

interface RegisterScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateAndRegister = async () => {
    setError(null);

    if (!username.trim()) {
      setError("Please choose a username");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await register(username.trim(), password);
      navigation.replace("Title");
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6) return { label: "Too short", color: GameColors.danger, pct: 20 };
    if (password.length < 8) return { label: "Weak", color: "#FF9800", pct: 40 };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { label: "Strong", color: GameColors.success, pct: 100 };
    }
    return { label: "Fair", color: GameColors.accent, pct: 70 };
  };

  const strength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      style={[styles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Image
        source={require("../../assets/images/title-background.png")}
        style={styles.background}
        contentFit="cover"
      />
      <View style={styles.darkOverlay} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.duration(600)} style={styles.panel}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={20} color={GameColors.parchment} />
          </Pressable>

          <View style={styles.headerArea}>
            <View style={styles.heroIcon}>
              <Feather name="shield" size={32} color={GameColors.accent} />
            </View>
            <ThemedText style={styles.title}>Begin Your Journey</ThemedText>
            <ThemedText style={styles.subtitle}>
              Create your account to save your progress through Ironhaven
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Username</ThemedText>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={16} color={GameColors.accent} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose a username"
                  placeholderTextColor="rgba(240, 227, 196, 0.35)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="input-username"
                />
              </View>
              <ThemedText style={styles.hint}>
                Letters, numbers, and underscores only
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={16} color={GameColors.accent} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Choose a password"
                  placeholderTextColor="rgba(240, 227, 196, 0.35)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="input-password"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={16}
                    color="rgba(240, 227, 196, 0.5)"
                  />
                </Pressable>
              </View>
              {strength ? (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBarOuter}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        { width: `${strength.pct}%`, backgroundColor: strength.color },
                      ]}
                    />
                  </View>
                  <ThemedText style={[styles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <View style={[
                styles.inputWrapper,
                confirmPassword.length > 0 && password !== confirmPassword
                  ? styles.inputWrapperError
                  : confirmPassword.length > 0 && password === confirmPassword
                  ? styles.inputWrapperSuccess
                  : null,
              ]}>
                <Feather name="lock" size={16} color={GameColors.accent} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your password"
                  placeholderTextColor="rgba(240, 227, 196, 0.35)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="input-confirm-password"
                  onSubmitEditing={validateAndRegister}
                />
                {confirmPassword.length > 0 ? (
                  <Feather
                    name={password === confirmPassword ? "check" : "x"}
                    size={16}
                    color={password === confirmPassword ? GameColors.success : GameColors.danger}
                  />
                ) : null}
              </View>
            </View>

            {error ? (
              <Animated.View entering={FadeIn} style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={GameColors.danger} />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </Animated.View>
            ) : null}

            <OrnateButton
              onPress={validateAndRegister}
              style={styles.registerButton}
              testID="button-register"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </OrnateButton>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>or</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.loginLink}
            testID="button-go-login"
          >
            <ThemedText style={styles.loginLinkText}>
              Already have an account?{" "}
            </ThemedText>
            <ThemedText style={styles.loginLinkHighlight}>Sign in</ThemedText>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.backgroundDark,
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
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  panel: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(44, 36, 22, 0.97)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerArea: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GameColors.accent,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 22,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
    opacity: 0.6,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
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
  hint: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.4,
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
  inputWrapperError: {
    borderColor: GameColors.danger,
  },
  inputWrapperSuccess: {
    borderColor: GameColors.success,
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
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  strengthBarOuter: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    minWidth: 55,
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
  registerButton: {
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
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginLinkText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    opacity: 0.6,
  },
  loginLinkHighlight: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
  },
});
