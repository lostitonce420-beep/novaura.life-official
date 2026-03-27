import React, { useState, useEffect } from "react";
import { StyleSheet, View, ImageBackground, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing } from "@/constants/theme";
import { DialogueBox } from "@/components/DialogueBox";
import { characterRevealDialogue } from "@/data/dialogues";
import { useGame } from "@/context/GameContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface DialogueScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Dialogue">;
}

export default function DialogueScreen({ navigation }: DialogueScreenProps) {
  const insets = useSafeAreaInsets();
  const { gameState, characters, getCharacterPortrait, addAffinityPoints, completeQuest, startQuest } = useGame();
  const [dialogueIndex, setDialogueIndex] = useState(0);

  const selectedCharacter = characters.find(
    (c) => c.id === gameState.selectedCharacter
  );

  const dialogue = gameState.selectedCharacter
    ? characterRevealDialogue[gameState.selectedCharacter] || []
    : [];

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (dialogueIndex < dialogue.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      if (gameState.selectedCharacter) {
        addAffinityPoints(gameState.selectedCharacter, 15);
      }
      
      if (!gameState.completedQuests.includes("mq2")) {
        completeQuest("mq2");
      }
      
      navigation.replace("Exploration");
    }
  };

  if (!selectedCharacter || dialogue.length === 0) {
    return null;
  }

  const currentLine = dialogue[dialogueIndex];
  const characterPortrait = getCharacterPortrait(selectedCharacter.id);

  return (
    <ImageBackground
      source={require("../../assets/images/tavern-interior.png")}
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
            line={currentLine}
            speakerName={selectedCharacter.name}
            onContinue={handleContinue}
            characterPortrait={characterPortrait}
          />
        </Animated.View>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
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
