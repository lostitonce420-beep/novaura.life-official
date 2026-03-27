import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  ImageSourcePropType,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  cancelAnimation,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  GameColors,
  Spacing,
  BorderRadius,
  GameTypography,
} from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { townBuildings, TownBuilding } from "@/data/steampunkWorld";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");
const MAP_WIDTH = SCREEN_WIDTH;
const MAP_HEIGHT = SCREEN_HEIGHT * 1.6;

const BUILDING_SPRITES: Record<string, ImageSourcePropType> = {
  "town-square": require("../../assets/images/sprites/building-town-square.png"),
  "general-store": require("../../assets/images/sprites/building-general-store.png"),
  blacksmith: require("../../assets/images/sprites/building-blacksmith.png"),
  tavern: require("../../assets/images/sprites/building-tavern.png"),
  "guild-hall": require("../../assets/images/sprites/building-guild.png"),
  "dungeon-entrance": require("../../assets/images/sprites/building-dungeon.png"),
  mansion: require("../../assets/images/sprites/building-manor.png"),
};

const DECO_SPRITES = {
  lamppost: require("../../assets/images/sprites/deco-lamppost.png"),
  barrels: require("../../assets/images/sprites/deco-barrels.png"),
  fence: require("../../assets/images/sprites/deco-fence.png"),
  tree: require("../../assets/images/sprites/deco-tree.png"),
  steamvent: require("../../assets/images/sprites/deco-steamvent.png"),
};

const BUILDING_POSITIONS: Record<
  string,
  { x: number; y: number; scale: number; zIndex: number }
> = {
  "town-square": { x: 0.3, y: 0.08, scale: 0.9, zIndex: 2 },
  "general-store": { x: 0.02, y: 0.22, scale: 0.75, zIndex: 3 },
  blacksmith: { x: 0.52, y: 0.2, scale: 0.78, zIndex: 3 },
  tavern: { x: 0.08, y: 0.38, scale: 0.82, zIndex: 4 },
  "guild-hall": { x: 0.5, y: 0.4, scale: 0.85, zIndex: 4 },
  "dungeon-entrance": { x: 0.25, y: 0.56, scale: 0.95, zIndex: 5 },
  mansion: { x: 0.1, y: 0.72, scale: 1.0, zIndex: 6 },
};

const ROAD_SEGMENTS = [
  { x1: 0.50, y1: 0.16, x2: 0.22, y2: 0.28, width: 14 },
  { x1: 0.50, y1: 0.16, x2: 0.72, y2: 0.26, width: 14 },
  { x1: 0.22, y1: 0.28, x2: 0.20, y2: 0.44, width: 12 },
  { x1: 0.72, y1: 0.26, x2: 0.68, y2: 0.46, width: 12 },
  { x1: 0.22, y1: 0.34, x2: 0.50, y2: 0.34, width: 10 },
  { x1: 0.50, y1: 0.16, x2: 0.46, y2: 0.34, width: 10 },
  { x1: 0.35, y1: 0.44, x2: 0.55, y2: 0.46, width: 10 },
  { x1: 0.20, y1: 0.44, x2: 0.42, y2: 0.60, width: 14 },
  { x1: 0.68, y1: 0.46, x2: 0.46, y2: 0.60, width: 12 },
  { x1: 0.42, y1: 0.64, x2: 0.30, y2: 0.78, width: 14 },
];

const COBBLESTONES = [
  { x: 0.36, y: 0.20 }, { x: 0.42, y: 0.18 },
  { x: 0.30, y: 0.25 }, { x: 0.55, y: 0.22 },
  { x: 0.60, y: 0.20 }, { x: 0.25, y: 0.30 },
  { x: 0.38, y: 0.32 }, { x: 0.45, y: 0.30 },
  { x: 0.62, y: 0.30 }, { x: 0.18, y: 0.36 },
  { x: 0.30, y: 0.40 }, { x: 0.55, y: 0.38 },
  { x: 0.65, y: 0.42 }, { x: 0.40, y: 0.45 },
  { x: 0.50, y: 0.50 }, { x: 0.35, y: 0.52 },
  { x: 0.45, y: 0.55 }, { x: 0.30, y: 0.58 },
  { x: 0.55, y: 0.54 }, { x: 0.38, y: 0.62 },
  { x: 0.42, y: 0.68 }, { x: 0.35, y: 0.72 },
  { x: 0.28, y: 0.75 },
];

