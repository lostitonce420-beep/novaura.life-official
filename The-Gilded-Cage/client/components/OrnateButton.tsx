import React from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
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

interface OrnateButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OrnateButton({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  size = "medium",
}: OrnateButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return GameColors.textSecondary;
    switch (variant) {
      case "secondary":
        return "transparent";
      case "danger":
        return GameColors.danger;
      default:
        return GameColors.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return GameColors.textSecondary;
    switch (variant) {
      case "secondary":
        return GameColors.accent;
      case "danger":
        return GameColors.danger;
      default:
        return GameColors.accent;
    }
  };

  const getTextColor = () => {
    if (variant === "secondary") return GameColors.accent;
    return GameColors.parchment;
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg };
      case "large":
        return { paddingVertical: Spacing.xl, paddingHorizontal: Spacing["3xl"] };
      default:
        return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 14;
      case "large":
        return 20;
      default:
        return 16;
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          opacity: disabled ? 0.5 : 1,
        },
        getPadding(),
        style,
        animatedStyle,
      ]}
    >
      <ThemedText
        style={[
          styles.buttonText,
          { color: getTextColor(), fontSize: getFontSize() },
        ]}
      >
        {children}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontWeight: "600",
    textAlign: "center",
  },
});
