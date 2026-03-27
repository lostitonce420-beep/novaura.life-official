import React, { useState } from "react";
import { StyleSheet, View, ScrollView, ImageBackground, TextInput, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { useGame } from "@/context/GameContext";
import { useAI, AIProvider as AIProviderType } from "@/context/AIContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface SettingsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Settings">;
}

const PROVIDER_OPTIONS: { id: AIProviderType; name: string; description: string }[] = [
  { id: "ollama", name: "Ollama", description: "Local LLM - http://localhost:11434" },
  { id: "lmstudio", name: "LM Studio", description: "Local LLM - http://localhost:1234" },
  { id: "openai", name: "OpenAI", description: "Cloud API - requires API key" },
  { id: "custom", name: "Custom", description: "Custom OpenAI-compatible endpoint" },
];

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { resetGame, gameState } = useGame();
  const { aiSettings, updateAISettings } = useAI();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [localEndpoint, setLocalEndpoint] = useState(aiSettings.endpoint);
  const [localApiKey, setLocalApiKey] = useState(aiSettings.apiKey);
  const [localModel, setLocalModel] = useState(aiSettings.model);

  const handleToggleSound = (value: boolean) => {
    setSoundEnabled(value);
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleToggleHaptic = (value: boolean) => {
    setHapticEnabled(value);
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleProviderChange = (provider: AIProviderType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let endpoint = aiSettings.endpoint;
    let model = aiSettings.model;

    switch (provider) {
      case "ollama":
        endpoint = "http://localhost:11434";
        model = "llama2";
        break;
      case "lmstudio":
        endpoint = "http://localhost:1234";
        model = "local-model";
        break;
      case "openai":
        endpoint = "https://api.openai.com";
        model = "gpt-3.5-turbo";
        break;
      case "custom":
        break;
    }

    setLocalEndpoint(endpoint);
    setLocalModel(model);
    updateAISettings({ provider, endpoint, model });
  };

  const handleSaveAISettings = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateAISettings({
      endpoint: localEndpoint,
      apiKey: localApiKey,
      model: localModel,
    });
    Alert.alert("Success", "AI settings saved successfully!");
  };

  const handleToggleAI = (enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateAISettings({ enabled });
  };

  const handleDeleteSave = () => {
    Alert.alert(
      "Delete Save Data",
      "Are you sure you want to delete all save data? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("gameState");
              resetGame();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "All save data has been deleted.");
            } catch (error) {
              console.error("Failed to delete save:", error);
              Alert.alert("Error", "Failed to delete save data.");
            }
          },
        },
      ]
    );
  };

  const handleBackToTitle = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Title" }],
    });
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
            <ThemedText style={styles.title}>Settings</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150)} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>AI Conversations</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Enable AI-powered character dialogues using your local LLM or API
            </ThemedText>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="cpu" size={18} color={GameColors.accent} />
                <ThemedText style={styles.settingLabel}>Enable AI Chat</ThemedText>
              </View>
              <Switch
                value={aiSettings.enabled}
                onValueChange={handleToggleAI}
                trackColor={{ false: GameColors.textSecondary, true: GameColors.success }}
                thumbColor={GameColors.parchment}
              />
            </View>
          </Animated.View>

          {aiSettings.enabled ? (
            <Animated.View entering={FadeInUp.delay(175)} style={styles.section}>
              <ThemedText style={styles.sectionTitle}>AI Provider</ThemedText>

              <View style={styles.providerList}>
                {PROVIDER_OPTIONS.map((provider) => (
                  <OrnateButton
                    key={provider.id}
                    onPress={() => handleProviderChange(provider.id)}
                    variant={aiSettings.provider === provider.id ? "primary" : "secondary"}
                    size="small"
                    style={styles.providerButton}
                  >
                    <View style={styles.providerContent}>
                      <ThemedText style={styles.providerName}>{provider.name}</ThemedText>
                      <ThemedText style={styles.providerDesc}>{provider.description}</ThemedText>
                    </View>
                  </OrnateButton>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Endpoint URL</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={localEndpoint}
                  onChangeText={setLocalEndpoint}
                  placeholder="http://localhost:11434"
                  placeholderTextColor={GameColors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Model Name</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={localModel}
                  onChangeText={setLocalModel}
                  placeholder="llama2"
                  placeholderTextColor={GameColors.textSecondary}
                />
              </View>

              {(aiSettings.provider === "openai" || aiSettings.provider === "custom") ? (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>API Key</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={localApiKey}
                    onChangeText={setLocalApiKey}
                    placeholder="sk-..."
                    placeholderTextColor={GameColors.textSecondary}
                    secureTextEntry
                  />
                </View>
              ) : null}

              <OrnateButton onPress={handleSaveAISettings} style={styles.saveButton}>
                Save AI Settings
              </OrnateButton>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Audio & Feedback</ThemedText>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>Sound Effects</ThemedText>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleToggleSound}
                trackColor={{ false: GameColors.textSecondary, true: GameColors.accent }}
                thumbColor={GameColors.parchment}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>Haptic Feedback</ThemedText>
              </View>
              <Switch
                value={hapticEnabled}
                onValueChange={handleToggleHaptic}
                trackColor={{ false: GameColors.textSecondary, true: GameColors.accent }}
                thumbColor={GameColors.parchment}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Game Progress</ThemedText>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {gameState.completedQuests.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Quests</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {gameState.cluesFound.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Clues</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {Object.values(gameState.affinityPoints).reduce((a, b) => a + b, 0)}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Affinity</ThemedText>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400)} style={styles.buttonSection}>
            <OrnateButton
              onPress={handleBackToTitle}
              variant="secondary"
              size="large"
              style={styles.button}
            >
              Return to Title
            </OrnateButton>

            <OrnateButton
              onPress={handleDeleteSave}
              variant="danger"
              size="large"
              style={styles.button}
            >
              Delete Save Data
            </OrnateButton>
          </Animated.View>
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
  },
  section: {
    backgroundColor: GameColors.backgroundDark,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: GameColors.primary,
  },
  sectionTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.8,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.2)",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
  },
  providerList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  providerButton: {
    width: "100%",
  },
  providerContent: {
    alignItems: "flex-start",
    width: "100%",
  },
  providerName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
  },
  providerDesc: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.parchment,
    opacity: 0.7,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.accent,
    marginBottom: Spacing.xs,
  },
  textInput: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: GameTypography.display.fontFamily,
    fontSize: 28,
    color: GameColors.accent,
  },
  statLabel: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.8,
  },
  buttonSection: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  button: {
    width: "100%",
  },
});
