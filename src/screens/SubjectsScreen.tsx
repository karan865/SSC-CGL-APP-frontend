import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SubjectsScreenProps } from '../navigation/types';
import { subjectApi } from '../services/api/subjectApi';
import { mockTestApi } from '../services/api/mockTestApi';
import { practiceApi } from '../services/api/practiceApi';
import { performanceApi } from '../services/api/performanceApi';
import { revisionApi } from '../services/api/revisionApi';
import { studyPlanApi } from '../services/api/studyPlanApi';
import { streakApi } from '../services/api/streakApi';
import { Subject } from '../types/subject';
import { MockReviewQuestion, MockMarkedQuestionsResponse } from '../types/mockTest';
import { UserPerformanceSummary, PracticeRecommendation } from '../types/performance';
import { RevisionSummary } from '../types/revision';
import { DailyStudyPlanSummary } from '../types/studyPlan';
import { StudyStreakSummary } from '../types/streak';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { API_BASE_URL } from '../constants/config';

interface SubjectMeta {
  icon: string;
  badge: string;
  color: string;
  bgLight: string;
  tagline: string;
}

const SUBJECT_METAS: Record<string, SubjectMeta> = {
  'quantitative-aptitude': {
    icon: '📐',
    badge: 'High Scoring',
    color: '#2563eb',
    bgLight: '#eff6ff',
    tagline: 'Arithmetic, Percentage, Profit & Loss, Geometry',
  },
  'reasoning': {
    icon: '🧠',
    badge: 'Speed & Logic',
    color: '#7c3aed',
    bgLight: '#f5f3ff',
    tagline: 'Analogy, Series, Syllogism & Coding-Decoding',
  },
  'english': {
    icon: '📖',
    badge: 'Core Verbal',
    color: '#059669',
    bgLight: '#ecfdf5',
    tagline: 'Spotting Errors, Grammar, Vocab & Idioms',
  },
  'general-awareness': {
    icon: '🌍',
    badge: 'Dynamic & Static',
    color: '#d97706',
    bgLight: '#fffbeb',
    tagline: 'Polity, Modern History, Science & Current Affairs',
  },
};

const DEFAULT_META: SubjectMeta = {
  icon: '📚',
  badge: 'Practice Pillar',
  color: '#4f46e5',
  bgLight: '#eef2ff',
  tagline: 'Essential questions aligned with latest SSC CGL pattern',
};

