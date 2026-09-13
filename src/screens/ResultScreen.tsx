import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { ResultScreenProps } from '../navigation/types';
import { performanceApi } from '../services/api/performanceApi';
import { studyPlanApi } from '../services/api/studyPlanApi';
import { streakApi } from '../services/api/streakApi';
import { TopicPerformanceMetric } from '../types/performance';
import { StudyStreakSummary } from '../types/streak';

export const ResultScreen: React.FC<ResultScreenProps> = ({
  route,
  navigation,
}) => {
  const {
    totalQuestions = 5,
    correctCount = 0,
    wrongCount = 0,
    marks = 0,
    accuracy = 0,
    topicName = 'Practice Test',
    difficulty = 'Easy',
    subjectId,
    topicId,
    studyPlanItemId,
  } = route.params || {};

  const [topicMetric, setTopicMetric] = useState<TopicPerformanceMetric | null>(null);
  const [streak, setStreak] = useState<StudyStreakSummary | null>(null);
  const [studyPlanProgress, setStudyPlanProgress] = useState<{
    completedQuestions: number;
    goalQuestions: number;
    remainingQuestions: number;
    isGoalComplete: boolean;
  } | null>(null);

  useEffect(() => {
    if (!studyPlanItemId) return;
    studyPlanApi
      .completeStudyPlanItem(studyPlanItemId, totalQuestions)
      .then((res) => {
        if (res && res.plan) {
          const rem = Math.max(0, res.plan.goalQuestions - res.plan.completedQuestions);
          const isComplete = res.plan.status === 'COMPLETED' || rem === 0;
          setStudyPlanProgress({
            completedQuestions: res.plan.completedQuestions,
            goalQuestions: res.plan.goalQuestions,
            remainingQuestions: rem,
            isGoalComplete: isComplete,
          });
          if (isComplete) {
            streakApi.getStudyStreak().then(setStreak).catch(() => {});
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to record plan item completion:', err);
      });
  }, [studyPlanItemId, totalQuestions]);

  useEffect(() => {
    if (!topicId) return;
    let isMounted = true;
    performanceApi
      .getTopicPerformance(topicId)
      .then((metric) => {
        if (isMounted && metric) {
          setTopicMetric(metric);
        }
      })
      .catch(() => {
        // Non-critical, fallback to current attempt stats
      });
    return () => {
      isMounted = false;
    };
  }, [topicId]);

  const getPerformanceMessage = (acc: number) => {
    if (acc >= 80) {
      return {
        tag: 'Outstanding! 🌟',
        desc: 'You demonstrated high accuracy and deep conceptual mastery. You are on track for a top percentile rank!',
        color: '#059669',
      };
    }
    if (acc >= 50) {
      return {
        tag: 'Good Effort! 👍',
        desc: 'Solid foundation. Focus on reviewing explanations for missed questions to achieve 85%+ accuracy.',
        color: '#d97706',
      };
    }
    return {
      tag: 'Keep Practicing! 💪',
      desc: 'Regular daily drills build speed and eliminate negative patterns. Review solutions and try another set!',
      color: '#4f46e5',
    };
  };

  const performance = getPerformanceMessage(accuracy);

  // Historical calculations
  let prevAccuracy: number | null = null;
  let improvement: number | null = null;
  const hasSufficientHistory =
    topicMetric &&
    topicMetric.attempted > totalQuestions &&
    topicMetric.attempted >= 5;

  if (hasSufficientHistory && topicMetric) {
    const prevAttempts = topicMetric.attempted - totalQuestions;
    const prevCorrect = Math.max(0, topicMetric.correct - correctCount);
    if (prevAttempts > 0) {
      prevAccuracy = Math.round((prevCorrect / prevAttempts) * 100);
      improvement = accuracy - prevAccuracy;
    }
  }

  const isWeakTopic =
    topicMetric?.status === 'CRITICAL' || topicMetric?.status === 'NEEDS_PRACTICE';
  const isStrongTopic = topicMetric?.status === 'STRONG';

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'CRITICAL':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'NEEDS_PRACTICE':
        return { bg: '#ffedd5', text: '#ea580c' };
      case 'GOOD':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'STRONG':
        return { bg: '#dcfce7', text: '#16a34a' };
      default:
        return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* TROPHY & TITLE HEADER */}
        <View style={styles.headerBox}>
          <View style={styles.trophyWrapper}>
            <Text style={styles.trophyIcon}>🏆</Text>
          </View>
          <Text style={styles.headerTitle}>Test Completed!</Text>
          <Text style={styles.topicSubtitle}>
            {topicName} • {difficulty}
          </Text>
        </View>

        {/* MAIN SCORE CARD */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>YOUR SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.bigScore}>{marks}</Text>
            <Text style={styles.totalScore}>/ {totalQuestions}</Text>
          </View>

          <View style={styles.accuracyBadge}>
            <Text style={styles.accuracyText}>{accuracy}% Accuracy</Text>
          </View>

          <View style={styles.feedbackBox}>
            <Text style={[styles.feedbackTag, { color: performance.color }]}>
              {performance.tag}
            </Text>
            <Text style={styles.feedbackDesc}>{performance.desc}</Text>
          </View>
        </View>

        {/* METRICS BREAKDOWN */}
        <Text style={styles.metricsHeading}>Performance Breakdown</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridTile}>
            <Text style={styles.gridNumber}>{totalQuestions}</Text>
            <Text style={styles.gridLabel}>Total Questions</Text>
          </View>

          <View style={styles.gridTile}>
            <Text style={[styles.gridNumber, { color: '#059669' }]}>
              {correctCount}
            </Text>
            <Text style={styles.gridLabel}>Correct (+1)</Text>
          </View>

          <View style={styles.gridTile}>
            <Text style={[styles.gridNumber, { color: '#dc2626' }]}>
              {wrongCount}
            </Text>
            <Text style={styles.gridLabel}>Incorrect (0)</Text>
          </View>

          <View style={styles.gridTile}>
            <Text style={[styles.gridNumber, { color: '#2563eb' }]}>
              {marks}
            </Text>
            <Text style={styles.gridLabel}>Final Marks</Text>
          </View>
        </View>

        {/* 📈 YOUR PERFORMANCE (Historical & Topic Analysis) */}
        <View style={styles.topicPerfCard}>
          <View style={styles.topicPerfHeader}>
            <Text style={styles.topicPerfTitle}>📈 YOUR PERFORMANCE</Text>
            {topicMetric?.status && topicMetric.status !== 'INSUFFICIENT_DATA' && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(topicMetric.status).bg },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: getStatusColor(topicMetric.status).text },
                  ]}
                >
                  {topicMetric.status.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.topicPerfGrid}>
            <View style={styles.topicPerfTile}>
              <Text style={styles.topicPerfValue}>{accuracy}%</Text>
              <Text style={styles.topicPerfSub}>This attempt</Text>
            </View>

            <View style={styles.topicPerfTile}>
              <Text style={styles.topicPerfValue}>
                {topicMetric ? `${topicMetric.accuracy}%` : `${accuracy}%`}
              </Text>
              <Text style={styles.topicPerfSub}>Topic average</Text>
            </View>

            {hasSufficientHistory && prevAccuracy !== null ? (
              <>
                <View style={styles.topicPerfTile}>
                  <Text style={styles.topicPerfValue}>{prevAccuracy}%</Text>
                  <Text style={styles.topicPerfSub}>Previous</Text>
                </View>

                <View style={styles.topicPerfTile}>
                  <Text
                    style={[
                      styles.topicPerfValue,
                      { color: (improvement ?? 0) >= 0 ? '#059669' : '#dc2626' },
                    ]}
                  >
                    {(improvement ?? 0) >= 0 ? `+${improvement}%` : `${improvement}%`}
                  </Text>
                  <Text style={styles.topicPerfSub}>Improvement</Text>
                </View>
              </>
            ) : null}
          </View>

          {!hasSufficientHistory && (
            <Text style={styles.earlyDataHint}>
              {topicMetric && topicMetric.attempted > 0
                ? `${topicMetric.attempted} attempt${topicMetric.attempted === 1 ? '' : 's'} recorded for this topic. Complete 5+ questions for full historical trend insights.`
                : 'Complete more practice questions to build your historical trend profile.'}
            </Text>
          )}

          {isWeakTopic && (
            <View style={styles.weakAlertBox}>
              <Text style={styles.weakAlertTitle}>⚠️ Weak Topic Alert</Text>
              <Text style={styles.weakAlertDesc}>
                This is currently one of your weak topics in {topicName}. Focused practice will boost your accuracy.
              </Text>
            </View>
          )}

          {isStrongTopic && (
            <View style={styles.strongAlertBox}>
              <Text style={styles.strongAlertTitle}>🎉 Great improvement!</Text>
              <Text style={styles.strongAlertDesc}>
                You are now performing strongly in this topic with consistent high accuracy.
              </Text>
            </View>
          )}

          {subjectId && topicId && (
            <TouchableOpacity
              style={styles.retryTopicBtn}
              onPress={() =>
                navigation.navigate('Practice', {
                  subjectId,
                  topicId,
                  topicName,
                  difficulty,
                  questionCount: totalQuestions,
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.retryTopicBtnText}>Practice This Topic Again</Text>
              <Text style={styles.retryTopicIcon}>↺</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* REVISION QUEUE UPDATE BANNER */}
        <View style={wrongCount > 0 ? styles.revisionMistakeCard : styles.revisionCleanCard}>
          <View style={styles.revisionCardInnerRow}>
            <Text style={styles.revisionEmoji}>{wrongCount > 0 ? '🔥' : '✓'}</Text>
            <View style={styles.revisionTextCol}>
              <Text style={styles.revisionCardTitle}>
                {wrongCount > 0
                  ? `${wrongCount} question${wrongCount === 1 ? '' : 's'} added to revision`
                  : 'No new revision items'}
              </Text>
              <Text style={styles.revisionCardDesc}>
                {wrongCount > 0
                  ? "We'll bring these back at the right time to lock in formulas."
                  : 'Great work! You mastered every question in this drill.'}
              </Text>
            </View>
            <TouchableOpacity
              style={wrongCount > 0 ? styles.viewRevisionBtn : styles.viewRevisionCleanBtn}
              onPress={() => navigation.navigate('Revision')}
              activeOpacity={0.8}
            >
              <Text style={wrongCount > 0 ? styles.viewRevisionBtnText : styles.viewRevisionCleanBtnText}>
                {wrongCount > 0 ? 'View ➔' : 'View ➔'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STUDY PLAN PROGRESS BANNER */}
        {studyPlanProgress && (
          <View
            style={[
              styles.planResultCard,
              studyPlanProgress.isGoalComplete && styles.planResultCardCompleted,
            ]}
          >
            <View style={styles.planResultBadgeRow}>
              <View
                style={
                  studyPlanProgress.isGoalComplete
                    ? styles.planResultCompletePill
                    : styles.planResultSuccessPill
                }
              >
                <Text style={styles.planResultSuccessPillText}>
                  {studyPlanProgress.isGoalComplete
                    ? '🎉 Daily Goal Complete!'
                    : "✓ Added to Today's Plan"}
                </Text>
              </View>
              {studyPlanProgress.isGoalComplete && streak ? (
                <Text style={styles.planResultStreakText}>
                  🔥 {streak.currentStreak} Day Streak
                </Text>
              ) : (
                <Text style={styles.planResultRemainingText}>
                  {studyPlanProgress.remainingQuestions} remaining
                </Text>
              )}
            </View>
            <Text style={styles.planResultTitle}>
              {studyPlanProgress.isGoalComplete
                ? '🎉 Daily Goal Complete!'
                : "Today's Progress"}
            </Text>
            <Text style={styles.planResultProgressNumbers}>
              {studyPlanProgress.completedQuestions} / {studyPlanProgress.goalQuestions} questions completed
            </Text>
            <View style={styles.planResultProgressBar}>
              <View
                style={[
                  styles.planResultProgressFill,
                  studyPlanProgress.isGoalComplete && styles.planResultProgressFillCompleted,
                  {
                    width: `${
                      studyPlanProgress.goalQuestions > 0
                        ? Math.min(
                            100,
                            (studyPlanProgress.completedQuestions /
                              studyPlanProgress.goalQuestions) *
                              100
                          )
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* ACTION BUTTONS */}
        <View style={styles.actionsContainer}>
          {studyPlanProgress ? (
            <TouchableOpacity
              style={styles.primaryPlanAction}
              onPress={() => navigation.navigate('DailyStudyPlan')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryPlanActionText}>CONTINUE TODAY'S PLAN</Text>
              <Text style={styles.actionArrow}>➔</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => navigation.navigate('Subjects')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>Practice Another Subject</Text>
            <Text style={styles.actionArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionText}>Back to Difficulty</Text>
          </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trophyWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  trophyIcon: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  topicSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  scoreCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  bigScore: {
    fontSize: 52,
    fontWeight: '900',
    color: '#0f172a',
  },
  totalScore: {
    fontSize: 22,
    fontWeight: '700',
    color: '#94a3b8',
    marginLeft: 6,
  },
  accuracyBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  accuracyText: {
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '800',
  },
  feedbackBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    alignItems: 'center',
  },
  feedbackTag: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  feedbackDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  metricsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 28,
  },
  gridTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gridNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryAction: {
    backgroundColor: '#4f46e5',
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionArrow: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryAction: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryActionText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  topicPerfCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topicPerfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topicPerfTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  topicPerfGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  topicPerfTile: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  topicPerfValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  topicPerfSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  earlyDataHint: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    lineHeight: 17,
    marginBottom: 10,
  },
  weakAlertBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 12,
  },
  weakAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
    marginBottom: 3,
  },
  weakAlertDesc: {
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 17,
  },
  strongAlertBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  strongAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
    marginBottom: 3,
  },
  strongAlertDesc: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 17,
  },
  retryTopicBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
  },
  retryTopicBtnText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '700',
  },
  retryTopicIcon: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  // Revision Banner Styles
  revisionMistakeCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  revisionCleanCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  revisionCardInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  revisionEmoji: {
    fontSize: 22,
  },
  revisionTextCol: {
    flex: 1,
  },
  revisionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  revisionCardDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  viewRevisionBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewRevisionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewRevisionCleanBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewRevisionCleanBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  // Study Plan Result Styles
  planResultCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#4338ca',
    shadowColor: '#312e81',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  planResultCardCompleted: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    shadowColor: '#064e3b',
  },
  planResultBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planResultSuccessPill: {
    backgroundColor: '#065f46',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  planResultCompletePill: {
    backgroundColor: '#047857',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  planResultStreakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fef08a',
  },
  planResultSuccessPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a7f3d0',
  },
  planResultRemainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fef08a',
  },
  planResultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  planResultProgressNumbers: {
    fontSize: 13,
    color: '#c7d2fe',
    marginTop: 2,
    marginBottom: 10,
  },
  planResultProgressBar: {
    height: 8,
    backgroundColor: '#312e81',
    borderRadius: 4,
    overflow: 'hidden',
  },
  planResultProgressFill: {
    height: '100%',
    backgroundColor: '#818cf8',
    borderRadius: 4,
  },
  planResultProgressFillCompleted: {
    backgroundColor: '#34d399',
  },
  primaryPlanAction: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  primaryPlanActionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
