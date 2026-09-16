import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DailyStudyPlanScreenProps } from '../navigation/types';
import { useExam } from '../context/ExamContext';
import { studyPlanApi } from '../services/api/studyPlanApi';
import { streakApi } from '../services/api/streakApi';
import {
  DailyStudyPlanSummary,
  StudyPlanItem,
  StudyPlanItemType,
} from '../types/studyPlan';
import { StudyStreakSummary } from '../types/streak';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';

export const DailyStudyPlanScreen: React.FC<DailyStudyPlanScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { examSlug } = useExam();
  const [plan, setPlan] = useState<DailyStudyPlanSummary | null>(null);
  const [streak, setStreak] = useState<StudyStreakSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingGoal, setUpdatingGoal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanAndStreak = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const [planData, streakData] = await Promise.all([
        studyPlanApi.getTodayStudyPlan(examSlug),
        streakApi.getStudyStreak().catch(() => null),
      ]);
      setPlan(planData);
      if (streakData) setStreak(streakData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load study plan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examSlug]);

  useEffect(() => {
    fetchPlanAndStreak();
  }, [fetchPlanAndStreak]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlanAndStreak(true);
  }, [fetchPlanAndStreak]);

  const handleGoalChange = async (goalQuestions: number) => {
    if (!plan || plan.goalQuestions === goalQuestions || updatingGoal) return;
    setUpdatingGoal(true);
    try {
      await studyPlanApi.updateDailyGoal(goalQuestions, examSlug);
      await fetchPlanAndStreak(true);
    } catch (err: any) {
      console.warn('Failed to update daily goal:', err);
    } finally {
      setUpdatingGoal(false);
    }
  };

  const handleLaunchItem = async (item: StudyPlanItem) => {
    if (item.completed) return;

    // Start plan if not started yet
    if (plan?.status === 'NOT_STARTED') {
      try {
        await studyPlanApi.startStudyPlan(examSlug);
      } catch (e) {
        console.warn('Failed to start study plan:', e);
      }
    }

    if (item.type === 'REVISION') {
      navigation.navigate('Revision', { initialLimit: item.remainingCount || item.questionCount });
    } else if (item.type === 'MINI_MOCK') {
      navigation.navigate('Practice', {
        subjectId: item.subjectId || 'mini-mock',
        topicId: item.topicId || 'mixed',
        topicName: 'Mini Mock Sprint',
        difficulty: 'Medium',
        questionCount: item.remainingCount || item.questionCount,
        studyPlanItemId: item.id,
      });
    } else {
      // WEAK_TOPIC, RECOMMENDED, BALANCED_PRACTICE
      navigation.navigate('Practice', {
        subjectId: item.subjectId || '',
        topicId: item.topicId || '',
        topicName: item.topicName || item.title,
        difficulty: item.difficulty || 'Medium',
        questionCount: item.remainingCount || item.questionCount,
        studyPlanItemId: item.id,
      });
    }
  };

  const handleStartOrContinue = async () => {
    if (!plan || !plan.items || plan.items.length === 0) return;

    if (plan.status === 'COMPLETED') {
      navigation.navigate('Performance');
      return;
    }

    // Find first uncompleted task
    const nextItem = plan.items.find((it) => !it.completed) || plan.items[0];
    handleLaunchItem(nextItem);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.screenRoot}>
        <LoadingView message="Assembling today's smart study plan..." />
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={styles.screenRoot}>
        <ErrorView
          message={error || 'Unable to generate study plan'}
          onRetry={() => fetchPlanAndStreak(false)}
          retryTitle="Retry Plan Generation"
        />
      </View>
    );
  }

  const isCompleted = plan.status === 'COMPLETED';
  const isInProgress = plan.status === 'IN_PROGRESS';

  const getItemBadge = (type: StudyPlanItemType) => {
    switch (type) {
      case 'REVISION':
        return { label: '🔄 Due for revision', bg: '#fef3c7', text: '#92400e' };
      case 'WEAK_TOPIC':
        return { label: '⚠️ Needs attention', bg: '#fee2e2', text: '#b91c1c' };
      case 'RECOMMENDED':
        return { label: '💡 Recommended for you', bg: '#e0e7ff', text: '#3730a3' };
      case 'BALANCED_PRACTICE':
        return { label: '📚 Balanced syllabus coverage', bg: '#ecfdf5', text: '#065f46' };
      case 'MINI_MOCK':
        return { label: '📝 Mini Mock sprint', bg: '#ffedd5', text: '#9a3412' };
      default:
        return { label: '🎯 Practice', bg: '#f1f5f9', text: '#334155' };
    }
  };

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Study Plan</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
        }
      >
        {/* DAILY GOAL SELECTOR */}
        <View style={styles.goalSelectorCard}>
          <View style={styles.goalSelectorHeader}>
            <Text style={styles.goalSelectorTitle}>Daily Question Target</Text>
            {updatingGoal && <ActivityIndicator size="small" color="#4f46e5" />}
          </View>
          <View style={styles.goalChipsRow}>
            {[20, 35, 50].map((goal) => {
              const isSelected = plan.goalQuestions === goal;
              return (
                <TouchableOpacity
                  key={goal}
                  style={[styles.goalChip, isSelected && styles.goalChipSelected]}
                  onPress={() => handleGoalChange(goal)}
                  activeOpacity={0.7}
                  disabled={updatingGoal}
                >
                  <Text
                    style={[styles.goalChipText, isSelected && styles.goalChipTextSelected]}
                  >
                    {goal} Questions
                  </Text>
                  <Text
                    style={[
                      styles.goalChipSub,
                      isSelected && styles.goalChipSubSelected,
                    ]}
                  >
                    {goal === 20 ? '~15 min' : goal === 35 ? '~30 min' : '~45 min'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PROGRESS OVERVIEW HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleCol}>
              <Text style={styles.heroSubtitle}>🌅 TODAY'S SCHEDULE</Text>
              <Text style={styles.heroTitle}>
                {plan.goalQuestions} Questions • ~{plan.estimatedMinutes} min
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isCompleted
                  ? styles.statusBadgeCompleted
                  : isInProgress
                  ? styles.statusBadgeProgress
                  : styles.statusBadgeNotStarted,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isCompleted
                    ? styles.statusBadgeTextCompleted
                    : isInProgress
                    ? styles.statusBadgeTextProgress
                    : styles.statusBadgeTextNotStarted,
                ]}
                numberOfLines={1}
              >
                {isCompleted
                  ? '🎉 COMPLETED'
                  : isInProgress
                  ? 'IN PROGRESS'
                  : 'READY TO START'}
              </Text>
            </View>
          </View>

          {/* PROGRESS TRACK */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabelText}>
                {plan.completedQuestions} of {plan.goalQuestions} completed
              </Text>
              <Text style={styles.progressPercentText}>{plan.progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.max(0, plan.progressPercent))}%` },
                ]}
              />
            </View>
            <Text style={styles.remainingText}>
              {isCompleted
                ? 'All tasks completed for today!'
                : `${plan.remainingQuestions} questions remaining to reach your goal`}
            </Text>

            {isCompleted && (
              <View style={styles.streakCelebrationBox}>
                <Text style={styles.streakCelebrationTag}>🎉 DAILY GOAL COMPLETE!</Text>
                <Text style={styles.streakCelebrationNumbers}>
                  {plan.completedQuestions} / {plan.goalQuestions} Questions
                </Text>
                {streak && (
                  <View style={styles.streakPill}>
                    <Text style={styles.streakPillText}>
                      🔥 {streak.currentStreak} Day Streak
                    </Text>
                  </View>
                )}
                <Text style={styles.streakCelebrationMsg}>
                  You completed today's study goal.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* TASKS CHECKLIST SECTION */}
        <View style={styles.tasksSection}>
          <Text style={styles.tasksSectionTitle}>Today's Learning Tasks</Text>
          <Text style={styles.tasksSectionSub}>
            Curated automatically based on mistakes, weaknesses & balanced coverage
          </Text>

          <View style={styles.tasksList}>
            {plan.items.map((item, index) => {
              const badge = getItemBadge(item.type);
              return (
                <View
                  key={item.id || index}
                  style={[styles.taskCard, item.completed && styles.taskCardCompleted]}
                >
                  <View style={styles.taskHeaderRow}>
                    <View style={[styles.taskBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.taskBadgeText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <Text style={styles.taskCountBadge}>
                      {item.completedCount} / {item.questionCount} Qs
                    </Text>
                  </View>

                  <Text style={styles.taskTitle}>{item.title}</Text>
                  {item.subjectName && (
                    <Text style={styles.taskSubtitle}>
                      {item.subjectName}
                      {item.difficulty ? ` • ${item.difficulty}` : ''}
                    </Text>
                  )}

                  <View style={styles.taskFooterRow}>
                    <View style={styles.taskProgressMiniTrack}>
                      <View
                        style={[
                          styles.taskProgressMiniFill,
                          {
                            width: `${
                              item.questionCount > 0
                                ? (item.completedCount / item.questionCount) * 100
                                : 0
                            }%`,
                          },
                        ]}
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.taskActionButton,
                        item.completed && styles.taskActionButtonCompleted,
                      ]}
                      onPress={() => handleLaunchItem(item)}
                      disabled={item.completed}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.taskActionButtonText,
                          item.completed && styles.taskActionButtonTextCompleted,
                        ]}
                      >
                        {item.completed ? '✓ Done' : 'Practice →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* STICKY BOTTOM PRIMARY CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
        <TouchableOpacity
          style={[styles.primaryCta, isCompleted && styles.primaryCtaCompleted]}
          onPress={handleStartOrContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryCtaText}>
            {isCompleted
              ? '🎉 REVIEW TODAY’S PERFORMANCE →'
              : isInProgress
              ? "CONTINUE TODAY'S PLAN →"
              : "START TODAY'S PLAN →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  goalSelectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  goalSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalSelectorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  goalChipSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  goalChipTextSelected: {
    color: '#4f46e5',
  },
  goalChipSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  goalChipSubSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroTitleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a5b4fc',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  statusBadgeNotStarted: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  statusBadgeProgress: {
    backgroundColor: '#fef08a',
  },
  statusBadgeCompleted: {
    backgroundColor: '#86efac',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    letterSpacing: 0.5,
  },
  statusBadgeTextNotStarted: {
    color: '#f1f5f9',
  },
  statusBadgeTextProgress: {
    color: '#854d0e',
  },
  statusBadgeTextCompleted: {
    color: '#14532d',
  },
  progressContainer: {
    marginTop: 18,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabelText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  progressPercentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#a5b4fc',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  streakCelebrationBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#0f3d2e',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#059669',
    alignItems: 'center',
  },
  streakCelebrationTag: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  streakCelebrationNumbers: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  streakPill: {
    backgroundColor: '#064e3b',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    marginBottom: 8,
  },
  streakPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#a7f3d0',
  },
  streakCelebrationMsg: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a7f3d0',
    textAlign: 'center',
  },
  tasksSection: {
    marginTop: 4,
  },
  tasksSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  tasksSectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  taskCardCompleted: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    opacity: 0.85,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  taskFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  taskProgressMiniTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  taskProgressMiniFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  taskActionButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  taskActionButtonCompleted: {
    backgroundColor: '#e2e8f0',
  },
  taskActionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  taskActionButtonTextCompleted: {
    color: '#64748b',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  primaryCta: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCtaCompleted: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
