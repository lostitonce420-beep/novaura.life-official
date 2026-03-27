import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Text,
  Modal,
  ImageBackground,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { GameColors, Spacing, BorderRadius, Fonts, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  return (
    <View style={styles.container}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          style={({ pressed }) => [
            styles.topButton,
            {
              backgroundColor: GameColors.backgroundDark,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="alert-circle" size={20} color={GameColors.parchment} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <Feather name="alert-triangle" size={64} color={GameColors.accent} style={styles.icon} />
        
        <ThemedText style={styles.title}>
          A Dark Force Intervened
        </ThemedText>

        <ThemedText style={styles.message}>
          The Gilded Cage has encountered a mysterious obstacle. Fear not, brave adventurer - we can try again.
        </ThemedText>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: GameColors.primary,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <ThemedText style={styles.buttonText}>
            Resume Your Journey
          </ThemedText>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  Error Details
                </ThemedText>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Feather name="x" size={24} color={GameColors.parchment} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
              >
                <View style={styles.errorContainer}>
                  <Text
                    style={styles.errorText}
                    selectable
                  >
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
    backgroundColor: GameColors.backgroundDark,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    width: "100%",
    maxWidth: 600,
  },
  icon: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 24,
    textAlign: "center",
    lineHeight: 32,
    color: GameColors.accent,
  },
  message: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 24,
    color: GameColors.parchment,
    paddingHorizontal: Spacing.lg,
  },
  topButton: {
    position: "absolute",
    top: Spacing["2xl"] + Spacing.lg,
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing["2xl"],
    minWidth: 200,
    borderWidth: 2,
    borderColor: GameColors.accent,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
    color: GameColors.parchment,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    backgroundColor: GameColors.backgroundDark,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.3)",
  },
  modalTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 18,
    fontWeight: "600",
    color: GameColors.accent,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  errorContainer: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    padding: Spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    width: "100%",
    color: GameColors.parchment,
    fontFamily: Fonts?.mono || "monospace",
  },
});
