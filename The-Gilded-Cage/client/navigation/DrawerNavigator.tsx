import React from "react";
import { StyleSheet, View, Pressable, Platform } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { CommonActions } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import GalleryScreen from "@/screens/GalleryScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { GameColors, Spacing, GameTypography, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/context/AuthContext";

export type DrawerParamList = {
  Game: undefined;
  GalleryDrawer: undefined;
  SettingsDrawer: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await logout();
    props.navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Game",
            state: { routes: [{ name: "Login" }] },
          },
        ],
      })
    );
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.drawerContent,
        { paddingTop: insets.top + Spacing.xl },
      ]}
    >
      <View style={styles.headerSection}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <ThemedText style={styles.title}>The Gilded Cage</ThemedText>
        <ThemedText style={styles.subtitle}>Menu</ThemedText>
      </View>

      {user ? (
        <View style={styles.userBadge}>
          <Feather name="user" size={13} color={GameColors.accent} />
          <ThemedText style={styles.userText} numberOfLines={1}>
            {user.username}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.divider} />

      <DrawerItemList {...props} />

      <View style={styles.footer}>
        {user ? (
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Feather name="log-out" size={14} color={GameColors.danger} />
            <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
          </Pressable>
        ) : null}
        <ThemedText style={styles.footerText}>
          A Tale of Mystery and Choice
        </ThemedText>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: "front",
        drawerStyle: {
          backgroundColor: GameColors.backgroundDark,
          width: 280,
        },
        drawerActiveBackgroundColor: "rgba(212, 175, 55, 0.2)",
        drawerActiveTintColor: GameColors.accent,
        drawerInactiveTintColor: GameColors.parchment,
        drawerLabelStyle: {
          fontFamily: GameTypography.heading.fontFamily,
          fontSize: 16,
          marginLeft: -Spacing.md,
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Game"
        component={RootStackNavigator}
        options={{
          drawerLabel: "Continue Game",
          drawerIcon: ({ color, size }) => (
            <Feather name="play-circle" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="GalleryDrawer"
        component={GalleryScreen}
        options={{
          drawerLabel: "Character Gallery",
          drawerIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
          ...screenOptions,
          headerShown: true,
          headerTitle: "Gallery",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
          headerTintColor: GameColors.parchment,
        }}
      />
      <Drawer.Screen
        name="SettingsDrawer"
        component={SettingsScreen}
        options={{
          drawerLabel: "Settings",
          drawerIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
          ...screenOptions,
          headerShown: true,
          headerTitle: "Settings",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
          headerTintColor: GameColors.parchment,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 20,
    color: GameColors.accent,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.3)",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  userText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
    opacity: 0.8,
    flex: 1,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(139, 37, 0, 0.3)",
    backgroundColor: "rgba(139, 37, 0, 0.08)",
    alignSelf: "stretch",
    marginHorizontal: 0,
  },
  logoutText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.danger,
  },
  footerText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.5,
    fontStyle: "italic",
    textAlign: "center",
  },
});