interface LamppostData {
  x: number;
  y: number;
  size: number;
}

const LAMPPOSTS: LamppostData[] = [
  { x: 0.28, y: 0.17, size: 1 },
  { x: 0.62, y: 0.18, size: 0.9 },
  { x: 0.15, y: 0.32, size: 0.85 },
  { x: 0.46, y: 0.33, size: 0.9 },
  { x: 0.65, y: 0.38, size: 0.85 },
  { x: 0.30, y: 0.50, size: 1 },
  { x: 0.58, y: 0.52, size: 0.9 },
  { x: 0.22, y: 0.68, size: 1 },
  { x: 0.48, y: 0.70, size: 0.85 },
];

interface DecorationData {
  x: number;
  y: number;
  type: "barrels" | "fence" | "tree" | "steamvent";
  scale?: number;
}

const DECORATIONS: DecorationData[] = [
  { x: 0.15, y: 0.19, type: "barrels", scale: 0.6 },
  { x: 0.82, y: 0.23, type: "barrels", scale: 0.5 },
  { x: 0.05, y: 0.34, type: "fence", scale: 0.55 },
  { x: 0.88, y: 0.30, type: "steamvent", scale: 0.5 },
  { x: 0.75, y: 0.50, type: "barrels", scale: 0.55 },
  { x: 0.08, y: 0.52, type: "steamvent", scale: 0.45 },
  { x: 0.85, y: 0.57, type: "fence", scale: 0.5 },
  { x: 0.05, y: 0.64, type: "barrels", scale: 0.5 },
  { x: 0.78, y: 0.70, type: "fence", scale: 0.55 },
  { x: 0.55, y: 0.75, type: "barrels", scale: 0.6 },
  { x: 0.90, y: 0.42, type: "steamvent", scale: 0.45 },
  { x: 0.70, y: 0.62, type: "barrels", scale: 0.5 },
  { x: 0.92, y: 0.14, type: "tree", scale: 0.6 },
  { x: 0.0, y: 0.28, type: "tree", scale: 0.55 },
  { x: 0.88, y: 0.48, type: "tree", scale: 0.5 },
  { x: 0.0, y: 0.58, type: "tree", scale: 0.55 },
  { x: 0.92, y: 0.72, type: "tree", scale: 0.5 },
];

interface SmokeData {
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
}

const SMOKE_SOURCES: SmokeData[] = [
  { x: 0.70, y: 0.19, delay: 0, duration: 3000, size: 16 },
  { x: 0.73, y: 0.18, delay: 800, duration: 3500, size: 12 },
  { x: 0.68, y: 0.20, delay: 1500, duration: 2800, size: 14 },
  { x: 0.22, y: 0.37, delay: 400, duration: 3200, size: 14 },
  { x: 0.25, y: 0.36, delay: 1200, duration: 2900, size: 10 },
  { x: 0.18, y: 0.38, delay: 2000, duration: 3400, size: 12 },
];

const STEAM_VENTS: { x: number; y: number; delay: number }[] = [
  { x: 0.08, y: 0.52, delay: 0 },
  { x: 0.90, y: 0.42, delay: 1500 },
  { x: 0.35, y: 0.64, delay: 3000 },
];

interface TownScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Town">;
}

const WELCOME_SEEN_KEY = "ironhaven_welcome_seen";

function SmokeParticle({ smoke }: { smoke: SmokeData }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      smoke.delay,
      withRepeat(
        withTiming(1, { duration: smoke.duration, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    return () => cancelAnimation(progress);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 0.7, 1], [0, 0.4, 0.25, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -40]) },
      { translateX: interpolate(progress.value, [0, 1], [0, 8]) },
      { scale: interpolate(progress.value, [0, 1], [0.5, 1.5]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: smoke.x * MAP_WIDTH - smoke.size / 2,
          top: smoke.y * MAP_HEIGHT - smoke.size / 2,
          width: smoke.size,
          height: smoke.size,
          borderRadius: smoke.size / 2,
          backgroundColor: "rgba(180, 180, 180, 0.5)",
        },
        animStyle,
      ]}
    />
  );
}