export const SubjectsScreen: React.FC<SubjectsScreenProps> = ({ navigation }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Top tab switcher: 'ALL' or 'MARKED'
  const [activeTab, setActiveTab] = useState<'ALL' | 'MARKED'>('ALL');

  // Marked questions state
  const [markedData, setMarkedData] = useState<MockMarkedQuestionsResponse | null>(null);
  const [selectedMarkedQuestion, setSelectedMarkedQuestion] = useState<{
    question: MockReviewQuestion;
    index: number;
  } | null>(null);

  // Personalized Performance & Recommendations state
  const [perfData, setPerfData] = useState<UserPerformanceSummary | null>(null);
  const [recommendation, setRecommendation] = useState<PracticeRecommendation | null>(null);
  const [revisionSummary, setRevisionSummary] = useState<RevisionSummary | null>(null);
  const [studyPlan, setStudyPlan] = useState<DailyStudyPlanSummary | null>(null);
  const [streakData, setStreakData] = useState<StudyStreakSummary | null>(null);

  const fetchSubjects = useCallback(async () => {
    setError(null);
    try {
      const data = await subjectApi.getSubjects();
      setSubjects(data);
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to reach the backend server. Please verify Wi-Fi / USB connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMarkedQuestions = useCallback(async () => {
    try {
      const data = await mockTestApi.getMarkedQuestions();
      setMarkedData(data);
    } catch {
      // Non-critical background fetch
    }
  }, []);

  const fetchPerformanceData = useCallback(async () => {
    try {
      const [summary, rec] = await Promise.all([
        performanceApi.getPerformanceSummary(),
        performanceApi.getRecommendations(),
      ]);
      setPerfData(summary);
      setRecommendation(Array.isArray(rec) ? rec[0] || null : rec);
    } catch {
      // Non-critical background fetch
    }
  }, []);

  const fetchRevisionData = useCallback(async () => {
    try {
      const rev = await revisionApi.getRevisionSummary();
      setRevisionSummary(rev);
    } catch {
      // Non-critical background fetch
    }
  }, []);

  const fetchStudyPlan = useCallback(async () => {
    try {
      const plan = await studyPlanApi.getTodayStudyPlan();
      setStudyPlan(plan);
    } catch {
      // Non-critical background fetch
    }
  }, []);

  const fetchStreakData = useCallback(async () => {
    try {
      const streak = await streakApi.getStudyStreak();
      setStreakData(streak);
    } catch {
      // Non-critical background fetch
    }
  }, []);

  // Automatically refresh marked questions, performance, revision, study plan & streak whenever candidate returns to screen
  useFocusEffect(
    useCallback(() => {
      fetchMarkedQuestions();
      fetchPerformanceData();
      fetchRevisionData();
      fetchStudyPlan();
      fetchStreakData();
    }, [fetchMarkedQuestions, fetchPerformanceData, fetchRevisionData, fetchStudyPlan, fetchStreakData])
  );

  useEffect(() => {
    fetchSubjects();
    fetchMarkedQuestions();
    fetchPerformanceData();
    fetchRevisionData();
    fetchStudyPlan();
    fetchStreakData();
  }, [fetchSubjects, fetchMarkedQuestions, fetchPerformanceData, fetchRevisionData, fetchStudyPlan, fetchStreakData]);

  const handleUnmarkQuestion = async (questionId: string) => {
    if (!questionId) return;

    // Optimistically remove from markedData and decrement count immediately
    setMarkedData((prev) => {
      if (!prev) return null;
      const filtered = prev.questions.filter((q) => q.questionId !== questionId);
      return {
        ...prev,
        totalMarked: filtered.length,
        questions: filtered,
      };
    });

    try {
      await practiceApi.markQuestion({
        questionId,
        isMarked: false,
      });
    } catch (err) {
      console.warn('Failed to unmark question from notebook:', err);
      fetchMarkedQuestions();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSubjects();
    fetchMarkedQuestions();
    fetchPerformanceData();
    fetchRevisionData();
    fetchStudyPlan();
    fetchStreakData();
  }, [fetchSubjects, fetchMarkedQuestions, fetchPerformanceData, fetchRevisionData, fetchStudyPlan, fetchStreakData]);

  const handleSelectSubject = (subject: Subject) => {
    navigation.navigate('Topics', {
      subjectId: subject._id,
      subjectName: subject.name,
    });
  };

  if (loading && !refreshing) {
    return <LoadingView message="Connecting to SSC CGL Question Bank..." />;
  }

  if (error && subjects.length === 0) {
    return (
      <View style={styles.screenRoot}>
        <View style={styles.errorContainer}>
          <ErrorView
            message={`${error}\n\nHost: ${API_BASE_URL}\n\nTip: If using live cloud backend, ensure internet connectivity. If testing locally via USB, run:\nadb reverse tcp:5000 tcp:5000`}
            onRetry={() => {
              setLoading(true);
              fetchSubjects();
              fetchMarkedQuestions();
            }}
            retryTitle="Reconnect Now"
          />
        </View>
      </View>
    );
  }

  const markedQuestionsList = markedData?.questions || [];
  const markedCount = markedQuestionsList.length;

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        overScrollMode="always"
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
          />
        }
      >
        {/* TOP SEGMENTED MODE SELECTOR */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'ALL' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('ALL');
              fetchMarkedQuestions();
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'ALL' && styles.tabButtonTextActive]}>
              🎯 All Drills & Mocks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'MARKED' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('MARKED');
              fetchMarkedQuestions();
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'MARKED' && styles.tabButtonTextActive]}>
              🔖 Marked Questions
            </Text>
            {markedCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{markedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* VIEW 1: FULL OVERVIEW (ACTIVE WHEN TAB === 'ALL')        */}
        {/* ======================================================== */}
        {activeTab === 'ALL' && (
          <>
            {/* ======================================================== */}
            {/* 🎯 TODAY'S SMART STUDY PLAN HERO CARD                    */}
            {/* ======================================================== */}
            {studyPlan && (
              <TouchableOpacity
                style={[
                  styles.planHeroCard,
                  studyPlan.status === 'COMPLETED' && styles.planHeroCardCompleted,
                ]}
                onPress={() => navigation.navigate('DailyStudyPlan')}
                activeOpacity={0.9}
              >
                {studyPlan.status === 'COMPLETED' ? (
                  <>
                    <View style={styles.planBadgeRow}>
                      <View style={styles.planCompleteBadge}>
                        <Text style={styles.planCompleteBadgeText}>
                          {streakData && streakData.totalCompletedDays === 1
                            ? '🎉 FIRST DAY COMPLETE!'
                            : '🎉 DAILY GOAL COMPLETE!'}
                        </Text>
                      </View>
                      {streakData && (
                        <View style={styles.planStreakCompletedBadge}>
                          <Text style={styles.planStreakCompletedBadgeText}>
                            🔥 {streakData.currentStreak} Day Streak
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planHeroTitle}>
                      {studyPlan.completedQuestions} / {studyPlan.goalQuestions} Questions
                    </Text>
                    <Text style={styles.planHeroDesc}>
                      {streakData && streakData.currentStreak > 1
                        ? `🔥 ${streakData.currentStreak} Day Streak! You completed today's study goal.`
                        : "You completed today's study goal. Excellent dedication!"}
                    </Text>
                    <View style={[styles.planCtaButton, styles.planCtaButtonCompleted]}>
                      <Text style={styles.planCtaButtonText}>VIEW TODAY'S RESULTS</Text>
                      <Text style={styles.planCtaArrow}>➔</Text>
                    </View>
                  </>
                ) : studyPlan.status === 'IN_PROGRESS' ? (
                  <>
                    <View style={styles.planBadgeRow}>
                      <View style={styles.planStreakActiveBadge}>
                        <Text style={styles.planStreakActiveBadgeText}>
                          {streakData && streakData.currentStreak > 0
                            ? `🔥 ${streakData.currentStreak} DAY STREAK`
                            : '🔥 START YOUR STREAK'}
                        </Text>
                      </View>
                      <Text style={styles.planRemainingBadgeText}>
                        {studyPlan.remainingQuestions} questions remaining
                      </Text>
                    </View>
                    <Text style={styles.planHeroLabel}>Today's Goal</Text>
                    <Text style={styles.planHeroTitle}>
                      {studyPlan.completedQuestions} / {studyPlan.goalQuestions} Questions
                    </Text>
                    {/* Progress bar */}
                    <View style={styles.planProgressTrack}>
                      <View
                        style={[
                          styles.planProgressFill,
                          { width: `${Math.min(100, Math.max(0, studyPlan.progressPercent))}%` },
                        ]}
                      />
                    </View>
                    {/* Task micro chips breakdown */}
                    {(() => {
                      const revItems = studyPlan.items.filter((it) => it.type === 'REVISION');
                      const weakItems = studyPlan.items.filter((it) => it.type === 'WEAK_TOPIC');
                      const pracItems = studyPlan.items.filter(
                        (it) => it.type === 'RECOMMENDED' || it.type === 'BALANCED_PRACTICE'
                      );
                      const mockItems = studyPlan.items.filter((it) => it.type === 'MINI_MOCK');

                      const revDone = revItems.reduce((acc, it) => acc + it.completedCount, 0);
                      const revTotal = revItems.reduce((acc, it) => acc + it.questionCount, 0);

                      const weakDone = weakItems.reduce((acc, it) => acc + it.completedCount, 0);
                      const weakTotal = weakItems.reduce((acc, it) => acc + it.questionCount, 0);

                      const pracDone = pracItems.reduce((acc, it) => acc + it.completedCount, 0);
                      const pracTotal = pracItems.reduce((acc, it) => acc + it.questionCount, 0);

                      const mockDone = mockItems.reduce((acc, it) => acc + it.completedCount, 0);
                      const mockTotal = mockItems.reduce((acc, it) => acc + it.questionCount, 0);

                      return (
                        <View style={styles.planChipsRow}>
                          {revTotal > 0 && (
                            <View style={styles.planMiniChip}>
                              <Text style={styles.planMiniChipText}>🔥 {revDone}/{revTotal}</Text>
                            </View>
                          )}
                          {weakTotal > 0 && (
                            <View style={styles.planMiniChip}>
                              <Text style={styles.planMiniChipText}>⚠️ {weakDone}/{weakTotal}</Text>
                            </View>
                          )}
                          {pracTotal > 0 && (
                            <View style={styles.planMiniChip}>
                              <Text style={styles.planMiniChipText}>📚 {pracDone}/{pracTotal}</Text>
                            </View>
                          )}
                          {mockTotal > 0 && (
                            <View style={styles.planMiniChip}>
                              <Text style={styles.planMiniChipText}>📝 {mockDone}/{mockTotal}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })()}
                    <View style={styles.planCtaButton}>
                      <Text style={styles.planCtaButtonText}>CONTINUE TODAY'S PLAN</Text>
                      <Text style={styles.planCtaArrow}>➔</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.planBadgeRow}>
                      <View style={styles.planStreakActiveBadge}>
                        <Text style={styles.planStreakActiveBadgeText}>
                          {streakData && streakData.currentStreak > 0
                            ? `🔥 ${streakData.currentStreak} DAY STREAK`
                            : '🔥 START YOUR STREAK'}
                        </Text>
                      </View>
                      <Text style={styles.planMetaText}>
                        ~{studyPlan.estimatedMinutes} min
                      </Text>
                    </View>
                    <Text style={styles.planHeroLabel}>Today's Goal</Text>
                    <Text style={styles.planHeroTitle}>{studyPlan.goalQuestions} Questions</Text>
                    <Text style={styles.planHeroDesc}>
                      {!streakData || streakData.totalCompletedDays === 0
                        ? "Complete today's study goal to start your first streak."
                        : `${studyPlan.goalQuestions} questions balanced across Due Revision, Weak Topics & Practice`}
                    </Text>
                    {/* Distinct Category Preview Chips */}
                    {(() => {
                      const hasRevision = studyPlan.items.some((it) => it.type === 'REVISION');
                      const hasWeakTopics = studyPlan.items.some((it) => it.type === 'WEAK_TOPIC');
                      const hasPractice = studyPlan.items.some(
                        (it) => it.type === 'RECOMMENDED' || it.type === 'BALANCED_PRACTICE'
                      );
                      const hasMiniMock = studyPlan.items.some((it) => it.type === 'MINI_MOCK');

                      return (
                        <View style={styles.planChipsRow}>
                          {hasRevision && (
                            <View style={styles.planPreviewChip}>
                              <Text style={styles.planPreviewChipText}>🔥 Revision</Text>
                            </View>
                          )}
                          {hasWeakTopics && (
                            <View style={styles.planPreviewChip}>
                              <Text style={styles.planPreviewChipText}>⚠️ Weak Topics</Text>
                            </View>
                          )}
                          {hasPractice && (
                            <View style={styles.planPreviewChip}>
                              <Text style={styles.planPreviewChipText}>📚 Practice</Text>
                            </View>
                          )}
                          {hasMiniMock && (
                            <View style={styles.planPreviewChip}>
                              <Text style={styles.planPreviewChipText}>📝 Mini Mock</Text>
                            </View>
                          )}
                        </View>
                      );
                    })()}
                    <View style={styles.planCtaButton}>
                      <Text style={styles.planCtaButtonText}>
                        {!streakData || streakData.totalCompletedDays === 0
                          ? "START TODAY'S PLAN"
                          : "START TODAY'S PLAN"}
                      </Text>
                      <Text style={styles.planCtaArrow}>➔</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* FULL SSC CGL TIER-1 MOCK TEST HERO BANNER */}
            <TouchableOpacity
              style={styles.mockHeroCard}
              onPress={() => navigation.navigate('MockInstructions')}
              activeOpacity={0.88}
            >
              <View style={styles.mockBadgeRow}>
                <View style={styles.mockOfficialBadge}>
                  <Text style={styles.mockOfficialBadgeText}>🏆 OFFICIAL TIER-I EXAM</Text>
                </View>
                <View style={styles.mockTimerBadge}>
                  <Text style={styles.mockTimerBadgeText}>⏱️ 60 MINS • 200 MARKS</Text>
                </View>
              </View>

              <Text style={styles.mockHeroTitle}>Full SSC CGL Mock Test</Text>
              <Text style={styles.mockHeroDesc}>
                Real exam simulation featuring 100 questions across 4 timed sections, official +2 / -0.50 marking, and instant solutions.
              </Text>

              {/* 3-Column Micro Specs */}
              <View style={styles.mockSpecsRow}>
                <View style={styles.mockSpecItem}>
                  <Text style={styles.mockSpecNumber}>100</Text>
                  <Text style={styles.mockSpecLabel}>Questions</Text>
                </View>
                <View style={styles.mockSpecDivider} />
                <View style={styles.mockSpecItem}>
                  <Text style={styles.mockSpecNumber}>15m</Text>
                  <Text style={styles.mockSpecLabel}>Per Section</Text>
                </View>
                <View style={styles.mockSpecDivider} />
                <View style={styles.mockSpecItem}>
                  <Text style={styles.mockSpecNumber}>+2 / -0.5</Text>
                  <Text style={styles.mockSpecLabel}>Official Rules</Text>
                </View>
              </View>

              <View style={styles.mockCtaButton}>
                <Text style={styles.mockCtaButtonText}>Take 100-Question Mock Test</Text>
                <Text style={styles.mockCtaArrow}>➔</Text>
              </View>
            </TouchableOpacity>

            {/* ======================================================== */}
            {/* ⚡ REDESIGNED PERFORMANCE & RECOMMENDATIONS HERO COCKPIT */}
            {/* ======================================================== */}
            {perfData && perfData.totalAttempted >= 5 ? (
              <View style={styles.perfHeroCard}>
                {/* Top Header with Live Pulse Indicator & Full Analytics Link */}
                <View style={styles.perfHeroTopBar}>
                  <View style={styles.perfPulseBadge}>
                    <View style={styles.pulseLiveDot} />
                    <Text style={styles.perfPulseText}>PERFORMANCE PULSE</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.perfAnalyticsLink}
                    onPress={() => navigation.navigate('Performance')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.perfAnalyticsLinkText}>Full Analytics</Text>
                    <Text style={styles.perfAnalyticsLinkArrow}>➔</Text>
                  </TouchableOpacity>
                </View>

                {/* Hero Accuracy & Tier Progress */}
                <View style={styles.perfHeroMainRow}>
                  <View style={styles.perfAccuracyBox}>
                    <View style={styles.accuracyValueRow}>
                      <Text style={styles.perfAccuracyValue}>{perfData.overallAccuracy}%</Text>
                      <View
                        style={[
                          styles.perfMasteryPill,
                          perfData.overallAccuracy >= 75
                            ? styles.pillMasteryHigh
                            : perfData.overallAccuracy >= 50
                            ? styles.pillMasteryMid
                            : styles.pillMasteryLow,
                        ]}
                      >
                        <Text
                          style={[
                            styles.perfMasteryPillText,
                            perfData.overallAccuracy >= 75
                              ? styles.textMasteryHigh
                              : perfData.overallAccuracy >= 50
                              ? styles.textMasteryMid
                              : styles.textMasteryLow,
                          ]}
                        >
                          {perfData.overallAccuracy >= 75
                            ? '⭐ Strong'
                            : perfData.overallAccuracy >= 50
                            ? '⚡ Moderate'
                            : '⚠️ Needs Drill'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.perfAccuracyLabel}>Overall Accuracy</Text>
                  </View>

                  {/* Visual Accuracy Track Bar */}
                  <View style={styles.perfProgressTrackWrapper}>
                    <View style={styles.perfProgressBarTrack}>
                      <View
                        style={[
                          styles.perfProgressBarFill,
                          { width: `${Math.min(100, Math.max(8, perfData.overallAccuracy))}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.perfProgressLabels}>
                      <Text style={styles.perfProgressMin}>0%</Text>
                      <Text style={styles.perfProgressTarget}>85%+ Target</Text>
                      <Text style={styles.perfProgressMax}>100%</Text>
                    </View>
                  </View>
                </View>

                {/* 3 Metric Pills with Glowing Tint Accents */}
                <View style={styles.perfMetricTilesRow}>
                  <View style={styles.perfMetricTile}>
                    <Text style={styles.perfMetricTileIcon}>🎯</Text>
                    <Text style={styles.perfMetricTileNumber}>{perfData.totalAttempted}</Text>
                    <Text style={styles.perfMetricTileLabel}>Attempted</Text>
                  </View>

                  <View style={[styles.perfMetricTile, styles.perfMetricTileCorrect]}>
                    <Text style={[styles.perfMetricTileIcon, { color: '#10b981' }]}>✓</Text>
                    <Text style={[styles.perfMetricTileNumber, { color: '#34d399' }]}>
                      {perfData.totalCorrect}
                    </Text>
                    <Text style={styles.perfMetricTileLabel}>Correct (+1)</Text>
                  </View>

                  <View style={[styles.perfMetricTile, styles.perfMetricTileWrong]}>
                    <Text style={[styles.perfMetricTileIcon, { color: '#f43f5e' }]}>✗</Text>
                    <Text style={[styles.perfMetricTileNumber, { color: '#fb7185' }]}>
                      {perfData.totalWrong}
                    </Text>
                    <Text style={styles.perfMetricTileLabel}>Incorrect</Text>
                  </View>
                </View>

                {/* FOCUS AREAS (TOP WEAK TOPICS) */}
                {perfData.weakTopics && perfData.weakTopics.length > 0 && (
                  <View style={styles.focusSection}>
                    <View style={styles.focusSectionHeader}>
                      <Text style={styles.focusSectionTitle}>🔥 FOCUS AREAS</Text>
                      <Text style={styles.focusSectionSubtitle}>Tap to drill weakness</Text>
                    </View>

                    <View style={styles.focusCardsList}>
                      {perfData.weakTopics.slice(0, 3).map((w) => (
                        <TouchableOpacity
                          key={w.topicId}
                          style={styles.focusTopicCard}
                          onPress={() =>
                            navigation.navigate('Practice', {
                              subjectId: w.subjectId,
                              topicId: w.topicId,
                              topicName: w.topicName,
                              difficulty: 'Medium',
                              questionCount: 10,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <View style={styles.focusTopicInfo}>
                            <Text style={styles.focusTopicTitle} numberOfLines={1}>
                              {w.topicName}
                            </Text>
                            <Text style={styles.focusTopicSubject}>
                              {w.subjectName || 'Syllabus Topic'} • {w.attempted} attempts
                            </Text>
                          </View>

                          <View style={styles.focusBadgeWrap}>
                            <View
                              style={[
                                styles.focusTagPill,
                                w.status === 'CRITICAL'
                                  ? styles.focusTagCritical
                                  : styles.focusTagWarning,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.focusTagPillText,
                                  w.status === 'CRITICAL'
                                    ? styles.focusTagCriticalText
                                    : styles.focusTagWarningText,
                                ]}
                              >
                                {w.accuracy}% Acc
                              </Text>
                            </View>
                            <Text style={styles.focusDrillArrow}>➔</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* RECOMMENDED FOR YOU (1-TAP DIRECT PRACTICE) */}
                {recommendation && (
                  <View style={styles.recSectionCard}>
                    <View style={styles.recCardHeader}>
                      <View style={styles.recBadgePill}>
                        <Text style={styles.recBadgeIcon}>🎯</Text>
                        <Text style={styles.recBadgeTitle}>RECOMMENDED FOR YOU</Text>
                      </View>
                      <View
                        style={[
                          styles.recDiffPill,
                          recommendation.difficulty === 'Easy'
                            ? styles.recDiffEasy
                            : recommendation.difficulty === 'Hard'
                            ? styles.recDiffHard
                            : styles.recDiffMedium,
                        ]}
                      >
                        <Text
                          style={[
                            styles.recDiffText,
                            recommendation.difficulty === 'Easy'
                              ? styles.recDiffTextEasy
                              : recommendation.difficulty === 'Hard'
                              ? styles.recDiffTextHard
                              : styles.recDiffTextMedium,
                          ]}
                        >
                          {recommendation.difficulty}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recTopicRow}>
                      <Text style={styles.recTopicHeading} numberOfLines={1}>
                        {recommendation.topicName}
                      </Text>
                      <Text style={styles.recCountPill}>
                        {recommendation.questionCount} Questions
                      </Text>
                    </View>

                    <Text style={styles.recQuoteBubble}>"{recommendation.reason}"</Text>

                    <TouchableOpacity
                      style={styles.recActionLaunchBtn}
                      onPress={() =>
                        navigation.navigate('Practice', {
                          subjectId: recommendation.subjectId,
                          topicId: recommendation.topicId,
                          topicName: recommendation.topicName,
                          difficulty: recommendation.difficulty,
                          questionCount: recommendation.questionCount,
                        })
                      }
                      activeOpacity={0.88}
                    >
                      <Text style={styles.recActionLaunchBtnText}>Practice Recommended Set</Text>
                      <Text style={styles.recActionLaunchBtnArrow}>➔</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* ONBOARDING STATE FOR NEW ASPIRANTS */
              <View style={styles.newProfileCard}>
                <View style={styles.newProfileTopRow}>
                  <View style={styles.newProfileBadge}>
                    <Text style={styles.newProfileBadgeText}>🚀 PERFORMANCE PROFILE</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Performance')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.newProfileLink}>Preview ➔</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.newProfileTitle}>Build Your Weak Topic Radar</Text>
                <Text style={styles.newProfileDesc}>
                  Answer 5 practice questions to activate automatic weak topic detection, difficulty calibration, and personalized study drills.
                </Text>

                {/* Progress Step Bar */}
                <View style={styles.newProfileTracker}>
                  <View style={styles.trackerDotsRow}>
                    {[1, 2, 3, 4, 5].map((step) => {
                      const isDone = (perfData?.totalAttempted || 0) >= step;
                      return (
                        <View
                          key={step}
                          style={[
                            styles.trackerDot,
                            isDone && styles.trackerDotActive,
                          ]}
                        >
                          {isDone ? (
                            <Text style={styles.trackerDotCheck}>✓</Text>
                          ) : (
                            <Text style={styles.trackerDotNum}>{step}</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <Text style={styles.trackerSummaryText}>
                    {perfData?.totalAttempted || 0}/5 solved •{' '}
                    {Math.max(0, 5 - (perfData?.totalAttempted || 0))} questions remaining to unlock!
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.startQuickDrillBtn}
                  onPress={() => {
                    const starterSub = subjects[0];
                    if (starterSub) {
                      navigation.navigate('Topics', {
                        subjectId: starterSub._id,
                        subjectName: starterSub.name,
                      });
                    } else {
                      navigation.navigate('Performance');
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.startQuickDrillBtnText}>Start 5-Question Starter Drill</Text>
                  <Text style={styles.startQuickDrillBtnArrow}>➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ======================================================== */}
            {/* 🔥 TODAY'S REVISION CARD                                  */}
            {/* ======================================================== */}
            {revisionSummary && revisionSummary.dueCount > 0 ? (
              <View style={styles.revisionCard}>
                <View style={styles.revisionCardTop}>
                  <View style={styles.revisionBadge}>
                    <Text style={styles.revisionBadgeText}>🔥 TODAY'S REVISION</Text>
                  </View>
                  <View style={styles.revisionCountPill}>
                    <Text style={styles.revisionCountPillText}>
                      {revisionSummary.dueCount} Ready
                    </Text>
                  </View>
                </View>

                <Text style={styles.revisionTitle}>Strengthen Your Weak Points</Text>
                <Text style={styles.revisionSubtitle}>
                  {revisionSummary.criticalCount > 0
                    ? `${revisionSummary.criticalCount} Critical • ${Math.max(
                        0,
                        revisionSummary.dueCount - revisionSummary.criticalCount
                      )} Scheduled • Across ${revisionSummary.topicCount} topic${
                        revisionSummary.topicCount === 1 ? '' : 's'
                      }`
                    : `${revisionSummary.dueCount} questions due for spaced repetition review`}
                </Text>

                <TouchableOpacity
                  style={styles.revisionCtaBtn}
                  onPress={() => navigation.navigate('Revision')}
                  activeOpacity={0.88}
                >
                  <Text style={styles.revisionCtaBtnText}>
                    Start Revision ({revisionSummary.dueCount})
                  </Text>
                  <Text style={styles.revisionCtaBtnArrow}>➔</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.revisionCaughtUpCard}
                onPress={() => navigation.navigate('Revision')}
                activeOpacity={0.85}
              >
                <View style={styles.revisionCaughtUpIconBox}>
                  <Text style={styles.revisionCaughtUpIcon}>✓</Text>
                </View>
                <View style={styles.revisionCaughtUpTextWrap}>
                  <Text style={styles.revisionCaughtUpTitle}>You're caught up!</Text>
                  <Text style={styles.revisionCaughtUpSubtitle}>
                    No revision due today. Keep practicing to build retention!
                  </Text>
                </View>
                <Text style={styles.revisionCaughtUpArrow}>➔</Text>
              </TouchableOpacity>
            )}

            {/* METRICS / STATS RIBBON */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>5-25 Qs</Text>
                <Text style={styles.statLabel}>Custom Sets</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>Instant</Text>
                <Text style={styles.statLabel}>Explanations</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>4 Pillars</Text>
                <Text style={styles.statLabel}>Full Syllabus</Text>
              </View>
            </View>

            {/* SECTION HEADER: TOPIC DRILLS */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Chapter & Topic Drills</Text>
                <Text style={styles.sectionSubtitle}>
                  Select a module to practice topic-wise questions
                </Text>
              </View>
              <View style={styles.subjectCountBadge}>
                <Text style={styles.subjectCountText}>
                  {subjects.length} Available
                </Text>
              </View>
            </View>

            {/* SUBJECT CARDS */}
            <View style={styles.cardsList}>
              {subjects.map((subject, index) => {
                const meta = SUBJECT_METAS[subject.slug] || DEFAULT_META;
                return (
                  <TouchableOpacity
                    key={subject._id}
                    style={[styles.subjectCard, { borderLeftColor: meta.color }]}
                    onPress={() => handleSelectSubject(subject)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.subjectTopRow}>
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: meta.bgLight },
                        ]}
                      >
                        <Text style={styles.subjectEmoji}>{meta.icon}</Text>
                      </View>
                      <View style={styles.subjectMetaBadge}>
                        <Text
                          style={[styles.subjectMetaBadgeText, { color: meta.color }]}
                        >
                          {meta.badge}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <Text style={styles.subjectTagline}>{meta.tagline}</Text>

                    <View style={styles.subjectCardFooter}>
                      <View style={styles.pillarChip}>
                        <Text style={styles.pillarChipText}>Module 0{index + 1}</Text>
                      </View>
                      <View style={styles.exploreAction}>
                        <Text style={[styles.exploreText, { color: meta.color }]}>
                          Select Topics
                        </Text>
                        <Text style={[styles.exploreArrow, { color: meta.color }]}>
                          ›
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: DEDICATED MARKED QUESTIONS TAB                   */}
        {/* ======================================================== */}
        {activeTab === 'MARKED' && (
          <View style={styles.markedDedicatedContainer}>
            <View style={styles.markedHeaderBanner}>
              <Text style={styles.markedHeaderTitle}>🔖 Marked Questions Notebook</Text>
              <Text style={styles.markedHeaderDesc}>
                {markedCount > 0
                  ? `You have ${markedCount} question${markedCount === 1 ? '' : 's'} marked for revision. Study the detailed derivations below.`
                  : 'Zero marked questions currently on record.'}
              </Text>
            </View>

            {markedCount > 0 ? (
              <View style={styles.cardsList}>
                {markedQuestionsList.map((q, idx) => {
                  const meta = SUBJECT_METAS[q.subjectSlug] || DEFAULT_META;
                  return (
                    <View key={q.questionId || idx} style={styles.markedDedicatedCard}>
                      {/* Top Header Row with Question Number, Subject, and Status */}
                      <View style={styles.markedCardTop}>
                        <View style={styles.questionNumBadge}>
                          <Text style={styles.questionNumBadgeText}>
                            Q{idx + 1}
                          </Text>
                        </View>

                        <View style={[styles.markedSubjectChip, { backgroundColor: meta.bgLight }]}>
                          <Text style={[styles.markedSubjectChipText, { color: meta.color }]}>
                            {meta.icon} {q.subjectSlug.toUpperCase()}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.markedStatusChip,
                            q.isCorrect
                              ? styles.statusCorrect
                              : q.userSelectedAnswer !== null
                              ? styles.statusWrong
                              : styles.statusUnanswered,
                          ]}
                        >
                          <Text
                            style={[
                              styles.markedStatusChipText,
                              q.isCorrect
                                ? styles.statusCorrectText
                                : q.userSelectedAnswer !== null
                                ? styles.statusWrongText
                                : styles.statusUnansweredText,
                            ]}
                          >
                            {q.isCorrect
                              ? '✓ Correct'
                              : q.userSelectedAnswer !== null
                              ? '✗ Wrong'
                              : '⚪ Unanswered'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.unmarkCardBtn}
                          onPress={() => handleUnmarkQuestion(q.questionId)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.unmarkCardBtnText}>✕ Unmark</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Question Stem */}
                      <Text style={styles.markedDedicatedQuestionStem}>
                        {q.questionText}
                      </Text>

                      {/* User Choice vs Correct Answer */}
                      <View style={styles.markedAnswerSummaryRow}>
                        <Text style={styles.markedAnswerSummaryLabel}>
                          Your Choice: <Text style={styles.markedAnswerChoice}>{q.userSelectedAnswer || 'None'}</Text>
                        </Text>
                        <Text style={styles.markedAnswerSummaryLabel}>
                          Correct: <Text style={styles.markedAnswerCorrectChoice}>{q.correctAnswer}</Text>
                        </Text>
                      </View>

                      {/* Trigger to View Full Explanation */}
                      <TouchableOpacity
                        style={styles.solutionFullTrigger}
                        onPress={() => setSelectedMarkedQuestion({ question: q, index: idx })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.solutionFullTriggerText}>
                          💡 View Complete Solution & Explanation
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {markedData?.sessionId && (
                  <TouchableOpacity
                    style={styles.fullReviewHeroCta}
                    onPress={() =>
                      navigation.navigate('MockReview', {
                        sessionId: markedData.sessionId,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={styles.fullReviewHeroCtaText}>
                      Open Full 100-Question Post-Exam Review ➔
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyMarkedCard}>
                <Text style={styles.emptyMarkedIcon}>🔖</Text>
                <Text style={styles.emptyMarkedTitle}>No Marked Questions Found</Text>
                <Text style={styles.emptyMarkedDesc}>
                  Bookmark difficult questions while taking Mock Tests. They will appear here with question numbers for quick revision before your exam.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigation.navigate('MockInstructions')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyActionBtnText}>Launch SSC CGL Mock Test ➔</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* PRO TIP / STRATEGY CARD */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrapper}>
            <Text style={styles.tipIcon}>💡</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Exam Strategy Insight</Text>
            <Text style={styles.tipText}>
              In SSC CGL Tier-1, you get 60 minutes for 100 questions. Starting with 5 or 10-question sprint tests builds high speed and error-free execution.
            </Text>
          </View>
        </View>

        {/* CONNECTION FOOTER */}
        <View style={styles.connectionFooter}>
          <View style={styles.statusDot} />
          <Text style={styles.connectionFooterText}>
            Backend Live • Question Bank Active
          </Text>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* SOLUTION PREVIEW MODAL FOR MARKED QUESTIONS              */}
      {/* ======================================================== */}
      {selectedMarkedQuestion && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedMarkedQuestion(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  💡 Question #{selectedMarkedQuestion.index + 1} Solution
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedMarkedQuestion(null)}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <Text style={styles.modalQuestionText}>
                  {selectedMarkedQuestion.question.questionText}
                </Text>

                {/* 4 Options Preview */}
                <View style={styles.modalOptionsContainer}>
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const optKey = `option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                    const optText = selectedMarkedQuestion.question[optKey];
                    const isCorrect = selectedMarkedQuestion.question.correctAnswer === opt;
                    const isUserPick = selectedMarkedQuestion.question.userSelectedAnswer === opt;

                    return (
                      <View
                        key={opt}
                        style={[
                          styles.modalOptionBox,
                          isCorrect && styles.modalOptionCorrect,
                          !isCorrect && isUserPick && styles.modalOptionWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalOptionLetter,
                            isCorrect && styles.modalOptionTextCorrect,
                            !isCorrect && isUserPick && styles.modalOptionTextWrong,
                          ]}
                        >
                          ({opt}) {optText}
                        </Text>
                        {isCorrect && (
                          <Text style={styles.correctPillTag}>✓ Correct Answer</Text>
                        )}
                        {!isCorrect && isUserPick && (
                          <Text style={styles.wrongPillTag}>✗ Your Choice</Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Step-by-Step Explanation */}
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationBoxTitle}>📖 Detailed Derivation & Logic:</Text>
                  <Text style={styles.explanationBoxText}>
                    {selectedMarkedQuestion.question.explanation}
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setSelectedMarkedQuestion(null)}
              >
                <Text style={styles.modalDoneBtnText}>Got it, Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 60,
  },
  errorContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },

  /* TOP SEGMENTED TAB SWITCHER */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  tabBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },

  /* FULL MOCK TEST HERO CARD */
  mockHeroCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#4338ca',
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  mockBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mockOfficialBadge: {
    backgroundColor: '#312e81',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  mockOfficialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#a5b4fc',
    letterSpacing: 0.5,
  },
  mockTimerBadge: {
    backgroundColor: '#3730a3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mockTimerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fde047',
  },
  mockHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  mockHeroDesc: {
    fontSize: 12,
    color: '#c7d2fe',
    lineHeight: 18,
    marginBottom: 14,
  },
  mockSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mockSpecItem: {
    alignItems: 'center',
  },
  mockSpecNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  mockSpecLabel: {
    fontSize: 10,
    color: '#a5b4fc',
    fontWeight: '600',
    marginTop: 2,
  },
  mockSpecDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mockCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  mockCtaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  mockCtaArrow: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '800',
  },

  /* ⚡ REDESIGNED PERFORMANCE & RECOMMENDATIONS HERO COCKPIT */
  perfHeroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  perfHeroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  perfPulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  pulseLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  perfPulseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.8,
  },
  perfAnalyticsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  perfAnalyticsLinkText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  perfAnalyticsLinkArrow: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  perfHeroMainRow: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  perfAccuracyBox: {
    marginBottom: 10,
  },
  accuracyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perfAccuracyValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  perfMasteryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillMasteryHigh: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  pillMasteryMid: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  pillMasteryLow: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  perfMasteryPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textMasteryHigh: {
    color: '#34d399',
  },
  textMasteryMid: {
    color: '#fbbf24',
  },
  textMasteryLow: {
    color: '#f87171',
  },
  perfAccuracyLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  perfProgressTrackWrapper: {
    marginTop: 4,
  },
  perfProgressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  perfProgressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  perfProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  perfProgressMin: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  perfProgressTarget: {
    fontSize: 9,
    color: '#38bdf8',
    fontWeight: '700',
  },
  perfProgressMax: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },

  /* 3 Metric Pills */
  perfMetricTilesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  perfMetricTile: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  perfMetricTileCorrect: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(6, 78, 59, 0.25)',
  },
  perfMetricTileWrong: {
    borderColor: 'rgba(244, 63, 94, 0.25)',
    backgroundColor: 'rgba(136, 19, 55, 0.2)',
  },
  perfMetricTileIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  perfMetricTileNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  perfMetricTileLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },

  /* FOCUS AREAS */
  focusSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  focusSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  focusSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#f87171',
    letterSpacing: 0.8,
  },
  focusSectionSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  focusCardsList: {
    gap: 8,
  },
  focusTopicCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  focusTopicInfo: {
    flex: 1,
    marginRight: 8,
  },
  focusTopicTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  focusTopicSubject: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  focusBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  focusTagCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  focusTagWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  focusTagPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  focusTagCriticalText: {
    color: '#f87171',
  },
  focusTagWarningText: {
    color: '#fbbf24',
  },
  focusDrillArrow: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
  },

  /* RECOMMENDED PRACTICE CARD */
  recSectionCard: {
    backgroundColor: 'rgba(30, 27, 75, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#4338ca',
    shadowColor: '#4338ca',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recBadgeIcon: {
    fontSize: 13,
  },
  recBadgeTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  recDiffPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recDiffEasy: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  recDiffMedium: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  recDiffHard: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  recDiffText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recDiffTextEasy: {
    color: '#34d399',
  },
  recDiffTextMedium: {
    color: '#60a5fa',
  },
  recDiffTextHard: {
    color: '#c084fc',
  },
  recTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recTopicHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  recCountPill: {
    fontSize: 11,
    color: '#c7d2fe',
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recQuoteBubble: {
    fontSize: 12,
    color: '#e0e7ff',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 8,
  },
  recActionLaunchBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  recActionLaunchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  recActionLaunchBtnArrow: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* NEW STUDENT ONBOARDING CARD */
  newProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  newProfileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  newProfileBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  newProfileBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4f46e5',
    letterSpacing: 0.6,
  },
  newProfileLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
  },
  newProfileTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  newProfileDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  newProfileTracker: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  trackerDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trackerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerDotActive: {
    backgroundColor: '#10b981',
  },
  trackerDotCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  trackerDotNum: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  trackerSummaryText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
  },
  startQuickDrillBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startQuickDrillBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  startQuickDrillBtnArrow: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* SECTION HEADER */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  subjectCountBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  /* DEDICATED MARKED TAB */
  markedDedicatedContainer: {
    marginBottom: 20,
  },
  markedHeaderBanner: {
    backgroundColor: '#312e81',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  markedHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  markedHeaderDesc: {
    fontSize: 12,
    color: '#c7d2fe',
    lineHeight: 17,
  },
  markedDedicatedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  markedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  questionNumBadge: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questionNumBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  markedSubjectChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  markedSubjectChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  markedStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  markedStatusChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusCorrect: {
    backgroundColor: '#ecfdf5',
  },
  statusCorrectText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  statusWrong: {
    backgroundColor: '#fef2f2',
  },
  statusWrongText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '700',
  },
  statusUnanswered: {
    backgroundColor: '#f8fafc',
  },
  statusUnansweredText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  unmarkCardBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  unmarkCardBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
  },
  markedDedicatedQuestionStem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 12,
  },
  markedAnswerSummaryRow: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  markedAnswerSummaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  markedAnswerChoice: {
    color: '#0f172a',
    fontWeight: '800',
  },
  markedAnswerCorrectChoice: {
    color: '#059669',
    fontWeight: '800',
  },
  solutionFullTrigger: {
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  solutionFullTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  fullReviewHeroCta: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  fullReviewHeroCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* EMPTY STATE FOR MARKED */
  emptyMarkedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyMarkedIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyMarkedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptyMarkedDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  /* METRICS ROW */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },

  /* CARDS LIST */
  cardsList: {
    gap: 12,
    marginBottom: 20,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  subjectTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectEmoji: {
    fontSize: 20,
  },
  subjectMetaBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },
  subjectMetaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  subjectTagline: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 12,
  },
  subjectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  pillarChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillarChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  exploreAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  exploreArrow: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  /* TIP CARD */
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fefce8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef08a',
    marginBottom: 20,
    alignItems: 'center',
  },
  tipIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fef9c3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854d0e',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 11,
    color: '#a16207',
    lineHeight: 16,
  },

  /* CONNECTION FOOTER */
  connectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  connectionFooterText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  /* SOLUTION PREVIEW MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  modalScroll: {
    marginBottom: 16,
  },
  modalQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalOptionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  modalOptionBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOptionCorrect: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  modalOptionWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1.5,
  },
  modalOptionLetter: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  modalOptionTextCorrect: {
    color: '#065f46',
    fontWeight: '700',
  },
  modalOptionTextWrong: {
    color: '#991b1b',
    fontWeight: '700',
  },
  correctPillTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    marginLeft: 6,
  },
  wrongPillTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    marginLeft: 6,
  },
  explanationBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  explanationBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 6,
  },
  explanationBoxText: {
    fontSize: 13,
    color: '#0c4a6e',
    lineHeight: 19,
  },
  modalDoneBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Today's Revision Card Styles
  revisionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#ea580c',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  revisionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  revisionBadge: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  revisionBadgeText: {
    color: '#ea580c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  revisionCountPill: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  revisionCountPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  revisionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  revisionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 14,
  },
  revisionCtaBtn: {
    backgroundColor: '#ea580c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  revisionCtaBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  revisionCtaBtnArrow: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  revisionCaughtUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 20,
    gap: 12,
  },
  revisionCaughtUpIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revisionCaughtUpIcon: {
    color: '#16a34a',
    fontSize: 18,
    fontWeight: '800',
  },
  revisionCaughtUpTextWrap: {
    flex: 1,
  },
  revisionCaughtUpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  revisionCaughtUpSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  revisionCaughtUpArrow: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '700',
  },
  // Today's Study Plan Hero Styles
  planHeroCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#4338ca',
    shadowColor: '#312e81',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  planHeroCardCompleted: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    shadowColor: '#064e3b',
  },
  planBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planReadyBadge: {
    backgroundColor: '#3730a3',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  planReadyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c7d2fe',
    letterSpacing: 0.5,
  },
  planProgressBadge: {
    backgroundColor: '#854d0e',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  planProgressBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fef08a',
    letterSpacing: 0.5,
  },
  planCompleteBadge: {
    backgroundColor: '#065f46',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  planCompleteBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  planMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a5b4fc',
  },
  planStreakActiveBadge: {
    backgroundColor: '#3730a3',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  planStreakActiveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  planStreakCompletedBadge: {
    backgroundColor: '#065f46',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  planStreakCompletedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  planRemainingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fef08a',
  },
  planHeroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a5b4fc',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  planHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  planHeroDesc: {
    fontSize: 13,
    color: '#c7d2fe',
    lineHeight: 18,
    marginBottom: 12,
  },
  planProgressTrack: {
    height: 8,
    backgroundColor: '#312e81',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  planProgressFill: {
    height: '100%',
    backgroundColor: '#818cf8',
    borderRadius: 4,
  },
  planChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  planMiniChip: {
    backgroundColor: '#312e81',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  planMiniChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e0e7ff',
  },
  planPreviewChip: {
    backgroundColor: '#312e81',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  planPreviewChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c7d2fe',
  },
  planCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  planCtaButtonCompleted: {
    backgroundColor: '#10b981',
  },
  planCtaButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  planCtaArrow: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '800',
  },
});
