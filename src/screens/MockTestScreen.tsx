import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  BackHandler,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockTestScreenProps } from '../navigation/types';
import {
  MockQuestion,
  MockOptionChoice,
  LocalAnswerState,
} from '../types/mockTest';
import { mockTestApi } from '../services/api/mockTestApi';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

export const MockTestScreen: React.FC<MockTestScreenProps> = ({ route, navigation }) => {
  const { initialData } = route.params;
  const { language, isHindi, isBoth } = useLanguage();

  const isContinuousExam =
    (initialData.totalDurationMinutes && initialData.totalDurationMinutes >= 120) ||
    initialData.sections.length > 4;

  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(
    initialData.currentSectionIndex || 0
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, LocalAnswerState>>({});
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);

  // Timestamp-based robust countdown timer
  const initialDurationSec = (initialData.totalDurationMinutes || (isContinuousExam ? 120 : 60)) * 60;
  const endTimeRef = useRef<number>(Date.now() + initialDurationSec * 1000);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    isContinuousExam ? initialDurationSec : 15 * 60
  );
  const timerRef = useRef<any>(null);

  // Group questions by section for sequential exams (SSC)
  const sectionQuestions: MockQuestion[][] = isContinuousExam
    ? [initialData.questions]
    : [
        initialData.questions.filter((q) => q.sectionIndex === 0),
        initialData.questions.filter((q) => q.sectionIndex === 1),
        initialData.questions.filter((q) => q.sectionIndex === 2),
        initialData.questions.filter((q) => q.sectionIndex === 3),
      ];

  const activeQuestions: MockQuestion[] = isContinuousExam
    ? initialData.questions
    : sectionQuestions[currentSectionIndex] || [];
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const currentSection = initialData.sections[isContinuousExam ? (currentQuestion?.sectionIndex || 0) : currentSectionIndex];

  // Android hardware back button handler
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Leave Mock Test?',
        'Your test is in progress. If you leave now, your current session will be terminated.',
        [
          { text: 'Resume Test', style: 'cancel' },
          {
            text: 'Leave Test',
            style: 'destructive',
            onPress: () => navigation.navigate('Subjects'),
          },
        ]
      );
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);

  // Robust Timestamp-Based Countdown Timer
  useEffect(() => {
    if (isContinuousExam) {
      // Continuous 120-minute countdown
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          handleTimeExpired();
        }
      }, 1000);
    } else {
      // SSC Section-by-section 15m countdown
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSectionTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSectionIndex, isContinuousExam]);

  const handleTimeExpired = () => {
    Alert.alert(
      "Time's Up!",
      'Your examination time has concluded. Your test will now be submitted automatically.',
      [{ text: 'OK', onPress: () => performFinalSubmit() }],
      { cancelable: false }
    );
  };

  const handleSectionTimeExpired = () => {
    if (currentSectionIndex < 3) {
      Alert.alert(
        'Section Time Expired!',
        `Time for ${currentSection?.name || 'this section'} has ended. Advancing to Section ${currentSectionIndex + 2}.`,
        [{ text: 'Continue', onPress: () => advanceToNextSection() }]
      );
    } else {
      handleTimeExpired();
    }
  };

  const advanceToNextSection = async () => {
    if (isAdvancing || currentSectionIndex >= 3) return;
    try {
      setIsAdvancing(true);
      await mockTestApi.advanceSection(initialData.sessionId, currentSectionIndex);
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setTimeRemaining(15 * 60);
      setIsAdvancing(false);
    } catch (err: any) {
      setIsAdvancing(false);
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setTimeRemaining(15 * 60);
    }
  };

  // Answer selection handler
  const handleSelectOption = (choice: MockOptionChoice) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;
    const currentState = answers[qId] || { selectedAnswer: null, isMarkedForReview: false };
    const newAnswer = currentState.selectedAnswer === choice ? null : choice;

    const updatedState: LocalAnswerState = {
      ...currentState,
      selectedAnswer: newAnswer,
    };

    setAnswers((prev) => ({
      ...prev,
      [qId]: updatedState,
    }));

    // Sync to backend asynchronously
    mockTestApi
      .saveAnswer({
        sessionId: initialData.sessionId,
        questionId: qId,
        selectedAnswer: newAnswer,
        isMarkedForReview: updatedState.isMarkedForReview,
      })
      .catch((err) => {
        console.warn('Failed to sync answer to server:', err.message);
      });
  };

  // Toggle Marked for Review
  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;
    const currentState = answers[qId] || { selectedAnswer: null, isMarkedForReview: false };
    const newMarked = !currentState.isMarkedForReview;

    const updatedState: LocalAnswerState = {
      ...currentState,
      isMarkedForReview: newMarked,
    };

    setAnswers((prev) => ({
      ...prev,
      [qId]: updatedState,
    }));

    mockTestApi
      .saveAnswer({
        sessionId: initialData.sessionId,
        questionId: qId,
        selectedAnswer: currentState.selectedAnswer,
        isMarkedForReview: newMarked,
      })
      .catch((err) => {
        console.warn('Failed to sync review flag:', err.message);
      });
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;
    const currentState = answers[qId] || { selectedAnswer: null, isMarkedForReview: false };

    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...currentState,
        selectedAnswer: null,
      },
    }));

    mockTestApi
      .saveAnswer({
        sessionId: initialData.sessionId,
        questionId: qId,
        selectedAnswer: null,
        isMarkedForReview: currentState.isMarkedForReview,
      })
      .catch((err) => {
        console.warn('Failed to clear answer:', err.message);
      });
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (!isContinuousExam && currentSectionIndex < 3) {
      Alert.alert(
        'Section Completed',
        `You have reached the end of Section ${currentSectionIndex + 1}. Advance to next section?`,
        [
          { text: 'Review Current Section', style: 'cancel' },
          { text: 'Advance to Next Section', onPress: advanceToNextSection },
        ]
      );
    } else {
      setIsSubmitConfirmOpen(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Final Submit
  const performFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      const scoreSummary = await mockTestApi.submitMockTest(initialData.sessionId);
      setIsSubmitting(false);
      setIsSubmitConfirmOpen(false);
      navigation.navigate('MockResult', {
        sessionId: initialData.sessionId,
        scoreSummary,
        examSlug: initialData.examSlug,
        paperSlug: initialData.paperSlug,
      });
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert(
        'Submission Error',
        err?.message || 'Could not submit mock test. Please check your network and try again.',
        [{ text: 'Retry', onPress: performFinalSubmit }, { text: 'Cancel', style: 'cancel' }]
      );
    }
  };

  // Stats calculation
  const totalQuestionsCount = initialData.totalQuestions || initialData.questions.length || 100;
  const answeredCount = Object.values(answers).filter((a) => a.selectedAnswer !== null).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = totalQuestionsCount - answeredCount;

  // Format timer (HH:MM:SS or MM:SS)
  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0 || isContinuousExam) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentAnswerState = currentQuestion ? answers[currentQuestion._id] : undefined;
  const insets = useSafeAreaInsets();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 20) + 6;

  const isPaper2 = initialData.paperSlug === 'paper-2';
  const examTitle = initialData.examTitle || `${(initialData.examSlug || 'Exam').toUpperCase()} ${isPaper2 ? '— Paper II' : '— Paper I'}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header Bar & Timer */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        {/* Exam Title & Timer Row */}
        <View style={styles.headerMainRow}>
          <View style={styles.examTitleBox}>
            <Text style={styles.examTitleText} numberOfLines={1}>
              {examTitle}
            </Text>
            <Text style={styles.examSubtitleText}>
              Q{currentQuestionIndex + 1} of {totalQuestionsCount}
            </Text>
          </View>

          <View style={styles.headerControlsRight}>
            <View style={[styles.timerPill, timeRemaining < 300 && styles.timerWarning]}>
              <Text style={styles.timerClockEmoji}>⏱️</Text>
              <Text style={[styles.timerText, timeRemaining < 300 && styles.timerTextWarning]}>
                {formatTime(timeRemaining)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.paletteTriggerButton}
              onPress={() => setIsPaletteOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.paletteTriggerText}>☰ Grid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitHeaderButton}
              onPress={() => setIsSubmitConfirmOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.submitHeaderButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Tabs for SSC (Multi-section) or Subject Indicator for JPSC */}
        {!isContinuousExam ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionTabsScroll}>
            {initialData.sections.map((sec, idx) => {
              const isCurrent = idx === currentSectionIndex;
              const isLocked = idx < currentSectionIndex;
              return (
                <View
                  key={sec.sectionIndex}
                  style={[
                    styles.sectionTab,
                    isCurrent && styles.sectionTabActive,
                    isLocked && styles.sectionTabLocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTabText,
                      isCurrent && styles.sectionTabTextActive,
                      isLocked && styles.sectionTabTextLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {isLocked ? '🔒 ' : ''}
                    {sec.name.split(' ')[0]} ({sec.sectionIndex + 1})
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {/* No Negative Marking Notice Pill for JPSC */}
      {isContinuousExam ? (
        <View style={styles.noNegativeBanner}>
          <Text style={styles.noNegativeText}>
            🟢 Official Rule: No Negative Marking (+2 Correct • 0 Wrong • 0 Unanswered)
          </Text>
        </View>
      ) : null}

      {/* Main Question Body */}
      {currentQuestion ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Question Metadata Bar */}
          <View style={styles.questionMetaBar}>
            <Text style={styles.questionIndexTitle}>
              {currentSection?.name || `Question ${currentQuestionIndex + 1}`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LanguageToggle variant="light" size="small" />
              <View
                style={[
                  styles.difficultyBadge,
                  currentQuestion.difficulty === 'Easy' && styles.diffEasy,
                  currentQuestion.difficulty === 'Hard' && styles.diffHard,
                ]}
              >
                <Text style={styles.difficultyText}>{currentQuestion.difficulty || 'Medium'}</Text>
              </View>
            </View>
          </View>

          {/* Question Text */}
          <View style={styles.questionCard}>
            {(!isHindi || !currentQuestion.questionText_hi) && (
              <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
            )}
            {(isBoth || isHindi) && !!currentQuestion.questionText_hi && (
              <View style={[styles.hindiQuestionContainer, !isHindi && styles.hindiQuestionDivider]}>
                {isBoth && (
                  <View style={styles.langTagBadge}>
                    <Text style={styles.langTagBadgeText}>हिन्दी</Text>
                  </View>
                )}
                <Text style={styles.hindiQuestionText}>{currentQuestion.questionText_hi}</Text>
              </View>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {(['A', 'B', 'C', 'D'] as MockOptionChoice[]).map((choice) => {
              const optKeyHi = `option${choice}_hi` as keyof MockQuestion;
              const optKeyEn = `option${choice}` as keyof MockQuestion;
              const optEn = currentQuestion[optKeyEn] as string;
              const optHi = currentQuestion[optKeyHi] as string | undefined;
              const isSelected = currentAnswerState?.selectedAnswer === choice;

              return (
                <TouchableOpacity
                  key={choice}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelectOption(choice)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.choiceCircle, isSelected && styles.choiceCircleSelected]}>
                    <Text
                      style={[
                        styles.choiceLetter,
                        isSelected && styles.choiceLetterSelected,
                      ]}
                    >
                      {choice}
                    </Text>
                  </View>
                  <View style={styles.optionContentCol}>
                    {(!isHindi || !optHi) && (
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {optEn}
                      </Text>
                    )}
                    {(isBoth || isHindi) && !!optHi && (
                      <Text style={[styles.optionTextHindi, isSelected && styles.optionTextHindiSelected]}>
                        {optHi}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Clear Response Button */}
          {currentAnswerState?.selectedAnswer && (
            <TouchableOpacity
              style={styles.clearResponseBtn}
              onPress={handleClearResponse}
              activeOpacity={0.7}
            >
              <Text style={styles.clearResponseText}>Clear Response</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingQuestionText}>Loading question...</Text>
        </View>
      )}

      {/* Bottom Action Cockpit */}
      <View style={[styles.bottomCockpit, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={[styles.markReviewBtn, currentAnswerState?.isMarkedForReview && styles.markReviewBtnActive]}
          onPress={handleToggleMarkForReview}
          activeOpacity={0.8}
        >
          <Text style={styles.markReviewIcon}>
            {currentAnswerState?.isMarkedForReview ? '★' : '☆'}
          </Text>
          <Text
            style={[
              styles.markReviewText,
              currentAnswerState?.isMarkedForReview && styles.markReviewTextActive,
            ]}
          >
            {currentAnswerState?.isMarkedForReview ? 'Marked' : 'Mark Review'}
          </Text>
        </TouchableOpacity>

        <View style={styles.navButtonsRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentQuestionIndex === 0 && styles.disabledNavBtn]}
            onPress={handlePrev}
            disabled={currentQuestionIndex === 0}
            activeOpacity={0.8}
          >
            <Text style={[styles.navBtnText, currentQuestionIndex === 0 && styles.disabledNavBtnText]}>
              ◀ Prev
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, styles.nextNavBtn]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextNavBtnText}>
              {currentQuestionIndex === activeQuestions.length - 1 ? 'Submit Mock' : 'Next ▶'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full 100-Question Interactive Palette Modal */}
      <Modal visible={isPaletteOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.paletteModalContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.paletteModalHeader}>
              <Text style={styles.paletteModalTitle}>
                Question Palette ({totalQuestionsCount} Questions)
              </Text>
              <TouchableOpacity
                onPress={() => setIsPaletteOpen(false)}
                style={styles.closePaletteBtn}
              >
                <Text style={styles.closePaletteText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Palette Legend */}
            <View style={styles.paletteLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Answered ({answeredCount})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.legendText}>Marked ({markedCount})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#e2e8f0' }]} />
                <Text style={styles.legendText}>Unanswered ({unansweredCount})</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.paletteGrid} showsVerticalScrollIndicator={false}>
              {activeQuestions.map((q, idx) => {
                const ans = answers[q._id];
                const isAnswered = ans && ans.selectedAnswer !== null;
                const isMarked = ans && ans.isMarkedForReview;
                const isCurrent = idx === currentQuestionIndex;

                let bubbleBg = '#ffffff';
                let bubbleText = '#0f172a';
                let borderColor = '#cbd5e1';

                if (isAnswered && isMarked) {
                  bubbleBg = '#7c3aed';
                  bubbleText = '#ffffff';
                  borderColor = '#6d28d9';
                } else if (isAnswered) {
                  bubbleBg = '#10b981';
                  bubbleText = '#ffffff';
                  borderColor = '#059669';
                } else if (isMarked) {
                  bubbleBg = '#8b5cf6';
                  bubbleText = '#ffffff';
                  borderColor = '#7c3aed';
                }

                return (
                  <TouchableOpacity
                    key={q._id}
                    style={[
                      styles.paletteBubble,
                      { backgroundColor: bubbleBg, borderColor },
                      isCurrent && styles.paletteBubbleCurrent,
                    ]}
                    onPress={() => {
                      setCurrentQuestionIndex(idx);
                      setIsPaletteOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.paletteBubbleText,
                        { color: isCurrent && !isAnswered && !isMarked ? '#4f46e5' : bubbleText },
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal visible={isSubmitConfirmOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <Text style={styles.confirmTitle}>Submit {examTitle}?</Text>
            <Text style={styles.confirmSubtitle}>
              Please verify your attempt status before final submission:
            </Text>

            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Questions:</Text>
                <Text style={styles.summaryValue}>{totalQuestionsCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#059669' }]}>Attempted:</Text>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>{answeredCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#64748b' }]}>Unattempted:</Text>
                <Text style={[styles.summaryValue, { color: '#64748b' }]}>{unansweredCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#7c3aed' }]}>Marked for Review:</Text>
                <Text style={[styles.summaryValue, { color: '#7c3aed' }]}>{markedCount}</Text>
              </View>
            </View>

            <Text style={styles.confirmWarningText}>
              ⚠️ Answers cannot be modified after confirmation.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelSubmitBtn}
                onPress={() => setIsSubmitConfirmOpen(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelSubmitText}>Resume Test</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.finalSubmitBtn, isSubmitting && styles.disabledBtn]}
                onPress={performFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.finalSubmitText}>Confirm & Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#312e81',
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  examTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  examTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  examSubtitleText: {
    fontSize: 11,
    color: '#a5b4fc',
    marginTop: 1,
  },
  headerControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312e81',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timerWarning: {
    backgroundColor: '#991b1b',
  },
  timerClockEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerTextWarning: {
    color: '#fecaca',
  },
  paletteTriggerButton: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paletteTriggerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  submitHeaderButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  submitHeaderButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTabsScroll: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
  sectionTab: {
    backgroundColor: '#312e81',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  sectionTabActive: {
    backgroundColor: '#4f46e5',
  },
  sectionTabLocked: {
    opacity: 0.5,
  },
  sectionTabText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionTabTextLocked: {
    color: '#64748b',
  },
  noNegativeBanner: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
    alignItems: 'center',
  },
  noNegativeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  questionMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionIndexTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
  },
  diffEasy: {
    backgroundColor: '#dcfce7',
  },
  diffHard: {
    backgroundColor: '#fee2e2',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionCardSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  choiceCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#f8fafc',
  },
  choiceCircleSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#4f46e5',
  },
  choiceLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  choiceLetterSelected: {
    color: '#ffffff',
  },
  optionContentCol: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  optionTextHindi: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 18,
  },
  optionTextHindiSelected: {
    color: '#312e81',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#1e1b4b',
    fontWeight: '600',
  },
  hindiQuestionContainer: {
    marginTop: 6,
  },
  hindiQuestionDivider: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  langTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  langTagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
  },
  hindiQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 22,
  },
  clearResponseBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  clearResponseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  bottomCockpit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  markReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  markReviewBtnActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#8b5cf6',
  },
  markReviewIcon: {
    fontSize: 15,
    marginRight: 4,
    color: '#64748b',
  },
  markReviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  markReviewTextActive: {
    color: '#7c3aed',
    fontWeight: '700',
  },
  navButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledNavBtn: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  disabledNavBtnText: {
    color: '#94a3b8',
  },
  nextNavBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
  },
  nextNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  paletteModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    padding: 16,
  },
  paletteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paletteModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  closePaletteBtn: {
    padding: 6,
  },
  closePaletteText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
  },
  paletteLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 14,
    justifyContent: 'flex-start',
  },
  paletteBubble: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteBubbleCurrent: {
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  paletteBubbleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmModalContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
    width: '90%',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  summaryTable: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  confirmWarningText: {
    fontSize: 12,
    color: '#b45309',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  finalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  finalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingQuestionText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 10,
  },
});
