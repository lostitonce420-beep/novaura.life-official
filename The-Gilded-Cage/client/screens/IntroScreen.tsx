import React, { useState } from "react";
import { StyleSheet, View, ImageBackground, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { GameColors, Spacing } from "@/constants/theme";
import { DialogueBox } from "@/components/DialogueBox";
import { introDialogue } from "@/data/dialogues";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface IntroScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Intro">;
}

export default function IntroScreen({ navigation }: IntroScreenProps) {
  const insets = useSafeAreaInsets();
  const [dialogueIndex, setDialogueIndex] = useState(0);

  const handleContinue = () => {
    if (dialogueIndex < introDialogue.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      navigation.navigate("CharacterSelection");
    }
  };

  const currentLine = introDialogue[dialogueIndex];

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
            onContinue={handleContinue}
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
  },
  spacer: {
    flex: 1,
  },
  dialogueContainer: {
    marginBottom: Spacing.xl,
  },
});
