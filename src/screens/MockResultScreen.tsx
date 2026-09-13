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

export const MockResultScreen: React.FC<MockResultScreenProps> = ({ route, navigation }) => {
  const { sessionId, scoreSummary } = route.params;
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20) + 8;

  const getPerformanceTone = (score: number) => {
    if (score >= 140) {
      return {
        badge: '🏆 Exceptional! Strong Tier-I Standing',
        color: '#059669',
        bg: '#ecfdf5',
      };
    }
    if (score >= 110) {
      return {
        badge: '👍 Competitive Score! Target Weak Areas',
        color: '#d97706',
        bg: '#fffbeb',
      };
    }
    return {
      badge: '📚 Needs Systematic Revision & Speed Drills',
      color: '#4338ca',
      bg: '#eef2ff',
    };
  };

  const perf = getPerformanceTone(scoreSummary.totalScore);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Text style={styles.headerTitle}>SSC CGL Tier-I Scorecard</Text>
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
              <Text style={styles.maxScoreText}>out of 200 Marks</Text>
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
            <View style={[styles.statPill, { backgroundColor: '#7f1d1d' }]}>
              <Text style={[styles.pillValue, { color: '#f87171' }]}>
                {scoreSummary.totalWrong}
              </Text>
              <Text style={styles.pillLabel}>Wrong (-0.5)</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: '#334155' }]}>
              <Text style={[styles.pillValue, { color: '#cbd5e1' }]}>
                {scoreSummary.totalUnanswered}
              </Text>
              <Text style={styles.pillLabel}>Skipped (0)</Text>
            </View>
          </View>
        </View>

        {/* Section-Wise Performance Breakdown */}
        <Text style={styles.sectionHeading}>Section-by-Section Performance</Text>

        {scoreSummary.sectionResults.map((sec) => {
          const pct = Math.max(0, Math.min(100, (sec.marks / 50) * 100));
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
                  <Text style={styles.sectionMarksMax}>/ 50</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: sec.marks >= 35 ? '#10b981' : sec.marks >= 20 ? '#f59e0b' : '#ef4444',
                    },
                  ]}
                />
              </View>

              <View style={styles.sectionFooterRow}>
                <Text style={styles.sectionFooterText}>Accuracy: {sec.accuracy}%</Text>
                <Text style={styles.sectionFooterText}>Attempted: {sec.correct + sec.wrong}/25</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Sticky Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate('MockReview', { sessionId })}
          activeOpacity={0.85}
        >
          <Text style={styles.reviewButtonText}>🔍 Review Answers & Explanations</Text>
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
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
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
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
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
    color: '#a5b4fc',
    marginTop: -4,
  },
  accuracyRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#4f46e5',
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  accuracyLabel: {
    fontSize: 10,
    color: '#c7d2fe',
    marginTop: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pillValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  pillLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
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
    marginRight: 12,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  sectionMarksBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
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
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 2,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
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
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