function SteamVent({ x, y, delay }: { x: number; y: number; delay: number }) {
  const burst = useSharedValue(0);

  useEffect(() => {
    burst.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1800, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        false
      )
    );
    return () => cancelAnimation(burst);
  }, []);

  const ventStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.5, 1], [0, 0.6, 0]),
    transform: [
      { translateY: interpolate(burst.value, [0, 1], [0, -30]) },
      { scaleX: interpolate(burst.value, [0, 0.3, 1], [0.3, 1.5, 2]) },
      { scaleY: interpolate(burst.value, [0, 1], [0.5, 1.2]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x * MAP_WIDTH - 10,
          top: y * MAP_HEIGHT - 8,
          width: 20,
          height: 16,
          borderRadius: 10,
          backgroundColor: "rgba(200, 200, 210, 0.4)",
        },
        ventStyle,
      ]}
    />
  );
}

function LamppostGlow({ lamp }: { lamp: LamppostData }) {
  const glow = useSharedValue(0.6);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(glow);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0.6, 1], [0.2, 0.45]),
    transform: [{ scale: interpolate(glow.value, [0.6, 1], [0.9, 1.15]) }],
  }));

  const spriteH = MAP_WIDTH * 0.12 * lamp.size;
  const spriteW = spriteH * 0.55;
  const glowSize = spriteW * 2.2;

  return (
    <View
      style={{
        position: "absolute",
        left: lamp.x * MAP_WIDTH - spriteW / 2,
        top: lamp.y * MAP_HEIGHT - spriteH,
        alignItems: "center",
        zIndex: 1,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -glowSize * 0.1,
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: "rgba(255, 180, 50, 0.25)",
            left: (spriteW - glowSize) / 2,
          },
          glowStyle,
        ]}
      />
      <Image
        source={DECO_SPRITES.lamppost}
        style={{ width: spriteW, height: spriteH }}
        contentFit="contain"
      />
    </View>
  );
}

function SelectionPulse() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(pulse);
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.35]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.1]) }],
  }));

  const midStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.25, 0.55]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.06]) }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0.8]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.03]) }],
  }));

  return (
    <>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -12,
            left: -12,
            right: -12,
            bottom: 14,
            borderRadius: BorderRadius.xl,
            backgroundColor: "rgba(212, 175, 55, 0.06)",
          },
          outerStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -8,
            left: -8,
            right: -8,
            bottom: 18,
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderColor: "rgba(212, 175, 55, 0.3)",
            backgroundColor: "rgba(212, 175, 55, 0.05)",
          },
          midStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -4,
            left: -4,
            right: -4,
            bottom: 22,
            borderRadius: BorderRadius.md,
            borderWidth: 2,
            borderColor: GameColors.accent,
            backgroundColor: "rgba(212, 175, 55, 0.08)",
            shadowColor: "#D4AF37",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 8,
          },
          innerStyle,
        ]}
      />
    </>
  );
}

function Decoration({ deco }: { deco: DecorationData }) {
  const scale = deco.scale || 0.5;
  const baseSize = MAP_WIDTH * 0.15;
  const w = baseSize * scale;
  const h = deco.type === "fence" ? w * 0.6 : deco.type === "tree" ? w * 1.3 : w;

  const sprite = DECO_SPRITES[deco.type];

  return (
    <View style={{
      position: "absolute",
      left: deco.x * MAP_WIDTH,
      top: deco.y * MAP_HEIGHT,
      zIndex: 1,
    }}>
      <Image
        source={sprite}
        style={{ width: w, height: h }}
        contentFit="contain"
      />
    </View>
  );
}

function RoadSegment({ segment }: { segment: typeof ROAD_SEGMENTS[0] }) {
  const x1 = segment.x1 * MAP_WIDTH;
  const y1 = segment.y1 * MAP_HEIGHT;
  const x2 = segment.x2 * MAP_WIDTH;
  const y2 = segment.y2 * MAP_HEIGHT;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  return (
    <View
      style={{
        position: "absolute",
        left: cx - length / 2,
        top: cy - segment.width / 2,
        width: length,
        height: segment.width,
        backgroundColor: "rgba(92, 72, 48, 0.35)",
        borderRadius: segment.width / 2,
        borderWidth: 1,
        borderColor: "rgba(120, 96, 60, 0.2)",
        transform: [{ rotate: `${angle}deg` }],
        zIndex: 0,
      }}
    />
  );
}

