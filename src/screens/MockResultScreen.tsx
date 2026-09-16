import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockResultScreenProps } from '../navigation/types';
import { getExamBySlug } from '../types/exam';

export const MockResultScreen: React.FC<MockResultScreenProps> = ({ route, navigation }) => {
  const { sessionId, scoreSummary, examSlug, paperSlug } = route.params;
  const insets = useSafeAreaInsets();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 20) + 8;

  const isPaper2 = paperSlug === 'paper-2';
  const examLabel = (examSlug || 'exam').toUpperCase();
  const headerTitle = isPaper2
    ? `${examLabel} — Paper II Scorecard`
    : `${examLabel} Scorecard`;

  const exam = getExamBySlug(examSlug || '');
  const hasNegativeMarking = exam?.mockMarking.includes('-') ?? false;

  const getPerformanceTone = (score: number, maxScore: number = 200) => {
    const pct = (score / maxScore) * 100;
    if (pct >= 70) {
      return {
        badge: '🏆 Outstanding! High Probability of Clearing Cutoff',
        color: '#059669',
        bg: '#ecfdf5',
      };
    }
    if (pct >= 50) {
      return {
        badge: '👍 Competitive Standing! Target Weak Areas',
        color: '#d97706',
        bg: '#fffbeb',
      };
    }
    return {
      badge: '📚 Needs Consistent Practice & Revision',
      color: '#4338ca',
      bg: '#eef2ff',
    };
  };

  const perf = getPerformanceTone(scoreSummary.totalScore, scoreSummary.maxMarks || 200);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Score Card */}
        <View style={styles.heroCard}>
          <View style={[styles.statusBadge, { backgroundColor: perf.bg }]}>
            <Text style={[styles.statusBadgeText, { color: perf.color }]}>{perf.badge}</Text>
          </View>

          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreNumber}>{scoreSummary.totalScore}</Text>
              <Text style={styles.maxScoreText}>out of {scoreSummary.maxMarks || 200} Marks</Text>
            </View>
            <View style={styles.accuracyRing}>
              <Text style={styles.accuracyNumber}>{scoreSummary.accuracy}%</Text>
              <Text style={styles.accuracyLabel}>Accuracy</Text>
            </View>
          </View>

          {/* Quick 3-Pill Summary */}
          <View style={styles.pillsRow}>
            <View style={[styles.statPill, { backgroundColor: '#064e3b' }]}>
              <Text style={[styles.pillValue, { color: '#34d399' }]}>
                {scoreSummary.totalCorrect}
              </Text>
              <Text style={styles.pillLabel}>Correct (+2)</Text>
            </View>

            <View
              style={[
                styles.statPill,
                { backgroundColor: hasNegativeMarking ? '#7f1d1d' : '#334155' },
              ]}
            >
              <Text
                style={[
                  styles.pillValue,
                  { color: hasNegativeMarking ? '#f87171' : '#cbd5e1' },
                ]}
              >
                {scoreSummary.totalWrong}
              </Text>
              <Text style={styles.pillLabel}>
                {hasNegativeMarking ? 'Wrong (-0.5)' : 'Wrong (0 Penalty)'}
              </Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: '#334155' }]}>
              <Text style={[styles.pillValue, { color: '#cbd5e1' }]}>
                {scoreSummary.totalUnanswered}
              </Text>
              <Text style={styles.pillLabel}>Skipped (0)</Text>
            </View>
          </View>
        </View>

        {/* Section/Subject-Wise Performance Breakdown */}
        <Text style={styles.sectionHeading}>
          {scoreSummary.sectionResults.length > 4 ? 'Subject-by-Subject Performance Breakdown' : 'Section-by-Section Performance'}
        </Text>

        {scoreSummary.sectionResults.map((sec) => {
          const secMaxMarks = (sec.totalQuestions || 25) * 2;
          const pct = Math.max(0, Math.min(100, (sec.marks / secMaxMarks) * 100));

          return (
            <View key={sec.sectionIndex} style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleBlock}>
                  <Text style={styles.sectionTitleText}>{sec.name}</Text>
                  <Text style={styles.sectionSubText}>
                    {sec.correct} Correct • {sec.wrong} Wrong • {sec.unanswered} Skipped
                  </Text>
                </View>
                <View style={styles.sectionMarksBadge}>
                  <Text style={styles.sectionMarksValue}>{sec.marks}</Text>
                  <Text style={styles.sectionMarksMax}>/ {secMaxMarks}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${pct}%`,
                      backgroundColor:
                        pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444',
                    },
                  ]}
                />
              </View>

              <View style={styles.sectionFooterRow}>
                <Text style={styles.sectionFooterText}>Accuracy: {sec.accuracy}%</Text>
                <Text style={styles.sectionFooterText}>
                  Attempted: {sec.correct + sec.wrong}/{sec.totalQuestions || 25}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate('MockReview', { sessionId })}
          activeOpacity={0.85}
        >
          <Text style={styles.reviewButtonText}>🔍 Review All 100 Answers & Solutions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Subjects')}
          activeOpacity={0.7}
        >
          <Text style={styles.homeButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e1b4b',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
  },
  maxScoreText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  accuracyRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  accuracyNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38bdf8',
  },
  accuracyLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  pillLabel: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitleBlock: {
    flex: 1,
    marginRight: 8,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionSubText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sectionMarksBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionMarksValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionMarksMax: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 2,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionFooterText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  reviewButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  homeButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
});
