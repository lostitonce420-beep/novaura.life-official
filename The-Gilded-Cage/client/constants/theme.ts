import { Platform } from "react-native";

export const GameColors = {
  primary: "#8B4513",
  accent: "#D4AF37",
  backgroundDark: "#2C2416",
  backgroundLight: "#F4E7D7",
  surface: "#F4E7D7",
  textPrimary: "#1A1209",
  textSecondary: "#5C4A3A",
  success: "#4A7C4E",
  danger: "#8B2500",
  gold: "#D4AF37",
  parchment: "#F4E7D7",
  ink: "#1A1209",
  wood: "#5C4033",
};

export const Colors = {
  light: {
    text: GameColors.textPrimary,
    buttonText: GameColors.parchment,
    tabIconDefault: GameColors.textSecondary,
    tabIconSelected: GameColors.accent,
    link: GameColors.accent,
    backgroundRoot: GameColors.backgroundDark,
    backgroundDefault: GameColors.surface,
    backgroundSecondary: "#E8D9C5",
    backgroundTertiary: "#DCC9B0",
  },
  dark: {
    text: GameColors.parchment,
    buttonText: GameColors.parchment,
    tabIconDefault: "#9BA1A6",
    tabIconSelected: GameColors.accent,
    link: GameColors.accent,
    backgroundRoot: GameColors.backgroundDark,
    backgroundDefault: "#3D3526",
    backgroundSecondary: "#4E4636",
    backgroundTertiary: "#5F5746",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const GameTypography = {
  display: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 32,
    lineHeight: 40,
  },
  title: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 24,
    lineHeight: 32,
  },
  heading: {
    fontFamily: "Cinzel_600SemiBold",
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: "Merriweather_400Regular",
    fontSize: 16,
    lineHeight: 26,
  },
  caption: {
    fontFamily: "Merriweather_400Regular",
    fontSize: 14,
    lineHeight: 22,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