function CobblestoneDetail({ x, y }: { x: number; y: number }) {
  const sizes = [4, 5, 6, 3, 5];
  const idx = Math.floor((x * 100 + y * 100) % sizes.length);
  const s = sizes[idx];

  return (
    <View
      style={{
        position: "absolute",
        left: x * MAP_WIDTH,
        top: y * MAP_HEIGHT,
        width: s,
        height: s,
        borderRadius: s / 2,
        backgroundColor: "rgba(100, 80, 55, 0.25)",
        borderWidth: 0.5,
        borderColor: "rgba(120, 100, 70, 0.15)",
        zIndex: 0,
      }}
    />
  );
}

function EntranceArrow() {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(bounce);
  }, []);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(bounce.value, [0, 1], [0, 6]) },
    ],
    opacity: interpolate(bounce.value, [0, 0.5, 1], [0.6, 1, 0.6]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 28,
          alignSelf: "center",
          left: "50%",
          marginLeft: -8,
        },
        arrowStyle,
      ]}
    >
      <Feather name="chevron-down" size={16} color={GameColors.accent} />
    </Animated.View>
  );
}

function DungeonSparkle({ buildingX, buildingY, buildingW }: { buildingX: number; buildingY: number; buildingW: number }) {
  const sparkles = [
    { offsetX: -0.1, offsetY: -0.02, delay: 0, size: 4 },
    { offsetX: 0.15, offsetY: -0.04, delay: 400, size: 3 },
    { offsetX: -0.05, offsetY: -0.06, delay: 800, size: 5 },
    { offsetX: 0.1, offsetY: -0.01, delay: 1200, size: 3 },
    { offsetX: -0.15, offsetY: -0.05, delay: 1600, size: 4 },
    { offsetX: 0.08, offsetY: -0.07, delay: 2000, size: 3 },
  ];

  return (
    <>
      {sparkles.map((s, i) => (
        <SparkleParticle
          key={`sparkle-${i}`}
          x={buildingX + buildingW / 2 + s.offsetX * MAP_WIDTH}
          y={buildingY + s.offsetY * MAP_HEIGHT}
          delay={s.delay}
          size={s.size}
        />
      ))}
    </>
  );
}

function SparkleParticle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  const twinkle = useSharedValue(0);

  useEffect(() => {
    twinkle.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );
    return () => cancelAnimation(twinkle);
  }, []);

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(twinkle.value, [0, 0.5, 1], [0, 1, 0]),
    transform: [
      { scale: interpolate(twinkle.value, [0, 0.5, 1], [0.3, 1.2, 0.3]) },
      { translateY: interpolate(twinkle.value, [0, 1], [0, -15]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#FFD700",
          shadowColor: "#FFD700",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 4,
          elevation: 3,
        },
        sparkleStyle,
      ]}
    />
  );
}

const FOREGROUND_PIPES: { x: number; y: number; width: number; angle: number; zIndex: number }[] = [
  { x: 0.0, y: 0.15, width: 80, angle: 15, zIndex: 10 },
  { x: 0.82, y: 0.30, width: 70, angle: -10, zIndex: 10 },
  { x: 0.0, y: 0.48, width: 60, angle: 8, zIndex: 10 },
  { x: 0.85, y: 0.55, width: 75, angle: -12, zIndex: 10 },
  { x: 0.0, y: 0.70, width: 65, angle: 5, zIndex: 10 },
];

const OVERHEAD_CHAINS: { x: number; y: number; length: number }[] = [
  { x: 0.20, y: 0.12, length: 20 },
  { x: 0.75, y: 0.25, length: 18 },
  { x: 0.40, y: 0.48, length: 22 },
  { x: 0.60, y: 0.65, length: 16 },
];

