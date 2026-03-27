import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { GameColors, Spacing, BorderRadius, GameTypography } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface MemoryJournalScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "MemoryJournal">;
}

interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  category: "past" | "origin" | "connection" | "revelation";
  discovered: boolean;
}

const allMemories: MemoryEntry[] = [
  {
    id: "memory-prologue",
    title: "Escape from the Gilded Cage",
    content: "You freed the bound women and escaped the cursed tavern. But the pendant Willow gave you still glows with warmth. There is more to discover.",
    source: "The Gilded Cage - Prologue",
    category: "past",
    discovered: true,
  },
  {
    id: "memory-crier-recognition",
    title: "A Familiar Face",
    content: "Barnaby Brass, the town crier, recognized you. Someone matching your description was in Ironhaven months ago, asking about a tavern to the east. You had that same wild look in your eyes.",
    source: "Barnaby Brass, Town Crier",
    category: "past",
    discovered: false,
  },
  {
    id: "memory-shop-visit",
    title: "The Previous Visit",
    content: "Tilda at the Emporium remembers someone who looked like you. They bought supplies for a long journey east, months ago. Determined. Same eyes.",
    source: "Tilda Cogsworth, Shopkeeper",
    category: "past",
    discovered: false,
  },
  {
    id: "memory-smith-warning",
    title: "Warning of the East",
    content: "Grimjaw spoke of rumors from the east - a cursed tavern where travelers go in and don't come out the same. He seemed genuinely worried.",
    source: "Grimjaw Ironhand, Blacksmith",
    category: "connection",
    discovered: false,
  },
  {
    id: "memory-dungeon-origin",
    title: "The Old Prison",
    content: "Before Ironhaven was built, this place was something else. A prison. Or worse. The Dungeon was built on top of the old foundations. Nobody talks about what's really down there.",
    source: "Molly Steamwhistle, Barkeeper",
    category: "origin",
    discovered: false,
  },
  {
    id: "memory-dungeon-warning",
    title: "The Dungeon Shows You Things",
    content: "Old Magnus warns that the Dungeon shows you your past, your fears. The deeper you go, the more it knows you. Some go in whole and come out hollow.",
    source: "Old Magnus, Retired Adventurer",
    category: "origin",
    discovered: false,
  },
  {
    id: "memory-town-origin",
    title: "Ironhaven's Founding",
    content: "Ironhaven was built by survivors. People who escaped something terrible to the east. They found the Dungeon entrance and built a city around it.",
    source: "Captain Helena Gearwright, Guildmaster",
    category: "origin",
    discovered: false,
  },
  {
    id: "memory-lord-revelation",
    title: "The Gilded Prison",
    content: "Lord Gearwright's great-grandfather wrote of a 'gilded prison' that captured souls. He and others escaped but lost their memories in the process. The same thing happened to you.",
    source: "Lord Edmund Gearwright",
    category: "revelation",
    discovered: false,
  },
  {
    id: "memory-deep-truth",
    title: "Voices in the Deep",
    content: "The whispers in the deep levels of the Dungeon call your name. They know you. The Dungeon remembers everything - including who you were before.",
    source: "Dungeon Floor 20",
    category: "revelation",
    discovered: false,
  },
  {
    id: "memory-full-truth",
    title: "The Origin",
    content: "The truth unfolds: The Gilded Cage's dungeon IS the original prison. The seven women you freed were descendants of the first prisoners. And you? You were brought here centuries ago. The pendant broke the cycle. You've ended what began ages ago.",
    source: "The Origin Chamber, Floor 30",
    category: "revelation",
    discovered: false,
  },
];

