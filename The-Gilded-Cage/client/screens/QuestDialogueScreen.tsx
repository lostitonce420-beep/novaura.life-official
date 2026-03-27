import React, { useState, useEffect } from "react";
import { StyleSheet, View, ImageBackground, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing } from "@/constants/theme";
import { DialogueBox } from "@/components/DialogueBox";
import { useGame } from "@/context/GameContext";
import { getQuestById, getLocationById, Quest } from "@/data/quests";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface QuestDialogueScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "QuestDialogue">;
  route: RouteProp<RootStackParamList, "QuestDialogue">;
}

export default function QuestDialogueScreen({ navigation, route }: QuestDialogueScreenProps) {
  const insets = useSafeAreaInsets();
  const { questId } = route.params;
  const { 
    gameState, 
    characters,
    completeQuest, 
    addAffinityPoints, 
    addClue,
    unlockItem,
    advanceQuestStep,
    getCharacterPortrait
  } = useGame();

  const [dialogueIndex, setDialogueIndex] = useState(0);
  
  const quest = getQuestById(questId);
  const location = quest ? getLocationById(quest.locationId) : null;

  if (!quest || !location) {
    navigation.goBack();
    return null;
  }

  const currentDialogue = quest.dialogue[dialogueIndex];
  const isLastDialogue = dialogueIndex >= quest.dialogue.length - 1;

  const getCharacterName = () => {
    if (currentDialogue?.speakerId === "selected") {
      const selected = characters.find(c => c.id === gameState.selectedCharacter);
      return selected?.name || "???";
    }
    if (currentDialogue?.speakerId) {
      const char = characters.find(c => c.id === currentDialogue.speakerId);
      return char?.name || "???";
    }
    return undefined;
  };

  const getPortrait = () => {
    if (currentDialogue?.speakerId === "selected" && gameState.selectedCharacter) {
      return getCharacterPortrait(gameState.selectedCharacter);
    }
    if (currentDialogue?.speakerId) {
      return getCharacterPortrait(currentDialogue.speakerId);
    }
    return undefined;
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isLastDialogue) {
      handleQuestComplete();
    } else {
      setDialogueIndex((prev) => prev + 1);
    }
  };

  const handleQuestComplete = () => {
    if (quest.rewards.affinityPoints) {
      quest.rewards.affinityPoints.forEach(({ characterId, points }) => {
        if (characterId === "selected" && gameState.selectedCharacter) {
          addAffinityPoints(gameState.selectedCharacter, points);
        } else if (characterId === "all") {
          characters.forEach(c => addAffinityPoints(c.id, points));
        } else {
          addAffinityPoints(characterId, points);
        }
      });
    }

    if (quest.rewards.clue) {
      addClue(quest.rewards.clue);
    }

    if (quest.rewards.item) {
      unlockItem(quest.rewards.item);
    }

    completeQuest(questId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (quest.type === "main") {
      if (questId === "mq2") {
        navigation.replace("CharacterSelection");
      } else if (questId === "mq7" || questId === "mq8" || questId === "mq9") {
        navigation.replace("Puzzle");
      } else if (questId === "mq10") {
        navigation.replace("Choice");
      } else {
        navigation.replace("Exploration");
      }
    } else {
      navigation.goBack();
    }
  };

  const handleChoice = (nextIndex: number, affinityChange?: number) => {
    if (affinityChange && gameState.selectedCharacter) {
      addAffinityPoints(gameState.selectedCharacter, affinityChange);
    }
    setDialogueIndex(nextIndex);
  };

  return (
    <ImageBackground
      source={location.image}
      style={styles.container}
      resizeMode="cover"
    >
      <Pressable
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        onPress={handleContinue}
      >
        <View style={styles.spacer} />
        <Animated.View
          key={dialogueIndex}
          entering={FadeIn.duration(300)}
          style={styles.dialogueContainer}
        >
          <DialogueBox
            line={{
              speaker: currentDialogue.speaker,
              text: currentDialogue.text.replace("{selected}", getCharacterName() || ""),
              choices: currentDialogue.choices?.map(c => ({
                text: c.text,
                nextIndex: c.nextIndex,
              })),
            }}
            speakerName={getCharacterName()}
            onContinue={handleContinue}
            onChoice={(nextIndex) => {
              const choice = currentDialogue.choices?.find(c => c.nextIndex === nextIndex);
              handleChoice(nextIndex, choice?.affinityChange);
            }}
            characterPortrait={getPortrait()}
          />
        </Animated.View>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  spacer: {
    flex: 1,
  },
  dialogueContainer: {
    marginBottom: Spacing.xl,
  },
});
