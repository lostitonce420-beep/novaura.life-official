import React, { useState } from "react";
import { StyleSheet, View, ScrollView, ImageBackground, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { mainQuests, sideQuests, getNextMainQuest } from "@/data/quests";

type TabType = "main" | "side" | "clues";

export default function QuestLogScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { gameState } = useGame();
  const [activeTab, setActiveTab] = useState<TabType>("main");

  const nextMainQuest = getNextMainQuest(gameState.completedQuests);

  const renderMainQuests = () => (
    <View style={styles.questList}>
      {mainQuests.map((quest, index) => {
        const isCompleted = gameState.completedQuests.includes(quest.id);
        const isCurrent = nextMainQuest?.id === quest.id;
        const isLocked = !isCompleted && !isCurrent;

        return (
          <Animated.View 
            key={quest.id}
            entering={FadeInUp.delay(index * 50)}
            style={[
              styles.questCard,
              isCompleted && styles.questCompleted,
              isCurrent && styles.questCurrent,
              isLocked && styles.questLocked,
            ]}
          >
            <View style={styles.questHeader}>
              <View style={styles.questNumber}>
                <ThemedText style={styles.questNumberText}>{index + 1}</ThemedText>
              </View>
              <View style={styles.questInfo}>
                <ThemedText style={[
                  styles.questTitle,
                  isLocked && styles.lockedText,
                ]}>
                  {isLocked ? "???" : quest.title}
                </ThemedText>
                <ThemedText style={[
                  styles.questDescription,
                  isLocked && styles.lockedText,
                ]} numberOfLines={2}>
                  {isLocked ? "Complete previous quests to unlock" : quest.description}
                </ThemedText>
              </View>
              <View style={styles.questStatus}>
                {isCompleted ? (
                  <Feather name="check-circle" size={24} color={GameColors.success} />
                ) : isCurrent ? (
                  <Feather name="target" size={24} color={GameColors.accent} />
                ) : (
                  <Feather name="lock" size={24} color={GameColors.textSecondary} />
                )}
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );

  const renderSideQuests = () => {
    const completedSide = sideQuests.filter(q => gameState.completedQuests.includes(q.id));
    const availableSide = sideQuests.filter(q => !gameState.completedQuests.includes(q.id));

    return (
      <View style={styles.questList}>
        {availableSide.length > 0 ? (
          <>
            <ThemedText style={styles.subSectionTitle}>Available</ThemedText>
            {availableSide.map((quest, index) => (
              <Animated.View 
                key={quest.id}
                entering={FadeInUp.delay(index * 50)}
                style={[styles.questCard, styles.questCurrent]}
              >
                <View style={styles.questHeader}>
                  <Feather name="star" size={20} color={GameColors.accent} style={styles.sideIcon} />
                  <View style={styles.questInfo}>
                    <ThemedText style={styles.questTitle}>{quest.title}</ThemedText>
                    <ThemedText style={styles.questDescription} numberOfLines={2}>
                      {quest.description}
                    </ThemedText>
                  </View>
                </View>
              </Animated.View>
            ))}
          </>
        ) : null}

        {completedSide.length > 0 ? (
          <>
            <ThemedText style={styles.subSectionTitle}>Completed</ThemedText>
            {completedSide.map((quest, index) => (
              <Animated.View 
                key={quest.id}
                entering={FadeInUp.delay(index * 50)}
                style={[styles.questCard, styles.questCompleted]}
              >
                <View style={styles.questHeader}>
                  <Feather name="check" size={20} color={GameColors.success} style={styles.sideIcon} />
                  <View style={styles.questInfo}>
                    <ThemedText style={styles.questTitle}>{quest.title}</ThemedText>
                  </View>
                </View>
              </Animated.View>
            ))}
          </>
        ) : null}

        {completedSide.length === 0 && availableSide.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="compass" size={48} color={GameColors.textSecondary} />
            <ThemedText style={styles.emptyText}>No side quests discovered yet</ThemedText>
            <ThemedText style={styles.emptyHint}>
              Explore different locations and talk to characters to find side quests
            </ThemedText>
          </View>
        ) : null}
      </View>
    );
  };

  const renderClues = () => (
    <View style={styles.questList}>
      {gameState.cluesFound.length > 0 ? (
        gameState.cluesFound.map((clue, index) => (
          <Animated.View 
            key={index}
            entering={FadeInUp.delay(index * 50)}
            style={styles.clueCard}
          >
            <Feather name="key" size={18} color={GameColors.accent} style={styles.clueIcon} />
            <ThemedText style={styles.clueText}>{clue}</ThemedText>
          </Animated.View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={GameColors.textSecondary} />
          <ThemedText style={styles.emptyText}>No clues discovered yet</ThemedText>
          <ThemedText style={styles.emptyHint}>
            Complete quests to uncover clues about the master deed
          </ThemedText>
        </View>
      )}

      {gameState.unlockedItems.length > 0 ? (
        <>
          <ThemedText style={[styles.subSectionTitle, { marginTop: Spacing.xl }]}>
            Items Collected
          </ThemedText>
          {gameState.unlockedItems.map((item, index) => (
            <Animated.View 
              key={item}
              entering={FadeInUp.delay(index * 50)}
              style={styles.itemCard}
            >
              <Feather 
                name={item === "key" ? "key" : item === "journal" ? "book" : "gift"} 
                size={24} 
                color={GameColors.accent} 
              />
              <ThemedText style={styles.itemName}>
                {item === "key" ? "Golden Key" : 
                 item === "journal" ? "Owner's Journal" : 
                 item === "deed" ? "Master Deed" : item}
              </ThemedText>
            </Animated.View>
          ))}
        </>
      ) : null}
    </View>
  );

  return (
    <ImageBackground
      source={require("../../assets/images/parchment-texture.png")}
      style={styles.container}
      resizeMode="repeat"
    >
      <View style={[styles.overlay, { paddingTop: headerHeight + Spacing.md }]}>
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab("main")}
            style={[styles.tab, activeTab === "main" && styles.tabActive]}
          >
            <ThemedText style={[styles.tabText, activeTab === "main" && styles.tabTextActive]}>
              Main
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("side")}
            style={[styles.tab, activeTab === "side" && styles.tabActive]}
          >
            <ThemedText style={[styles.tabText, activeTab === "side" && styles.tabTextActive]}>
              Side
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("clues")}
            style={[styles.tab, activeTab === "clues" && styles.tabActive]}
          >
            <ThemedText style={[styles.tabText, activeTab === "clues" && styles.tabTextActive]}>
              Clues
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "main" && renderMainQuests()}
          {activeTab === "side" && renderSideQuests()}
          {activeTab === "clues" && renderClues()}
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: GameColors.backgroundDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: GameColors.primary,
  },
  tabText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    opacity: 0.6,
  },
  tabTextActive: {
    opacity: 1,
    color: GameColors.accent,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  questList: {
    gap: Spacing.md,
  },
  subSectionTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  questCard: {
    backgroundColor: GameColors.backgroundDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: GameColors.primary,
  },
  questCompleted: {
    borderColor: GameColors.success,
    opacity: 0.8,
  },
  questCurrent: {
    borderColor: GameColors.accent,
  },
  questLocked: {
    opacity: 0.5,
  },
  questHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  questNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GameColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  questNumberText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
  },
  sideIcon: {
    marginRight: Spacing.sm,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
    marginBottom: Spacing.xs,
  },
  questDescription: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.8,
  },
  lockedText: {
    color: GameColors.textSecondary,
  },
  questStatus: {
    marginLeft: Spacing.sm,
  },
  clueCard: {
    backgroundColor: GameColors.backgroundDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.accent,
  },
  clueIcon: {
    marginTop: 2,
  },
  clueText: {
    flex: 1,
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    fontStyle: "italic",
    lineHeight: 20,
  },
  itemCard: {
    backgroundColor: GameColors.backgroundDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  itemName: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 16,
    color: GameColors.textSecondary,
  },
  emptyHint: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 12,
    color: GameColors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
