import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { OrnateButton } from "@/components/OrnateButton";
import { townQuests, TownQuest, townBuildings } from "@/data/steampunkWorld";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface TownQuestsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "TownQuests">;
}

export default function TownQuestsScreen({ navigation }: TownQuestsScreenProps) {
  const headerHeight = useHeaderHeight();
  const [selectedQuest, setSelectedQuest] = useState<TownQuest | null>(null);
  const [activeQuests] = useState<string[]>([]);
  const [completedQuests] = useState<string[]>([]);

  const getQuestGiverName = (giverId: string) => {
    for (const building of townBuildings) {
      const npc = building.interior.npcs.find(n => n.id === giverId);
      if (npc) return npc.name;
    }
    return "Unknown";
  };

  const getQuestTypeIcon = (type: string) => {
    switch (type) {
      case "dungeon": return "chevrons-down";
      case "fetch": return "package";
      case "kill": return "crosshair";
      case "explore": return "compass";
      case "story": return "book-open";
      default: return "circle";
    }
  };

  const getQuestStatus = (questId: string) => {
    if (completedQuests.includes(questId)) return "completed";
    if (activeQuests.includes(questId)) return "active";
    return "available";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return GameColors.success;
      case "active": return "#3498DB";
      default: return GameColors.accent;
    }
  };

  const handleSelectQuest = (quest: TownQuest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedQuest(quest);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn}>
          <ThemedText style={styles.sectionTitle}>Available Quests</ThemedText>
        </Animated.View>

        {townQuests.map((quest, index) => {
          const status = getQuestStatus(quest.id);
          const giverName = getQuestGiverName(quest.giver);
          
          return (
            <Animated.View
              key={quest.id}
              entering={FadeInRight.delay(index * 80)}
            >
              <Pressable
                onPress={() => handleSelectQuest(quest)}
                style={[
                  styles.questCard,
                  selectedQuest?.id === quest.id && styles.selectedCard,
                  status === "completed" && styles.completedCard,
                ]}
              >
                <View style={[styles.questIcon, { backgroundColor: getStatusColor(status) + "33" }]}>
                  <Feather 
                    name={getQuestTypeIcon(quest.type) as any} 
                    size={24} 
                    color={getStatusColor(status)} 
                  />
                </View>
                <View style={styles.questInfo}>
                  <ThemedText style={styles.questTitle}>{quest.title}</ThemedText>
                  <ThemedText style={styles.questGiver}>From: {giverName}</ThemedText>
                  <ThemedText style={styles.questDesc} numberOfLines={2}>
                    {quest.description}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                  <ThemedText style={styles.statusText}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </ThemedText>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        {selectedQuest ? (
          <Animated.View entering={FadeIn} style={styles.detailPanel}>
            <ThemedText style={styles.detailTitle}>{selectedQuest.title}</ThemedText>
            <ThemedText style={styles.detailDesc}>{selectedQuest.description}</ThemedText>
            
            <View style={styles.objectivesSection}>
              <ThemedText style={styles.objectivesTitle}>Objectives</ThemedText>
              {selectedQuest.objectives.map(obj => (
                <View key={obj.id} style={styles.objectiveRow}>
                  <Feather 
                    name={obj.current >= obj.required ? "check-circle" : "circle"} 
                    size={16} 
                    color={obj.current >= obj.required ? GameColors.success : GameColors.parchment} 
                  />
                  <ThemedText style={styles.objectiveText}>
                    {obj.description} ({obj.current}/{obj.required})
                  </ThemedText>
                </View>
              ))}
            </View>
            
            <View style={styles.rewardsSection}>
              <ThemedText style={styles.objectivesTitle}>Rewards</ThemedText>
              <View style={styles.rewardsRow}>
                <View style={styles.rewardItem}>
                  <Feather name="dollar-sign" size={14} color={GameColors.accent} />
                  <ThemedText style={styles.rewardText}>{selectedQuest.rewards.gold} Gold</ThemedText>
                </View>
                <View style={styles.rewardItem}>
                  <Feather name="trending-up" size={14} color="#9B59B6" />
                  <ThemedText style={styles.rewardText}>{selectedQuest.rewards.experience} EXP</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.dialoguePreview}>
              <ThemedText style={styles.dialogueQuote}>
                "{selectedQuest.dialogue.start[0]}"
              </ThemedText>
              <ThemedText style={styles.dialogueFrom}>
                - {getQuestGiverName(selectedQuest.giver)}
              </ThemedText>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.backgroundDark,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 20,
    color: GameColors.accent,
    marginBottom: Spacing.lg,
  },
  questCard: {
    flexDirection: "row",
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: GameColors.primary,
    alignItems: "center",
  },
  selectedCard: {
    borderColor: GameColors.accent,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  completedCard: {
    opacity: 0.6,
  },
  questIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 15,
    color: GameColors.parchment,
  },
  questGiver: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.accent,
    marginBottom: 2,
  },
  questDesc: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  statusText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.backgroundDark,
  },
  detailPanel: {
    backgroundColor: "rgba(44, 36, 22, 0.95)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  detailTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 20,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  detailDesc: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  objectivesSection: {
    marginBottom: Spacing.lg,
  },
  objectivesTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.accent,
    marginBottom: Spacing.sm,
  },
  objectiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  objectiveText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
  },
  rewardsSection: {
    marginBottom: Spacing.lg,
  },
  rewardsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
  },
  dialoguePreview: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: GameColors.accent,
  },
  dialogueQuote: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
    fontStyle: "italic",
    lineHeight: 20,
  },
  dialogueFrom: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.accent,
    marginTop: Spacing.xs,
  },
});
