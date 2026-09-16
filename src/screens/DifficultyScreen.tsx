import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { DifficultyScreenProps } from '../navigation/types';
import { Difficulty } from '../types/question';

interface DifficultyLevel {
  key: Difficulty;
  title: string;
  description: string;
  badge: string;
  color: string;
  bgLight: string;
  emoji: string;
}

const LEVELS: DifficultyLevel[] = [
  {
    key: 'Easy',
    title: 'Easy Level',
    description: 'Fundamental concept testing and basic speed drills.',
    badge: 'Foundation',
    color: '#059669',
    bgLight: '#ecfdf5',
    emoji: '🟢',
  },
  {
    key: 'Medium',
    title: 'Medium Level',
    description: 'Standard SSC CGL Tier-1 difficulty with moderate calculations.',
    badge: 'Exam Standard',
    color: '#d97706',
    bgLight: '#fffbeb',
    emoji: '🟡',
  },
  {
    key: 'Hard',
    title: 'Hard Level',
    description: 'Advanced multi-step problems designed for Tier-2 excellence.',
    badge: 'Tier-2 Challenge',
    color: '#dc2626',
    bgLight: '#fef2f2',
    emoji: '🔴',
  },
];

const QUESTION_COUNTS = [
  { label: '5 Qs', value: 5, desc: 'Quick Sprint' },
  { label: '10 Qs', value: 10, desc: 'Standard Test' },
  { label: '25 Qs', value: 25, desc: 'Full Mock' },
];

export const DifficultyScreen: React.FC<DifficultyScreenProps> = ({
  route,
  navigation,
}) => {
  const { subjectId, topicId, topicName, totalQuestions, targetQuestions } = route.params;
  const [selectedCount, setSelectedCount] = useState<number>(5);

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    navigation.navigate('Practice', {
      subjectId,
      topicId,
      topicName,
      difficulty,
      questionCount: selectedCount,
    });
  };

  const displayCount = targetQuestions 
    ? `${totalQuestions || 0} / ${targetQuestions} Questions Available` 
    : totalQuestions !== undefined 
      ? `${totalQuestions} Questions Available` 
      : 'Configure your practice test session. Select test size and difficulty tier.';

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.headerBox}>
          <Text style={styles.topicBadge}>SELECTED TOPIC</Text>
          <Text style={styles.topicTitle}>{topicName}</Text>
          <Text style={styles.instruction}>
            {displayCount}
          </Text>
        </View>

        {/* TEST SIZE SELECTOR */}
        <View style={styles.sizeSection}>
          <Text style={styles.sectionHeading}>1. Choose Test Length</Text>
          <View style={styles.countRow}>
            {QUESTION_COUNTS.map((item) => {
              const isSelected = selectedCount === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.countCard,
                    isSelected && styles.countCardSelected,
                  ]}
                  onPress={() => setSelectedCount(item.value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.countLabel,
                      isSelected && styles.countLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.countDesc,
                      isSelected && styles.countDescSelected,
                    ]}
                  >
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* DIFFICULTY TIERS */}
        <View style={styles.difficultySection}>
          <Text style={styles.sectionHeading}>2. Choose Difficulty Tier</Text>
          <View style={styles.levelsList}>
            {LEVELS.map((level) => (
              <TouchableOpacity
                key={level.key}
                style={[styles.levelCard, { borderColor: level.color }]}
                onPress={() => handleSelectDifficulty(level.key)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: level.bgLight }]}>
                    <Text style={[styles.badgeText, { color: level.color }]}>
                      {level.badge}
                    </Text>
                  </View>
                  <Text style={styles.rulePill}>{selectedCount} Questions</Text>
                </View>

                <View style={styles.titleRow}>
                  <Text style={styles.emoji}>{level.emoji}</Text>
                  <Text style={styles.title}>{level.title}</Text>
                </View>

                <Text style={styles.description}>{level.description}</Text>

                <View style={[styles.selectBtn, { backgroundColor: level.color }]}>
                  <Text style={styles.selectBtnText}>
                    Start {selectedCount}-Q {level.key} Test
                  </Text>
                  <Text style={styles.selectBtnArrow}>➔</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  topicBadge: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  topicTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  instruction: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  sizeSection: {
    marginBottom: 22,
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  countCardSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  countLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  countLabelSelected: {
    color: '#4f46e5',
  },
  countDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  countDescSelected: {
    color: '#4338ca',
    fontWeight: '600',
  },
  difficultySection: {
    marginBottom: 10,
  },
  levelsList: {
    gap: 14,
  },
  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rulePill: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  selectBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  selectBtnArrow: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