function ForegroundLayer() {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 8 }} pointerEvents="none">
      {FOREGROUND_PIPES.map((pipe, i) => (
        <View
          key={`fg-pipe-${i}`}
          style={{
            position: "absolute",
            left: pipe.x * MAP_WIDTH,
            top: pipe.y * MAP_HEIGHT,
            width: pipe.width,
            height: 5,
            backgroundColor: "rgba(80, 70, 55, 0.6)",
            borderRadius: 3,
            borderWidth: 1,
            borderColor: "rgba(100, 90, 70, 0.4)",
            transform: [{ rotate: `${pipe.angle}deg` }],
            zIndex: pipe.zIndex,
          }}
        />
      ))}
      {OVERHEAD_CHAINS.map((chain, i) => (
        <View
          key={`fg-chain-${i}`}
          style={{
            position: "absolute",
            left: chain.x * MAP_WIDTH,
            top: chain.y * MAP_HEIGHT,
            width: 2,
            height: chain.length,
            backgroundColor: "rgba(120, 100, 60, 0.5)",
            borderRadius: 1,
          }}
        >
          <View style={{
            position: "absolute",
            bottom: -4,
            left: -3,
            width: 8,
            height: 8,
            borderRadius: 4,
            borderWidth: 1.5,
            borderColor: "rgba(140, 120, 70, 0.5)",
            backgroundColor: "transparent",
          }} />
        </View>
      ))}
    </View>
  );
}

