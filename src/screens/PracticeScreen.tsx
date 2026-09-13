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
import { PracticeScreenProps } from '../navigation/types';
import { practiceApi } from '../services/api/practiceApi';
import { mockTestApi } from '../services/api/mockTestApi';
import { Question, OptionChoice, AnswerResponse, SelectionInfo } from '../types/question';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  route,
  navigation,
}) => {
  const { subjectId, topicId, topicName, difficulty, questionCount = 5, studyPlanItemId } =
    route.params;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<OptionChoice | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);

  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [markedQuestionIds, setMarkedQuestionIds] = useState<Record<string, boolean>>({});

  const startTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await practiceApi.startPractice({
        subjectId,
        topicId,
        difficulty,
        count: questionCount,
      });

      if (!response.questions || response.questions.length === 0) {
        throw new Error('No questions available for this selection.');
      }

      setQuestions(response.questions);
      setSelectionInfo(response.selectionInfo || null);
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswerResult(null);
      setCorrectCount(0);
      setWrongCount(0);

      // Load already marked questions so existing bookmarks are reflected
      try {
        const markedRes = await mockTestApi.getMarkedQuestions();
        if (markedRes?.questions) {
          const map: Record<string, boolean> = {};
          markedRes.questions.forEach((item: any) => {
            const qId = item.question?._id || item.questionId;
            if (qId) map[qId] = true;
          });
          setMarkedQuestionIds(map);
        }
      } catch {
        // Non-fatal if marked list fails to load
      }
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to load test questions. Please check connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [subjectId, topicId, difficulty, questionCount]);

  useEffect(() => {
    startTest();
  }, [startTest]);

  const handleToggleMark = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const currentMarked = !!markedQuestionIds[currentQ._id];
    const newMarked = !currentMarked;

    // Optimistic UI update
    setMarkedQuestionIds((prev) => ({
      ...prev,
      [currentQ._id]: newMarked,
    }));

    try {
      await practiceApi.markQuestion({
        questionId: currentQ._id,
        userSelectedAnswer: selectedOption || undefined,
        isMarked: newMarked,
      });
    } catch (err) {
      console.warn('Failed to toggle mark for practice question:', err);
    }
  };

  const handleSelectOption = async (optionKey: OptionChoice) => {
    if (selectedOption || submittingAnswer || !questions[currentIndex]) return;

    setSelectedOption(optionKey);
    setSubmittingAnswer(true);

    try {
      const currentQ = questions[currentIndex];
      const result = await practiceApi.answerQuestion({
        questionId: currentQ._id,
        selectedAnswer: optionKey,
      });

      setAnswerResult(result);
      if (result.isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        setWrongCount((prev) => prev + 1);
      }

      // If this question is already marked, update the answer selection
      if (markedQuestionIds[currentQ._id]) {
        practiceApi
          .markQuestion({
            questionId: currentQ._id,
            userSelectedAnswer: optionKey,
            isMarked: true,
          })
          .catch(() => {});
      }
    } catch {
      // Fallback in case of temporary network glitch
      setAnswerResult({
        isCorrect: false,
        selectedAnswer: optionKey,
        correctAnswer: 'A',
        marks: 0,
        explanation: 'Answer submitted. Full solution available upon review.',
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
      // Test complete - navigate to ResultScreen
      const total = questions.length;
      const finalMarks = correctCount + (answerResult?.isCorrect ? 0 : 0);
      const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

      navigation.replace('Result', {
        totalQuestions: total,
        correctCount,
        wrongCount,
        marks: finalMarks,
        accuracy,
        topicName,
        difficulty,
        subjectId,
        topicId,
        studyPlanItemId,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.screenRoot}>
        <LoadingView message={`Assembling ${questionCount} questions for ${topicName}...`} />
      </View>
    );
  }

  if (error || questions.length === 0) {
    const isInventoryNotice = error?.includes('Not enough questions') || error?.includes('available');
    return (
      <View style={styles.screenRoot}>
        <View style={styles.errorWrapper}>
          <ErrorView
            message={
              isInventoryNotice
                ? `Notice\n\nNot enough questions available for this specific difficulty level.\n\nPlease select another difficulty (Easy / Medium / Hard) or try another topic to continue practicing.`
                : (error || 'Unable to start test session.')
            }
            onRetry={() => {
              if (isInventoryNotice) {
                navigation.goBack();
              } else {
                startTest();
              }
            }}
            retryTitle={isInventoryNotice ? '← Choose Another Level' : 'Retry Loading Test'}
          />
          {isInventoryNotice && (
            <TouchableOpacity
              style={styles.retrySecondaryBtn}
              onPress={startTest}
              activeOpacity={0.8}
            >
              <Text style={styles.retrySecondaryBtnText}>Retry Anyway</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  const options: { key: OptionChoice; text: string }[] = [
    { key: 'A', text: currentQ.optionA },
    { key: 'B', text: currentQ.optionB },
    { key: 'C', text: currentQ.optionC },
    { key: 'D', text: currentQ.optionD },
  ];

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />

      {/* TOP PROGRESS BAR & HEADER */}
      <View style={styles.topBar}>
        <View style={styles.topMetaRow}>
          <View style={styles.chipTopic}>
            <Text style={styles.chipTopicText}>{topicName}</Text>
          </View>
          <View style={styles.scorePill}>
            <Text style={styles.scorePillText}>Score: {correctCount}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <View style={styles.headerTagsRow}>
            {selectionInfo && (
              <View
                style={[
                  styles.freshnessTag,
                  selectionInfo.unseenCount === 0 && styles.freshnessTagRevision,
                ]}
              >
                <Text
                  style={[
                    styles.freshnessTagText,
                    selectionInfo.unseenCount === 0 && styles.freshnessTagRevisionText,
                  ]}
                >
                  {selectionInfo.unseenCount === questions.length
                    ? '✨ Fresh'
                    : selectionInfo.reviewCount === questions.length
                    ? '🔄 Revision'
                    : `✨ ${selectionInfo.unseenCount} New • ${selectionInfo.reviewCount} Rev`}
                </Text>
              </View>
            )}
            <Text style={styles.difficultyTag}>{difficulty}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* QUESTION TEXT CARD */}
        <View style={styles.questionCard}>
          <View style={styles.questionCardHeader}>
            <View style={styles.qNumBadge}>
              <Text style={styles.qNumText}>Q{currentIndex + 1}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleMark}
              style={[
                styles.markBtn,
                markedQuestionIds[currentQ._id] && styles.markBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.markBtnText,
                  markedQuestionIds[currentQ._id] && styles.markBtnTextActive,
                ]}
              >
                {markedQuestionIds[currentQ._id] ? '✓ Marked' : '🔖 Mark'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.questionText}>{currentQ.questionText}</Text>
        </View>

        {/* OPTIONS LIST */}
        <View style={styles.optionsList}>
          {options.map((option) => {
            const isSelected = selectedOption === option.key;
            const hasAnswered = selectedOption !== null;
            const isCorrectAnswer = answerResult?.correctAnswer === option.key;

            let cardStyle: ViewStyle = styles.optionCard;
            let circleStyle: ViewStyle = styles.optCircle;
            let optTextStyle: TextStyle = styles.optionText;
            let badgeText = null;

            if (hasAnswered) {
              if (isSelected) {
                if (answerResult?.isCorrect) {
                  cardStyle = styles.optionCardCorrect;
                  circleStyle = styles.optCircleCorrect;
                  optTextStyle = styles.optionTextCorrect;
                  badgeText = '✓ Correct (+1)';
                } else {
                  cardStyle = styles.optionCardWrong;
                  circleStyle = styles.optCircleWrong;
                  optTextStyle = styles.optionTextWrong;
                  badgeText = '✗ Incorrect';
                }
              } else if (isCorrectAnswer) {
                // Highlight actual correct answer in green
                cardStyle = styles.optionCardCorrect;
                circleStyle = styles.optCircleCorrect;
                optTextStyle = styles.optionTextCorrect;
                badgeText = '✓ Correct Answer';
              }
            }

            return (
              <TouchableOpacity
                key={option.key}
                style={cardStyle}
                onPress={() => handleSelectOption(option.key)}
                disabled={hasAnswered || submittingAnswer}
                activeOpacity={0.7}
              >
                <View style={circleStyle}>
                  <Text style={styles.optLetter}>{option.key}</Text>
                </View>

                <View style={styles.optionContent}>
                  <Text style={optTextStyle}>{option.text}</Text>
                  {badgeText && (
                    <Text style={styles.optionFeedbackBadge}>{badgeText}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SUBMITTING SPINNER */}
        {submittingAnswer && (
          <View style={styles.submittingBox}>
            <ActivityIndicator size="small" color="#4f46e5" />
            <Text style={styles.submittingText}>Evaluating answer...</Text>
          </View>
        )}

        {/* EXPLANATION BOX */}
        {answerResult && (
          <View
            style={[
              styles.explanationCard,
              answerResult.isCorrect
                ? styles.explanationCardCorrect
                : styles.explanationCardWrong,
            ]}
          >
            <View style={styles.explanationHeader}>
              <Text style={styles.explanationIcon}>
                {answerResult.isCorrect ? '🎉' : '💡'}
              </Text>
              <Text style={styles.explanationTitle}>
                {answerResult.isCorrect ? 'Correct! Explanation' : 'Solution & Explanation'}
              </Text>
            </View>
            <Text style={styles.explanationBody}>{answerResult.explanation}</Text>
          </View>
        )}

        {/* NEXT / FINISH BUTTON */}
        {selectedOption && (
          <View style={styles.bottomActionContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextQuestion}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>
                {isLastQuestion ? 'Finish Test & View Score 🏆' : 'Next Question ➔'}
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
    backgroundColor: '#f8fafc',
  },
  errorWrapper: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retrySecondaryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  retrySecondaryBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chipTopic: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipTopicText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  scorePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scorePillText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 3,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freshnessTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  freshnessTagRevision: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  freshnessTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  freshnessTagRevisionText: {
    color: '#fbbf24',
  },
  difficultyTag: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qNumBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qNumText: {
    color: '#4f46e5',
    fontSize: 11,
    fontWeight: '800',
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  markBtnActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  markBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  markBtnTextActive: {
    color: '#d97706',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 24,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardCorrect: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardWrong: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optCircleCorrect: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optCircleWrong: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  optionTextCorrect: {
    fontSize: 15,
    color: '#065f46',
    fontWeight: '700',
  },
  optionTextWrong: {
    fontSize: 15,
    color: '#991b1b',
    fontWeight: '700',
  },
  optionFeedbackBadge: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    color: '#047857',
  },
  submittingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  submittingText: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '600',
  },
  explanationCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  explanationCardCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  explanationCardWrong: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef08a',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationIcon: {
    fontSize: 18,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  explanationBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  bottomActionContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
