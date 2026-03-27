import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";

import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import TitleScreen from "@/screens/TitleScreen";
import IntroScreen from "@/screens/IntroScreen";
import CharacterSelectionScreen from "@/screens/CharacterSelectionScreen";
import DialogueScreen from "@/screens/DialogueScreen";
import PuzzleScreen from "@/screens/PuzzleScreen";
import ChoiceScreen from "@/screens/ChoiceScreen";
import EndingScreen from "@/screens/EndingScreen";
import GalleryScreen from "@/screens/GalleryScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ExplorationScreen from "@/screens/ExplorationScreen";
import QuestDialogueScreen from "@/screens/QuestDialogueScreen";
import QuestLogScreen from "@/screens/QuestLogScreen";
import CharacterInteractionScreen from "@/screens/CharacterInteractionScreen";
import HotSpringsScreen from "@/screens/HotSpringsScreen";
import ImmersiveSceneScreen from "@/screens/ImmersiveSceneScreen";
import TownScreen from "@/screens/TownScreen";
import BuildingInteriorScreen from "@/screens/BuildingInteriorScreen";
import DungeonScreen from "@/screens/DungeonScreen";
import CombatScreen from "@/screens/CombatScreen";
import HeroStatusScreen from "@/screens/HeroStatusScreen";
import TownQuestsScreen from "@/screens/TownQuestsScreen";
import MemoryJournalScreen from "@/screens/MemoryJournalScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { GameColors } from "@/constants/theme";
import { ImmersiveScene } from "@/data/immersiveScenes";
import { EnemyType } from "@/data/steampunkWorld";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Title: undefined;
  Intro: undefined;
  CharacterSelection: undefined;
  Dialogue: undefined;
  Puzzle: undefined;
  Choice: undefined;
  Ending: undefined;
  Gallery: undefined;
  Settings: undefined;
  Exploration: undefined;
  QuestDialogue: { questId: string };
  QuestLog: undefined;
  CharacterInteraction: { characterId: string };
  HotSprings: undefined;
  ImmersiveScene: { scene: ImmersiveScene };
  Town: undefined;
  BuildingInterior: { buildingId: string };
  Dungeon: undefined;
  Combat: { enemy: EnemyType; dungeonFloor: number };
  HeroStatus: undefined;
  TownQuests: undefined;
  MemoryJournal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MenuButton() {
  const navigation = useNavigation();
  return (
    <HeaderButton
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <Feather name="menu" size={24} color={GameColors.parchment} />
    </HeaderButton>
  );
}

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        headerTintColor: GameColors.parchment,
        contentStyle: {
          backgroundColor: GameColors.backgroundDark,
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Title"
        component={TitleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Intro"
        component={IntroScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Exploration"
        component={ExplorationScreen}
        options={{
          headerTitle: "Explore",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
          headerLeft: () => <MenuButton />,
        }}
      />
      <Stack.Screen
        name="CharacterSelection"
        component={CharacterSelectionScreen}
        options={{
          headerTitle: "Choose Companion",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
        }}
      />
      <Stack.Screen
        name="Dialogue"
        component={DialogueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuestDialogue"
        component={QuestDialogueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuestLog"
        component={QuestLogScreen}
        options={{
          headerTitle: "Quest Log",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
        }}
      />
      <Stack.Screen
        name="CharacterInteraction"
        component={CharacterInteractionScreen}
        options={{
          headerTitle: "",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="Puzzle"
        component={PuzzleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Choice"
        component={ChoiceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Ending"
        component={EndingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          headerTitle: "Gallery",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
        }}
      />
      <Stack.Screen
        name="HotSprings"
        component={HotSpringsScreen}
        options={{
          headerTitle: "Hot Springs",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="ImmersiveScene"
        component={ImmersiveSceneScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Town"
        component={TownScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BuildingInterior"
        component={BuildingInteriorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Dungeon"
        component={DungeonScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Combat"
        component={CombatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HeroStatus"
        component={HeroStatusScreen}
        options={{
          headerTitle: "Hero Status",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
        }}
      />
      <Stack.Screen
        name="TownQuests"
        component={TownQuestsScreen}
        options={{
          headerTitle: "Town Quests",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
        }}
      />
      <Stack.Screen
        name="MemoryJournal"
        component={MemoryJournalScreen}
        options={{
          headerTitle: "Memory Journal",
          headerTitleStyle: {
            fontFamily: "Cinzel_600SemiBold",
            color: GameColors.parchment,
          },
        }}
      />
    </Stack.Navigator>
  );
}
