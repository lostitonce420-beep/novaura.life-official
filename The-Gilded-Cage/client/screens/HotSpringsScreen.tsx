import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, ImageBackground, Pressable, TextInput } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { DialogueBox } from "@/components/DialogueBox";
import { useGame } from "@/context/GameContext";
import { useAI } from "@/context/AIContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface HotSpringsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "HotSprings">;
}

const ROTATION_INTERVAL = 30000;

export default function HotSpringsScreen({ navigation }: HotSpringsScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { 
    characters, 
    gameState, 
    getCharacterPortrait, 
    getAffinityLevel, 
    addAffinityPoints,
    addClue,
    completeQuest 
  } = useGame();
  const { generateResponse, isLoading, aiSettings } = useAI();

  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(
    Math.floor(Math.random() * characters.length)
  );
  const [showDialogue, setShowDialogue] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [hasGainedInfo, setHasGainedInfo] = useState(false);

  const currentCharacter = characters[currentCharacterIndex];
  const portrait = getCharacterPortrait(currentCharacter.id);
  const affinityLevel = getAffinityLevel(currentCharacter.id);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!showDialogue) {
        rotateCharacter();
      }
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [showDialogue]);

  const rotateCharacter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentCharacterIndex((prev) => (prev + 1) % characters.length);
    setConversationHistory([]);
    setCurrentResponse("");
    setHasGainedInfo(false);
  };

  const handleApproach = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDialogue(true);
    setCurrentResponse(getInitialGreeting());
  };

  const getInitialGreeting = () => {
    const greetings = [
      `*${currentCharacter.name} looks up as you approach* Oh, you've found the springs. The water is warm tonight...`,
      `*${currentCharacter.name} relaxes in the steaming water* Come to join me? The springs have a way of loosening tongues...`,
      `*${currentCharacter.name} smiles invitingly* These waters are one of the few freedoms we have here. Care to share them?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const message = userInput.trim();
    setUserInput("");

    const newHistory = [...conversationHistory, { role: "user" as const, content: message }];
    setConversationHistory(newHistory);

    const personality = `${currentCharacter.backstory} You are relaxing in a hot spring at night. Your affinity with the player is ${affinityLevel}. ${
      affinityLevel === "intimate" ? "You trust them deeply and may share secrets." :
      affinityLevel === "close" ? "You are comfortable with them and will share more freely." :
      affinityLevel === "friendly" ? "You are warming up to them." : "You are cautious but curious."
    }`;

    let response: string;
    
    if (aiSettings.enabled) {
      response = await generateResponse(
        currentCharacter.name,
        personality,
        conversationHistory,
        message
      );
    } else {
      response = getContextualResponse(message);
    }

    setCurrentResponse(response);
    setConversationHistory([...newHistory, { role: "assistant" as const, content: response }]);

    addAffinityPoints(currentCharacter.id, 2);

    if (!hasGainedInfo && checkForClueReveal(message, response)) {
      setHasGainedInfo(true);
      const clue = getCharacterClue();
      addClue(clue);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getContextualResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("secret") || lowerMessage.includes("deed") || lowerMessage.includes("contract")) {
      if (affinityLevel === "intimate" || affinityLevel === "close") {
        return `*${currentCharacter.name} glances around and leans closer* I shouldn't say this, but... the owner keeps something precious locked away. A master deed that controls us all. The study holds the answer.`;
      }
      return `*${currentCharacter.name} tenses slightly* Those are dangerous questions. Perhaps when we know each other better...`;
    }
    
    if (lowerMessage.includes("owner") || lowerMessage.includes("master")) {
      return `*${currentCharacter.name} shudders* He watches everything. But even he has weaknesses... his greed makes him careless during the busy dinner hours.`;
    }
    
    if (lowerMessage.includes("escape") || lowerMessage.includes("free") || lowerMessage.includes("leave")) {
      return `*${currentCharacter.name}'s eyes fill with longing* Freedom... I dream of it every night. If only someone could find a way to break these chains...`;
    }
    
    if (lowerMessage.includes("help") || lowerMessage.includes("trust")) {
      return `*${currentCharacter.name} studies your face carefully* Your eyes are kind. Perhaps... perhaps you truly wish to help us. Stay close. Listen. The walls whisper secrets to those patient enough to hear.`;
    }
    
    const defaultResponses = [
      `*${currentCharacter.name} sighs contentedly in the warm water* It's peaceful here, isn't it? If only every moment could be so calm.`,
      `*${currentCharacter.name} traces patterns in the water* Tell me about yourself. What brings a traveler to such a place?`,
      `*${currentCharacter.name} closes their eyes briefly* The steam carries memories. Some sweet, some bitter.`,
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const checkForClueReveal = (message: string, response: string): boolean => {
    const keyPhrases = ["deed", "secret", "contract", "study", "locked", "key"];
    return keyPhrases.some(phrase => 
      response.toLowerCase().includes(phrase) && 
      (affinityLevel === "intimate" || affinityLevel === "close")
    );
  };

  const getCharacterClue = (): string => {
    const clues: Record<string, string> = {
      nymph: "The forest spirits speak of a hidden grove where binding magic weakens...",
      goblin: "Small spaces hold big secrets - check behind loose stones.",
      gnome: "Mechanical locks can be understood. Magical ones require knowledge.",
      dwarf: "The foundation stones remember everything built upon them.",
      succubus: "Dark magic feeds on fear. Courage is the key to breaking it.",
      werewolf: "The moon sees all. What is hidden by day is revealed by night.",
      beastwoman: "Patience reveals patterns. The owner's routine has gaps.",
    };
    return clues[currentCharacter.id] || "Trust builds the path to truth.";
  };

  const handleLeave = () => {
    setShowDialogue(false);
    setConversationHistory([]);
    setCurrentResponse("");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/location-hotsprings.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { paddingTop: headerHeight + Spacing.md }]}>
        {showDialogue ? (
          <ScrollView
            contentContainerStyle={[
              styles.dialogueContent,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            <Animated.View entering={FadeIn} style={styles.characterSection}>
              <View style={styles.portraitWrapper}>
                <Image
                  source={portrait}
                  style={styles.portrait}
                  contentFit="cover"
                />
              </View>
              <View style={styles.characterInfo}>
                <ThemedText style={styles.characterName}>
                  {currentCharacter.name}
                </ThemedText>
                <ThemedText style={styles.characterSpecies}>
                  {currentCharacter.species}
                </ThemedText>
                {hasGainedInfo ? (
                  <View style={styles.clueIndicator}>
                    <Feather name="key" size={12} color={GameColors.success} />
                    <ThemedText style={styles.clueText}>Clue gained</ThemedText>
                  </View>
                ) : null}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(100)} style={styles.responseBox}>
              <ThemedText style={styles.responseText}>
                {isLoading ? "..." : currentResponse}
              </ThemedText>
            </Animated.View>

            <View style={styles.inputSection}>
              <TextInput
                style={styles.textInput}
                value={userInput}
                onChangeText={setUserInput}
                placeholder="Speak with her..."
                placeholderTextColor={GameColors.textSecondary}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              <Pressable 
                onPress={handleSendMessage} 
                style={styles.sendButton}
                disabled={isLoading}
              >
                <Feather 
                  name="send" 
                  size={20} 
                  color={isLoading ? GameColors.textSecondary : GameColors.accent} 
                />
              </Pressable>
            </View>

            <OrnateButton 
              onPress={handleLeave} 
              variant="secondary"
              style={styles.leaveButton}
            >
              Leave the Springs
            </OrnateButton>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            <Animated.View entering={FadeInUp} style={styles.header}>
              <ThemedText style={styles.title}>The Hidden Springs</ThemedText>
              <ThemedText style={styles.subtitle}>
                A secret sanctuary where the girls find peace...
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(200)} style={styles.springScene}>
              <View style={styles.currentCharacter}>
                <View style={styles.largePortraitWrapper}>
                  <Image
                    source={portrait}
                    style={styles.largePortrait}
                    contentFit="cover"
                  />
                </View>
                <ThemedText style={styles.characterLabel}>
                  {currentCharacter.name} is here
                </ThemedText>
              </View>

              <OrnateButton onPress={handleApproach} style={styles.approachButton}>
                Approach {currentCharacter.name}
              </OrnateButton>

              <Pressable onPress={rotateCharacter} style={styles.waitButton}>
                <Feather name="clock" size={16} color={GameColors.parchment} />
                <ThemedText style={styles.waitText}>Wait for someone else</ThemedText>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300)} style={styles.infoBox}>
              <Feather name="info" size={16} color={GameColors.accent} />
              <ThemedText style={styles.infoText}>
                The girls rotate through the springs. Build relationships to unlock secrets about the master deed.
              </ThemedText>
            </Animated.View>
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  dialogueContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 28,
    color: GameColors.accent,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    textAlign: "center",
    fontStyle: "italic",
  },
  springScene: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  currentCharacter: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  largePortraitWrapper: {
    width: 200,
    height: 260,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: GameColors.accent,
    marginBottom: Spacing.md,
  },
  largePortrait: {
    width: "100%",
    height: "100%",
  },
  characterLabel: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    color: GameColors.accent,
  },
  approachButton: {
    marginBottom: Spacing.md,
  },
  waitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  waitText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    opacity: 0.8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  infoText: {
    flex: 1,
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    lineHeight: 18,
  },
  characterSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  portraitWrapper: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  portrait: {
    width: "100%",
    height: "100%",
  },
  characterInfo: {
    flex: 1,
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
  },
  clueIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  clueText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.success,
  },
  responseBox: {
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  responseText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    lineHeight: 22,
    fontStyle: "italic",
  },
  inputSection: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  sendButton: {
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  leaveButton: {
    marginBottom: Spacing.xl,
  },
});