export default function TownScreen({ navigation }: TownScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedBuilding, setSelectedBuilding] =
    useState<TownBuilding | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SEEN_KEY).then((val) => {
      if (!val) setShowWelcome(true);
    });
  }, []);

  const handleBuildingPress = (building: TownBuilding) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (selectedBuilding?.id === building.id) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(building);
    }
  };

  const handleEnterBuilding = () => {
    if (!selectedBuilding) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (selectedBuilding.type === "dungeon") {
      navigation.navigate("Dungeon");
    } else {
      navigation.navigate("BuildingInterior", {
        buildingId: selectedBuilding.id,
      });
    }
  };

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    AsyncStorage.setItem(WELCOME_SEEN_KEY, "1");
  };

  const BUILDING_SIZE = MAP_WIDTH * 0.42;

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/town-background.png")}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      <View style={styles.darkenOverlay} />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <ThemedText style={styles.townTitle}>IRONHAVEN</ThemedText>
        <ThemedText style={styles.townSubtitle}>
          City of Gears and Secrets
        </ThemedText>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.mapScroll}
        contentContainerStyle={[
          styles.mapContainer,
          { height: MAP_HEIGHT, paddingTop: insets.top + 70 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={[styles.mapCanvas, { width: MAP_WIDTH, height: MAP_HEIGHT }]}>

          {ROAD_SEGMENTS.map((seg, i) => (
            <RoadSegment key={`road-${i}`} segment={seg} />
          ))}

          {COBBLESTONES.map((stone, i) => (
            <CobblestoneDetail key={`stone-${i}`} x={stone.x} y={stone.y} />
          ))}

          {DECORATIONS.map((deco, i) => (
            <Decoration key={`deco-${i}`} deco={deco} />
          ))}

          {LAMPPOSTS.map((lamp, i) => (
            <LamppostGlow key={`lamp-${i}`} lamp={lamp} />
          ))}

          {townBuildings.map((building) => {
            const pos = BUILDING_POSITIONS[building.id] || {
              x: 0.3, y: 0.5, scale: 0.8, zIndex: 2,
            };
            const sprite = BUILDING_SPRITES[building.id];
            const isSelected = selectedBuilding?.id === building.id;
            const buildingW = BUILDING_SIZE * pos.scale;
            const buildingH = BUILDING_SIZE * pos.scale;

            return (
              <Animated.View
                key={building.id}
                entering={FadeIn.delay(
                  townBuildings.indexOf(building) * 150
                )}
                style={[
                  styles.buildingWrapper,
                  {
                    left: pos.x * MAP_WIDTH,
                    top: pos.y * MAP_HEIGHT,
                    width: buildingW,
                    height: buildingH + 30,
                    zIndex: pos.zIndex,
                  },
                ]}
              >
                <Pressable
                  onPress={() => handleBuildingPress(building)}
                  disabled={!building.unlocked}
                  style={styles.buildingPressable}
                  testID={`building-${building.id}`}
                >
                  <View style={[
                    styles.buildingShadow,
                    {
                      width: buildingW * 0.7,
                      height: buildingH * 0.12,
                      bottom: 26,
                    }
                  ]} />

                  {isSelected ? <SelectionPulse /> : null}

                  {sprite ? (
                    <Image
                      source={sprite}
                      style={[
                        styles.buildingSprite,
                        { width: buildingW, height: buildingH },
                        isSelected && styles.selectedSprite,
                      ]}
                      contentFit="contain"
                    />
                  ) : null}

                  {isSelected ? <EntranceArrow /> : null}

                  <View
                    style={[
                      styles.buildingLabel,
                      isSelected && styles.selectedLabel,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.buildingName,
                        isSelected && styles.selectedName,
                      ]}
                      numberOfLines={1}
                    >
                      {building.name}
                    </ThemedText>
                  </View>

                  {!building.unlocked ? (
                    <View style={styles.lockedOverlay}>
                      <Feather
                        name="lock"
                        size={24}
                        color={GameColors.parchment}
                      />
                    </View>
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          })}

          {SMOKE_SOURCES.map((smoke, i) => (
            <SmokeParticle key={`smoke-${i}`} smoke={smoke} />
          ))}

          {STEAM_VENTS.map((vent, i) => (
            <SteamVent key={`vent-${i}`} x={vent.x} y={vent.y} delay={vent.delay} />
          ))}

          {(() => {
            const dungeonPos = BUILDING_POSITIONS["dungeon-entrance"];
            if (!dungeonPos) return null;
            const dungeonW = BUILDING_SIZE * dungeonPos.scale;
            return (
              <DungeonSparkle
                buildingX={dungeonPos.x * MAP_WIDTH}
                buildingY={dungeonPos.y * MAP_HEIGHT}
                buildingW={dungeonW}
              />
            );
          })()}

          <ForegroundLayer />
        </View>
      </ScrollView>

      <LinearGradient
        colors={["rgba(44, 36, 22, 0.85)", "rgba(44, 36, 22, 0)"]}
        style={[styles.fogTop, { top: insets.top + 64 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(44, 36, 22, 0)", "rgba(44, 36, 22, 0.8)"]}
        style={[styles.fogBottom, { bottom: 56 + insets.bottom }]}
        pointerEvents="none"
      />

      {selectedBuilding ? (
        <Animated.View
          entering={SlideInUp.duration(300)}
          style={[
            styles.detailPanel,
            { paddingBottom: insets.bottom + Spacing.sm },
          ]}
        >
          <View style={styles.panelHandle} />
          <View style={styles.panelHeader}>
            <Image
              source={BUILDING_SPRITES[selectedBuilding.id]}
              style={styles.panelThumb}
              contentFit="contain"
            />
            <View style={styles.panelInfo}>
              <ThemedText style={styles.panelName}>
                {selectedBuilding.name}
              </ThemedText>
              <ThemedText style={styles.panelType}>
                {selectedBuilding.type === "special"
                  ? "Landmark"
                  : selectedBuilding.type.charAt(0).toUpperCase() +
                    selectedBuilding.type.slice(1)}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => setSelectedBuilding(null)}
              style={styles.panelClose}
            >
              <Feather name="x" size={20} color={GameColors.parchment} />
            </Pressable>
          </View>

          <ThemedText style={styles.panelDescription}>
            {selectedBuilding.description}
          </ThemedText>

          <View style={styles.panelNPCs}>
            {selectedBuilding.interior.npcs.length > 0 ? (
              <ThemedText style={styles.panelNPCLabel}>
                {selectedBuilding.interior.npcs
                  .map((npc) => npc.name)
                  .join(" | ")}
              </ThemedText>
            ) : null}
          </View>

          <OrnateButton
            onPress={handleEnterBuilding}
            style={styles.enterButton}
          >
            {selectedBuilding.type === "dungeon"
              ? "Enter the Dungeon"
              : `Enter ${selectedBuilding.name}`}
          </OrnateButton>
        </Animated.View>
      ) : null}

      <View
        style={[
          styles.bottomNav,
          { paddingBottom: insets.bottom + Spacing.xs },
        ]}
      >
        <Pressable
          style={styles.navButton}
          onPress={() => navigation.navigate("HeroStatus")}
          testID="nav-hero"
        >
          <Image
            source={require("../../assets/images/sprites/hero-portrait.png")}
            style={styles.navIcon}
            contentFit="cover"
          />
          <ThemedText style={styles.navText}>Hero</ThemedText>
        </Pressable>
        <Pressable
          style={styles.navButton}
          onPress={() => navigation.navigate("TownQuests")}
          testID="nav-quests"
        >
          <View style={styles.navIconPlaceholder}>
            <Feather name="file-text" size={18} color={GameColors.accent} />
          </View>
          <ThemedText style={styles.navText}>Quests</ThemedText>
        </Pressable>
        <Pressable
          style={styles.navButton}
          onPress={() => navigation.navigate("MemoryJournal")}
          testID="nav-memories"
        >
          <View style={styles.navIconPlaceholder}>
            <Feather name="book-open" size={18} color="#B8A9C9" />
          </View>
          <ThemedText style={styles.navText}>Memories</ThemedText>
        </Pressable>
      </View>

      {showWelcome ? (
        <Animated.View entering={FadeIn} style={styles.welcomeOverlay}>
          <Animated.View entering={FadeInUp.delay(200)} style={styles.welcomePanel}>
            <Image
              source={require("../../assets/images/sprites/building-town-square.png")}
              style={styles.welcomeImage}
              contentFit="contain"
            />
            <ThemedText style={styles.welcomeTitle}>
              Welcome to Ironhaven
            </ThemedText>
            <ThemedText style={styles.welcomeText}>
              You've escaped the Gilded Cage, but your journey is just
              beginning. This steampunk city holds the key to your forgotten
              past.
            </ThemedText>
            <ThemedText style={styles.welcomeText}>
              Explore the town, meet its people, and delve into the Great
              Dungeon to uncover the truth of who you really are.
            </ThemedText>
            <OrnateButton onPress={handleDismissWelcome}>
              Begin Your Adventure
            </OrnateButton>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.backgroundDark,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  darkenOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
    paddingBottom: Spacing.sm,
    backgroundColor: "rgba(44, 36, 22, 0.85)",
    borderBottomWidth: 2,
    borderBottomColor: GameColors.accent,
  },
  townTitle: {
    fontFamily: GameTypography.display.fontFamily,
    fontSize: 28,
    color: GameColors.accent,
    letterSpacing: 6,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  townSubtitle: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.7,
    fontStyle: "italic",
  },
  mapScroll: {
    flex: 1,
  },
  mapContainer: {
    width: "100%",
  },
  mapCanvas: {
    position: "relative",
  },
  buildingWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  buildingPressable: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  buildingShadow: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 100,
  },
  buildingSprite: {
    borderRadius: BorderRadius.md,
  },
  selectedSprite: {
    borderWidth: 2,
    borderColor: GameColors.accent,
    borderRadius: BorderRadius.md,
  },
  buildingLabel: {
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.5)",
  },
  selectedLabel: {
    backgroundColor: "rgba(212, 175, 55, 0.3)",
    borderColor: GameColors.accent,
  },
  buildingName: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.parchment,
    textAlign: "center",
  },
  selectedName: {
    color: GameColors.accent,
    fontFamily: GameTypography.heading.fontFamily,
  },
  lockedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 26,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  fogTop: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 40,
    zIndex: 10,
  },
  fogBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 50,
    zIndex: 10,
  },
  detailPanel: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "rgba(44, 36, 22, 0.97)",
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderTopWidth: 2,
    borderColor: GameColors.accent,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(212, 175, 55, 0.4)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  panelThumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  panelInfo: {
    flex: 1,
  },
  panelName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 20,
    color: GameColors.accent,
  },
  panelType: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.7,
  },
  panelClose: {
    padding: Spacing.sm,
  },
  panelDescription: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
    lineHeight: 20,
    marginBottom: Spacing.md,
    opacity: 0.9,
  },
  panelNPCs: {
    marginBottom: Spacing.md,
  },
  panelNPCLabel: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.accent,
    opacity: 0.8,
  },
  enterButton: {
    width: "100%",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(44, 36, 22, 0.95)",
    borderTopWidth: 2,
    borderTopColor: GameColors.primary,
    paddingTop: Spacing.sm,
    zIndex: 100,
  },
  navButton: {
    alignItems: "center",
    padding: Spacing.xs,
    minWidth: 60,
  },
  navIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  navIconPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  navText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.parchment,
    marginTop: 2,
  },
  welcomeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    zIndex: 200,
  },
  welcomePanel: {
    backgroundColor: "rgba(44, 36, 22, 0.97)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: GameColors.accent,
    maxWidth: 340,
  },
  welcomeImage: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 24,
    color: GameColors.accent,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  welcomeText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
});
