import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PerformanceScreenProps } from '../navigation/types';
import { performanceApi } from '../services/api/performanceApi';
import { revisionApi } from '../services/api/revisionApi';
import { studyPlanApi } from '../services/api/studyPlanApi';
import { streakApi } from '../services/api/streakApi';
import {
  UserPerformanceSummary,
  TopicPerformanceMetric,
  WeaknessStatus,
} from '../types/performance';
import { RevisionStats } from '../types/revision';
import { DailyStudyPlanSummary } from '../types/studyPlan';
import { StudyStreakSummary } from '../types/streak';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';

const STATUS_CONFIG: Record<
  WeaknessStatus,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  CRITICAL: {
    label: 'Critical Weakness',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    icon: '🔴',
  },
  NEEDS_PRACTICE: {
    label: 'Needs Practice',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: '🟠',
  },
  GOOD: {
    label: 'Good Accuracy',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: '🟢',
  },
  STRONG: {
    label: 'Strong Mastery',
    color: '#4338ca',
    bg: '#eef2ff',
    border: '#c7d2fe',
    icon: '🌟',
  },
  INSUFFICIENT_DATA: {
    label: '< 5 Attempts',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    icon: '⚪',
  },
};

export const PerformanceScreen: React.FC<PerformanceScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 20) + 6;

  const [data, setData] = useState<UserPerformanceSummary | null>(null);
  const [revisionStats, setRevisionStats] = useState<RevisionStats | null>(null);
  const [studyPlan, setStudyPlan] = useState<DailyStudyPlanSummary | null>(null);
  const [streakData, setStreakData] = useState<StudyStreakSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [onlyWeakFilter, setOnlyWeakFilter] = useState<boolean>(false);

  const fetchPerformance = useCallback(async () => {
    setError(null);
    try {
      const [summary, revStats, plan, streak] = await Promise.all([
        performanceApi.getPerformanceSummary(),
        revisionApi.getRevisionStats().catch(() => null),
        studyPlanApi.getTodayStudyPlan().catch(() => null),
        streakApi.getStudyStreak().catch(() => null),
      ]);
      setData(summary);
      setRevisionStats(revStats);
      setStudyPlan(plan);
      if (streak) setStreakData(streak);
    } catch (err: any) {
      setError(err.message || 'Failed to load performance analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPerformance();
  }, [fetchPerformance]);

  if (loading && !refreshing) {
    return <LoadingView message="Analyzing your attempt history & weak areas..." />;
  }

  if (error && !data) {
    return (
      <View style={styles.screenRoot}>
        <View style={[styles.headerContainer, { paddingTop: topInset }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Performance</Text>
          <View style={{ width: 48 }} />
        </View>
        <ErrorView message={error} onRetry={fetchPerformance} />
      </View>
    );
  }

  const topics = data?.topics || [];
  const filteredTopics = topics.filter((t) => {
    const matchesSubject =
      selectedSubjectFilter === 'ALL' || t.subjectSlug === selectedSubjectFilter;
    const matchesWeak =
      !onlyWeakFilter || t.status === 'CRITICAL' || t.status === 'NEEDS_PRACTICE';
    return matchesSubject && matchesWeak;
  });

  const hasData = data && data.totalAttempted >= 5;

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />

      {/* HEADER WITH SAFE INSETS */}
      <View style={[styles.headerContainer, { paddingTop: topInset }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personalized Analytics</Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshIconBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshIconText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
          />
        }
      >
        {/* NEW USER ONBOARDING BANNER (IF < 5 ATTEMPTS) */}
        {!hasData && (
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingIcon}>📊</Text>
            <Text style={styles.onboardingTitle}>Build Your Performance Profile</Text>
            <Text style={styles.onboardingDesc}>
              Attempt at least 5 questions across Practice Drills or Mock Tests. We will automatically detect your weak topics, calculate accuracy metrics, and provide custom drills!
            </Text>
            <TouchableOpacity
              style={styles.onboardingBtn}
              onPress={() => navigation.navigate('Subjects')}
              activeOpacity={0.85}
            >
              <Text style={styles.onboardingBtnText}>Start Practice Now ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* OVERALL PERFORMANCE HERO CARD */}
        {data && (
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroSubtitle}>OVERALL MASTERY</Text>
                <Text style={styles.heroAccuracyNum}>{data.overallAccuracy}%</Text>
                <Text style={styles.heroAccuracyLabel}>
                  {data.overallAccuracy >= 75
                    ? '🎯 Tier-1 Exam Ready'
                    : data.overallAccuracy >= 50
                    ? '📈 Good Foundation — Needs Drills'
                    : '⚠️ Focus on Fundamentals'}
                </Text>
              </View>
              <View style={styles.heroCircleBadge}>
                <Text style={styles.heroCircleIcon}>🏆</Text>
              </View>
            </View>

            {/* 4 STATS ROW */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{data.totalAttempted}</Text>
                <Text style={styles.statLbl}>Attempted</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#059669' }]}>
                  {data.totalCorrect}
                </Text>
                <Text style={styles.statLbl}>Correct</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#dc2626' }]}>
                  {data.totalWrong}
                </Text>
                <Text style={styles.statLbl}>Wrong</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#4338ca' }]}>
                  {data.totalMarks}
                </Text>
                <Text style={styles.statLbl}>Net Marks</Text>
              </View>
            </View>
          </View>
        )}

        {/* DIFFICULTY BREAKDOWN */}
        {data && data.totalAttempted > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Difficulty Accuracy</Text>
            <View style={styles.diffRow}>
              {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
                const metric = data.difficulty[diff];
                const color =
                  diff === 'Easy' ? '#059669' : diff === 'Medium' ? '#d97706' : '#dc2626';
                return (
                  <View key={diff} style={styles.diffCard}>
                    <Text style={[styles.diffName, { color }]}>{diff}</Text>
                    <Text style={styles.diffAccuracy}>{metric.accuracy}%</Text>
                    <View style={styles.diffProgressBar}>
                      <View
                        style={[
                          styles.diffProgressFill,
                          { width: `${metric.accuracy}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                    <Text style={styles.diffAttempts}>{metric.attempted} Qs</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* COMPACT STUDY STREAK SECTION */}
        {streakData && (
          <View style={styles.sectionCard}>
            <View style={styles.revisionProgressHeader}>
              <Text style={styles.sectionTitle}>🔥 Study Streak</Text>
              <Text style={styles.streakTotalDaysText}>
                {streakData.totalCompletedDays} study day{streakData.totalCompletedDays === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={styles.revisionProgressGrid}>
              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#c2410c' }]}>
                  {streakData.currentStreak}
                </Text>
                <Text style={styles.revStatLabel}>Current Streak</Text>
              </View>

              <View style={styles.revStatDivider} />

              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#4338ca' }]}>
                  {streakData.longestStreak}
                </Text>
                <Text style={styles.revStatLabel}>Best Streak</Text>
              </View>

              <View style={styles.revStatDivider} />

              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#059669' }]}>
                  {streakData.totalCompletedDays}
                </Text>
                <Text style={styles.revStatLabel}>Total Days</Text>
              </View>
            </View>
          </View>
        )}

        {/* DAILY STUDY SUMMARY */}
        {studyPlan && (
          <View style={styles.sectionCard}>
            <View style={styles.revisionProgressHeader}>
              <Text style={styles.sectionTitle}>🎯 Daily Study Goal</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('DailyStudyPlan')}
                activeOpacity={0.75}
              >
                <Text style={styles.viewRevisionLink}>Open Plan ➔</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.revisionProgressGrid}>
              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#4f46e5' }]}>
                  {studyPlan.goalQuestions}
                </Text>
                <Text style={styles.revStatLabel}>Today's Goal</Text>
              </View>

              <View style={styles.revStatDivider} />

              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#059669' }]}>
                  {studyPlan.completedQuestions}
                </Text>
                <Text style={styles.revStatLabel}>Completed</Text>
              </View>

              <View style={styles.revStatDivider} />

              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#ea580c' }]}>
                  {studyPlan.remainingQuestions}
                </Text>
                <Text style={styles.revStatLabel}>Remaining</Text>
              </View>

              <View style={styles.revStatDivider} />

              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#0284c7' }]}>
                  {studyPlan.progressPercent}%
                </Text>
                <Text style={styles.revStatLabel}>Progress</Text>
              </View>
            </View>
          </View>
        )}

        {/* REVISION PROGRESS */}
        {revisionStats && (
          <View style={styles.sectionCard}>
            <View style={styles.revisionProgressHeader}>
              <Text style={styles.sectionTitle}>Revision Progress</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Revision')}
                activeOpacity={0.75}
              >
                <Text style={styles.viewRevisionLink}>View Revision ➔</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.revisionProgressGrid}>
              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#ea580c' }]}>
                  {revisionStats.dueToday}
                </Text>
                <Text style={styles.revStatLabel}>Due Today</Text>
              </View>

              <View style={styles.revStatDivider} />

              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#059669' }]}>
                  {revisionStats.mastered}
                </Text>
                <Text style={styles.revStatLabel}>Mastered</Text>
              </View>

              <View style={styles.revStatDivider} />

              <View style={styles.revStatItem}>
                <Text style={[styles.revStatNumber, { color: '#4f46e5' }]}>
                  {revisionStats.inRevision}
                </Text>
                <Text style={styles.revStatLabel}>In Revision</Text>
              </View>
            </View>
          </View>
        )}

        {/* SUBJECT-WISE PERFORMANCE */}
        {data && data.subjects && data.subjects.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Subject Breakdown</Text>
            <View style={styles.subjectList}>
              {data.subjects.map((sub) => {
                return (
                  <View key={sub.subjectId} style={styles.subjectItemCard}>
                    <View style={styles.subjectHeaderRow}>
                      <Text style={styles.subjectItemName}>{sub.subjectName}</Text>
                      <Text style={styles.subjectAccuracyText}>{sub.accuracy}%</Text>
                    </View>
                    <View style={styles.subjectProgressBar}>
                      <View
                        style={[
                          styles.subjectProgressFill,
                          {
                            width: `${sub.accuracy}%`,
                            backgroundColor:
                              sub.accuracy >= 70
                                ? '#059669'
                                : sub.accuracy >= 50
                                ? '#d97706'
                                : '#dc2626',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.subjectMetaRow}>
                      <Text style={styles.subjectMetaText}>
                        {sub.attempted} Attempted • {sub.correct} Correct • {sub.wrong} Wrong
                      </Text>
                      <Text style={styles.subjectMetaMarks}>Avg: {sub.averageMarks} pts</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TOPIC MASTERY & WEAK TOPIC FILTER */}
        <View style={styles.sectionCard}>
          <View style={styles.topicHeaderRow}>
            <Text style={styles.sectionTitle}>Topic Analysis</Text>
            <TouchableOpacity
              style={[styles.weakFilterToggle, onlyWeakFilter && styles.weakFilterToggleActive]}
              onPress={() => setOnlyWeakFilter(!onlyWeakFilter)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.weakFilterToggleText,
                  onlyWeakFilter && styles.weakFilterToggleTextActive,
                ]}
              >
                {onlyWeakFilter ? '✓ Showing Weak Only' : 'Show Weak Only'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SUBJECT FILTER PILLS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {[
              { label: 'All Subjects', slug: 'ALL' },
              { label: 'Quant', slug: 'quantitative-aptitude' },
              { label: 'Reasoning', slug: 'reasoning' },
              { label: 'English', slug: 'english' },
              { label: 'Gen Awareness', slug: 'general-awareness' },
            ].map((p) => (
              <TouchableOpacity
                key={p.slug}
                style={[
                  styles.filterPill,
                  selectedSubjectFilter === p.slug && styles.filterPillActive,
                ]}
                onPress={() => setSelectedSubjectFilter(p.slug)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedSubjectFilter === p.slug && styles.filterPillTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* TOPICS LIST */}
          {filteredTopics.length > 0 ? (
            <View style={styles.topicsGrid}>
              {filteredTopics.map((topic) => {
                const cfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG.INSUFFICIENT_DATA;
                return (
                  <View key={topic.topicId} style={styles.topicCard}>
                    <View style={styles.topicTopRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.topicCardName}>{topic.topicName}</Text>
                        <Text style={styles.topicCardSubject}>{topic.subjectName}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: cfg.bg, borderColor: cfg.border },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
                          {cfg.icon} {cfg.label}
                        </Text>
                      </View>
                    </View>

                    {/* STATS BAR */}
                    <View style={styles.topicStatsRow}>
                      <Text style={styles.topicStatItem}>
                        Accuracy: <Text style={{ fontWeight: '800' }}>{topic.accuracy}%</Text>
                      </Text>
                      <Text style={styles.topicStatItem}>
                        Attempts: <Text style={{ fontWeight: '700' }}>{topic.attempted}</Text>
                      </Text>
                      <Text style={styles.topicStatItem}>
                        Correct: <Text style={{ color: '#059669', fontWeight: '700' }}>{topic.correct}</Text>
                      </Text>
                    </View>

                    {/* ACTION BUTTON */}
                    <TouchableOpacity
                      style={styles.practiceTopicBtn}
                      onPress={() =>
                        navigation.navigate('Practice', {
                          subjectId: topic.subjectId,
                          topicId: topic.topicId,
                          topicName: topic.topicName,
                          difficulty:
                            topic.status === 'CRITICAL'
                              ? 'Easy'
                              : topic.status === 'NEEDS_PRACTICE'
                              ? 'Medium'
                              : 'Hard',
                          questionCount: 10,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.practiceTopicBtnText}>Practice This Topic ➔</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyTopicBox}>
              <Text style={styles.emptyTopicText}>
                {onlyWeakFilter
                  ? '🎉 No weak topics found for this selection!'
                  : 'No practice attempts recorded in this category yet.'}
              </Text>
            </View>
          )}
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
  headerContainer: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  refreshIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  refreshIconText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* ONBOARDING */
  onboardingCard: {
    backgroundColor: '#312e81',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  onboardingIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  onboardingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  onboardingDesc: {
    fontSize: 12,
    color: '#c7d2fe',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  onboardingBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  onboardingBtnText: {
    color: '#312e81',
    fontSize: 13,
    fontWeight: '800',
  },

  /* HERO CARD */
  heroCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroAccuracyNum: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
  },
  heroAccuracyLabel: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  heroCircleBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroCircleIcon: {
    fontSize: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  statLbl: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  /* SECTION CARDS */
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },

  /* DIFFICULTY ROW */
  diffRow: {
    flexDirection: 'row',
    gap: 10,
  },
  diffCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  diffName: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  diffAccuracy: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  diffProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  diffProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  diffAttempts: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },

  /* SUBJECTS LIST */
  subjectList: {
    gap: 12,
  },
  subjectItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  subjectAccuracyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#312e81',
  },
  subjectProgressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  subjectProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectMetaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  subjectMetaMarks: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* TOPIC MASTERY */
  topicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weakFilterToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weakFilterToggleActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  weakFilterToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  weakFilterToggleTextActive: {
    color: '#dc2626',
  },
  filterPillsRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#312e81',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  topicsGrid: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topicTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topicCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  topicCardSubject: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  topicStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topicStatItem: {
    fontSize: 11,
    color: '#475569',
  },
  practiceTopicBtn: {
    backgroundColor: '#eef2ff',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  practiceTopicBtnText: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyTopicBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTopicText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Revision Progress Styles
  revisionProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewRevisionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  streakTotalDaysText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  revisionProgressGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  revStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  revStatNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  revStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  revStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#cbd5e1',
  },
});
