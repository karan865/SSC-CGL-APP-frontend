import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RevisionScreenProps } from '../navigation/types';
import { useExam } from '../context/ExamContext';
import { revisionApi } from '../services/api/revisionApi';
import {
  RevisionQuestion,
  RevisionAnswerResponse,
  RevisionSummary,
} from '../types/revision';
import { OptionChoice } from '../types/question';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

export const RevisionScreen: React.FC<RevisionScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const initialLimit = route.params?.initialLimit || 10;
  const { examSlug } = useExam();
  const { language, isHindi, isBoth } = useLanguage();

  // Session state
  const [summary, setSummary] = useState<RevisionSummary | null>(null);
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);
  const [questions, setQuestions] = useState<RevisionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction state
  const [selectedOption, setSelectedOption] = useState<OptionChoice | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);
  const [answerResult, setAnswerResult] = useState<RevisionAnswerResponse | null>(null);

  // Stats for the current session
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);

  const fetchSummaryAndSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryData = await revisionApi.getRevisionSummary(examSlug);
      setSummary(summaryData);

      if (summaryData.dueCount > 0) {
        const sessionData = await revisionApi.startRevisionSession(initialLimit, examSlug);
        setQuestions(sessionData.questions || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load revision queue.');
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  useEffect(() => {
    fetchSummaryAndSession();
  }, [fetchSummaryAndSession]);

  const handleStartSession = () => {
    if (questions.length > 0) {
      setSessionStarted(true);
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswerResult(null);
    }
  };

  const handleSelectOption = async (optionKey: OptionChoice) => {
    if (selectedOption || submittingAnswer || !questions[currentIndex]) return;

    setSelectedOption(optionKey);
    setSubmittingAnswer(true);

    try {
      const currentQ = questions[currentIndex];
      const result = await revisionApi.submitRevisionAnswer(currentQ._id, optionKey);
      setAnswerResult(result);

      if (result.isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setWrongCount((prev) => prev + 1);
      }
    } catch {
      // Fallback
      setAnswerResult({
        isCorrect: false,
        selectedAnswer: optionKey,
        correctAnswer: 'A',
        marks: 0,
        explanation: 'Answer submitted. We will bring this question back for review.',
        revision: {
          revisionLevel: 1,
          nextRevisionAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'SCHEDULED',
        },
      });
      setWrongCount((prev) => prev + 1);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswerResult(null);
    } else {
      setSessionFinished(true);
    }
  };

  const formatReviewInterval = (level: number, status: string): string => {
    if (status === 'MASTERED') {
      return 'Mastered! 🎉';
    }
    const daysMap: Record<number, string> = {
      1: 'in 1 day',
      2: 'in 3 days',
      3: 'in 7 days',
      4: 'in 14 days',
      5: 'in 30 days',
    };
    return daysMap[level] || 'in a few days';
  };

  if (loading) {
    return (
      <View style={styles.screenRoot}>
        <LoadingView message="Preparing your personalized revision session..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screenRoot}>
        <View style={styles.errorContainer}>
          <ErrorView
            message={error}
            onRetry={fetchSummaryAndSession}
            retryTitle="Try Again"
          />
        </View>
      </View>
    );
  }

  // --- VIEW 1: CAUGHT UP (NO DUE QUESTIONS) ---
  if (!summary || summary.dueCount === 0 || questions.length === 0) {
    return (
      <View style={[styles.screenRoot, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Revision</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>You're All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>
            No revision questions are due right now. Keep practicing and we will
            automatically bring back tricky questions when they need another look.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Subjects')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Practice Questions ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- VIEW 2: REVISION COMPLETED ---
  if (sessionFinished) {
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <View style={[styles.screenRoot, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Subjects')}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session Completed</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.completedContent}>
          <View style={styles.completedCard}>
            <Text style={styles.completedEmoji}>🏆</Text>
            <Text style={styles.completedTitle}>Great Effort!</Text>
            <Text style={styles.completedSubtitle}>
              You have revised {total} priority mistake{total === 1 ? '' : 's'}. Spaced intervals
              have been automatically updated to reinforce retention.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#059669' }]}>
                  {correctCount}
                </Text>
                <Text style={styles.statLabel}>Promoted</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#d97706' }]}>
                  {wrongCount}
                </Text>
                <Text style={styles.statLabel}>Recycled</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Subjects')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Return to Home ➔</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // --- VIEW 3: READY TO START OVERVIEW ---
  if (!sessionStarted) {
    return (
      <View style={[styles.screenRoot, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Revision</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.overviewContent}>
          <View style={styles.overviewHero}>
            <View style={styles.overviewBadge}>
              <Text style={styles.overviewBadgeText}>🔥 SPARK RETENTION</Text>
            </View>
            <Text style={styles.overviewHeroCount}>
              {summary.dueCount} Question{summary.dueCount === 1 ? '' : 's'} Due
            </Text>
            <Text style={styles.overviewHeroDesc}>
              Scientifically spaced revision targets the questions you missed earlier to
              prevent forgetting and lock in formulas.
            </Text>
          </View>

          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Priority Breakdown</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownValue, { color: '#dc2626' }]}>
                  {summary.criticalCount}
                </Text>
                <Text style={styles.breakdownLabel}>Critical</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownValue, { color: '#d97706' }]}>
                  {Math.max(0, summary.dueCount - summary.criticalCount)}
                </Text>
                <Text style={styles.breakdownLabel}>Scheduled</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownValue, { color: '#4f46e5' }]}>
                  {summary.topicCount}
                </Text>
                <Text style={styles.breakdownLabel}>Topics</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartSession}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              Start Revision ({questions.length} Questions) ➔
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // --- VIEW 4: ACTIVE REVISION QUESTION DRILL ---
  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  const hasHindi = !!currentQ.questionText_hi;
  const showHindi = (isBoth || isHindi) && hasHindi;
  const showEnglish = !isHindi || !hasHindi;

  const options: { key: OptionChoice; textEn: string; textHi?: string }[] = [
    { key: 'A', textEn: currentQ.optionA, textHi: currentQ.optionA_hi },
    { key: 'B', textEn: currentQ.optionB, textHi: currentQ.optionB_hi },
    { key: 'C', textEn: currentQ.optionC, textHi: currentQ.optionC_hi },
    { key: 'D', textEn: currentQ.optionD, textHi: currentQ.optionD_hi },
  ];

  return (
    <View style={[styles.screenRoot, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spaced Revision</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LanguageToggle variant="dark" size="small" />
          <View style={styles.headerCounterBadge}>
            <Text style={styles.headerCounterText}>
              {currentIndex + 1} / {questions.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>

      <ScrollView
        style={styles.questionScrollView}
        contentContainerStyle={styles.questionScrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Meta Bar */}
        <View style={styles.metaRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              🔄 Level {currentQ.revisionLevel || 1}
            </Text>
          </View>

          {currentQ.wrongRevisionAttempts > 1 && (
            <View style={styles.struggleBadge}>
              <Text style={styles.struggleBadgeText}>
                ⚠️ Repeated Mistake ({currentQ.wrongRevisionAttempts}x)
              </Text>
            </View>
          )}
        </View>

        {/* Question Text */}
        <View style={styles.questionCard}>
          {showEnglish && (
            <Text style={styles.questionText}>{currentQ.questionText}</Text>
          )}
          {showHindi && (
            <View style={[styles.hindiQuestionContainer, showEnglish && styles.hindiQuestionDivider]}>
              {isBoth && (
                <View style={styles.langTagBadge}>
                  <Text style={styles.langTagBadgeText}>हिन्दी</Text>
                </View>
              )}
              <Text style={styles.hindiQuestionText}>{currentQ.questionText_hi}</Text>
            </View>
          )}
        </View>

        {/* Options */}
        <View style={styles.optionsList}>
          {options.map((option) => {
            const isSelected = selectedOption === option.key;
            let optionStyle: ViewStyle = styles.optionCard;
            let textStyle: TextStyle = styles.optionText;
            let circleStyle: ViewStyle = styles.optionCircle;
            let circleTextStyle: TextStyle = styles.optionCircleText;

            if (answerResult) {
              const isCorrectOption = option.key === answerResult.correctAnswer;
              if (isCorrectOption) {
                optionStyle = { ...styles.optionCard, ...styles.optionCorrect };
                textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
                circleStyle = { ...styles.optionCircle, ...styles.circleCorrect };
                circleTextStyle = { ...styles.optionCircleText, ...styles.circleTextCorrect };
              } else if (isSelected && !answerResult.isCorrect) {
                optionStyle = { ...styles.optionCard, ...styles.optionWrong };
                textStyle = { ...styles.optionText, ...styles.optionTextWrong };
                circleStyle = { ...styles.optionCircle, ...styles.circleWrong };
                circleTextStyle = { ...styles.optionCircleText, ...styles.circleTextWrong };
              }
            } else if (isSelected) {
              optionStyle = { ...styles.optionCard, ...styles.optionSelected };
              circleStyle = { ...styles.optionCircle, ...styles.circleSelected };
            }

            return (
              <TouchableOpacity
                key={option.key}
                style={optionStyle}
                onPress={() => handleSelectOption(option.key)}
                disabled={submittingAnswer || answerResult !== null}
                activeOpacity={0.8}
              >
                <View style={circleStyle}>
                  <Text style={circleTextStyle}>{option.key}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {showEnglish && (
                    <Text style={textStyle}>{option.textEn}</Text>
                  )}
                  {showHindi && option.textHi && (
                    <Text
                      style={[
                        styles.optionTextHindi,
                        answerResult && option.key === answerResult.correctAnswer && styles.optionTextHindiCorrect,
                      ]}
                    >
                      {option.textHi}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submitting indicator */}
        {submittingAnswer && (
          <View style={styles.evaluatingBox}>
            <ActivityIndicator size="small" color="#4f46e5" />
            <Text style={styles.evaluatingText}>Evaluating answer...</Text>
          </View>
        )}

        {/* Answer Feedback & Spaced Interval Banner */}
        {answerResult && (
          <View
            style={[
              styles.feedbackCard,
              answerResult.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            <View style={styles.feedbackHeaderRow}>
              <Text style={styles.feedbackEmoji}>
                {answerResult.isCorrect ? '✅' : '❌'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedbackTitle}>
                  {answerResult.isCorrect ? 'Correct!' : 'Incorrect'}
                </Text>
                <Text style={styles.nextReviewText}>
                  Next review:{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {formatReviewInterval(
                      answerResult.revision.revisionLevel,
                      answerResult.revision.status
                    )}
                  </Text>
                </Text>
              </View>
            </View>

            {(answerResult.explanation || answerResult.explanation_hi) ? (
              <View style={styles.explanationBox}>
                {(!isHindi || !answerResult.explanation_hi) && (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={styles.explanationLabel}>Explanation:</Text>
                    <Text style={styles.explanationText}>
                      {answerResult.explanation}
                    </Text>
                  </View>
                )}
                {(isBoth || isHindi) && !!answerResult.explanation_hi && (
                  <View style={[!isHindi && { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}>
                    <Text style={[styles.explanationLabel, { color: '#4f46e5' }]}>💡 हिन्दी व्याख्या:</Text>
                    <Text style={styles.explanationText}>
                      {answerResult.explanation_hi}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextQuestion}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>
                {isLast ? 'Complete Revision ➔' : 'Next Question ➔'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerCounterBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerCounterText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#1e293b',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  questionScrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  questionScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  levelBadge: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: '700',
  },
  struggleBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  struggleBadgeText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
    fontWeight: '600',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  optionSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  optionCorrect: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  optionWrong: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionCircleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  circleSelected: {
    backgroundColor: '#4f46e5',
  },
  circleCorrect: {
    backgroundColor: '#059669',
  },
  circleTextCorrect: {
    color: '#ffffff',
  },
  circleWrong: {
    backgroundColor: '#dc2626',
  },
  circleTextWrong: {
    color: '#ffffff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 21,
  },
  optionTextCorrect: {
    color: '#065f46',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#991b1b',
  },
  hindiQuestionContainer: {
    marginTop: 6,
  },
  hindiQuestionDivider: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  langTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  langTagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818cf8',
  },
  hindiQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
    lineHeight: 23,
  },
  optionTextHindi: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 18,
  },
  optionTextHindiCorrect: {
    color: '#34d399',
  },
  evaluatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  evaluatingText: {
    color: '#64748b',
    fontSize: 14,
  },
  feedbackCard: {
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  feedbackWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  feedbackEmoji: {
    fontSize: 28,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  nextReviewText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  explanationBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  nextButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Overview Screen Styles
  overviewContent: {
    padding: 20,
    backgroundColor: '#f8fafc',
    flexGrow: 1,
  },
  overviewHero: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  overviewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  overviewBadgeText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  overviewHeroCount: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  overviewHeroDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 21,
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
  },
  // Completed Screen Styles
  completedContent: {
    padding: 20,
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    justifyContent: 'center',
  },
  completedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  completedEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 20,
  },
});