export default function MemoryJournalScreen({ navigation }: MemoryJournalScreenProps) {
  const headerHeight = useHeaderHeight();
  const [selectedMemory, setSelectedMemory] = useState<MemoryEntry | null>(null);

  const discoveredMemories = allMemories.filter(m => m.discovered);
  const undiscoveredCount = allMemories.filter(m => !m.discovered).length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "past": return "#3498DB";
      case "origin": return "#E67E22";
      case "connection": return "#2ECC71";
      case "revelation": return "#9B59B6";
      default: return GameColors.accent;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "past": return "clock";
      case "origin": return "map-pin";
      case "connection": return "link";
      case "revelation": return "sun";
      default: return "circle";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn} style={styles.headerSection}>
          <Feather name="book-open" size={32} color="#B8A9C9" />
          <ThemedText style={styles.headerTitle}>Memory Fragments</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Piece together your forgotten past
          </ThemedText>
          <View style={styles.progressRow}>
            <ThemedText style={styles.progressText}>
              {discoveredMemories.length} / {allMemories.length} Discovered
            </ThemedText>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(discoveredMemories.length / allMemories.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </Animated.View>

        {discoveredMemories.map((memory, index) => (
          <Animated.View
            key={memory.id}
            entering={FadeInUp.delay(index * 100)}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedMemory(selectedMemory?.id === memory.id ? null : memory);
              }}
              style={[
                styles.memoryCard,
                selectedMemory?.id === memory.id && styles.selectedCard,
              ]}
            >
              <View style={[
                styles.memoryIcon,
                { backgroundColor: getCategoryColor(memory.category) + "33" }
              ]}>
                <Feather 
                  name={getCategoryIcon(memory.category) as any} 
                  size={20} 
                  color={getCategoryColor(memory.category)} 
                />
              </View>
              <View style={styles.memoryInfo}>
                <ThemedText style={styles.memoryTitle}>{memory.title}</ThemedText>
                <ThemedText style={styles.memorySource}>{memory.source}</ThemedText>
              </View>
              <Feather 
                name={selectedMemory?.id === memory.id ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={GameColors.parchment} 
              />
            </Pressable>
            
            {selectedMemory?.id === memory.id ? (
              <Animated.View entering={FadeIn} style={styles.memoryContent}>
                <ThemedText style={styles.memoryText}>{memory.content}</ThemedText>
                <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(memory.category) }]}>
                  <ThemedText style={styles.categoryText}>
                    {memory.category.charAt(0).toUpperCase() + memory.category.slice(1)}
                  </ThemedText>
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>
        ))}

        {undiscoveredCount > 0 ? (
          <Animated.View entering={FadeIn.delay(500)} style={styles.undiscoveredSection}>
            <Feather name="help-circle" size={24} color={GameColors.parchment} />
            <ThemedText style={styles.undiscoveredText}>
              {undiscoveredCount} memories remain hidden. Explore the town, 
              talk to NPCs, and delve deeper into the Dungeon to uncover the truth.
            </ThemedText>
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
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "#B8A9C9",
  },
  headerTitle: {
    fontFamily: GameTypography.title.fontFamily,
    fontSize: 24,
    color: "#B8A9C9",
    marginTop: Spacing.sm,
  },
  headerSubtitle: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
    opacity: 0.7,
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  progressRow: {
    width: "100%",
  },
  progressText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 11,
    color: GameColors.parchment,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#B8A9C9",
    borderRadius: BorderRadius.sm,
  },
  memoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(44, 36, 22, 0.9)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: GameColors.primary,
  },
  selectedCard: {
    borderColor: "#B8A9C9",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  memoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontFamily: GameTypography.heading.fontFamily,
    fontSize: 14,
    color: GameColors.parchment,
  },
  memorySource: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.parchment,
    opacity: 0.6,
  },
  memoryContent: {
    backgroundColor: "rgba(44, 36, 22, 0.95)",
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#B8A9C9",
  },
  memoryText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 13,
    color: GameColors.parchment,
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontFamily: GameTypography.caption.fontFamily,
    fontSize: 10,
    color: GameColors.backgroundDark,
  },
  undiscoveredSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(44, 36, 22, 0.7)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.primary,
    borderStyle: "dashed",
  },
  undiscoveredText: {
    fontFamily: GameTypography.body.fontFamily,
    fontSize: 12,
    color: GameColors.parchment,
    opacity: 0.7,
    flex: 1,
    lineHeight: 18,
  },
});
