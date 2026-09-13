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

export const MockTestScreen: React.FC<MockTestScreenProps> = ({ route, navigation }) => {
  const { initialData } = route.params;

  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(
    initialData.currentSectionIndex || 0
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, LocalAnswerState>>({});
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(15 * 60); // 15 mins in sec
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Group questions by section
  const sectionQuestions: MockQuestion[][] = [
    initialData.questions.filter((q) => q.sectionIndex === 0),
    initialData.questions.filter((q) => q.sectionIndex === 1),
    initialData.questions.filter((q) => q.sectionIndex === 2),
    initialData.questions.filter((q) => q.sectionIndex === 3),
  ];

  const currentSection = initialData.sections[currentSectionIndex];
  const activeQuestions = sectionQuestions[currentSectionIndex] || [];
  const currentQuestion = activeQuestions[currentQuestionIndex];

  // Android hardware back button handler
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Leave Mock Test?',
        'Your test is in progress. If you leave now, your session will be discarded.',
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

  // Section countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSectionTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSectionTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSectionIndex]);

  const handleSectionTimeExpired = () => {
    if (currentSectionIndex < 3) {
      Alert.alert(
        'Section Time Expired!',
        `Time for ${currentSection?.name || 'this section'} has ended. You will now move to Section ${currentSectionIndex + 2}.`,
        [{ text: 'Continue', onPress: () => advanceToNextSection() }]
      );
    } else {
      Alert.alert(
        'Mock Test Time Expired!',
        'The final section timer has concluded. Your test is now being submitted.',
        [{ text: 'Submit Now', onPress: () => performFinalSubmit() }]
      );
    }
  };

  const advanceToNextSection = async () => {
    if (isAdvancing || currentSectionIndex >= 3) return;
    try {
      setIsAdvancing(true);
      await mockTestApi.advanceSection(initialData.sessionId, currentSectionIndex);
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setSectionTimeRemaining(15 * 60);
      setIsAdvancing(false);
    } catch (err: any) {
      setIsAdvancing(false);
      // Even if network fails, client moves to next section
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setSectionTimeRemaining(15 * 60);
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
    mockTestApi.saveAnswer({
      sessionId: initialData.sessionId,
      questionId: qId,
      selectedAnswer: newAnswer,
      isMarkedForReview: updatedState.isMarkedForReview,
    }).catch((err) => {
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

    mockTestApi.saveAnswer({
      sessionId: initialData.sessionId,
      questionId: qId,
      selectedAnswer: currentState.selectedAnswer,
      isMarkedForReview: newMarked,
    }).catch((err) => {
      console.warn('Failed to sync review flag:', err.message);
    });
  };

  // Clear current response
  const handleClearResponse = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;
    const currentState = answers[qId] || { selectedAnswer: null, isMarkedForReview: false };

    const updatedState: LocalAnswerState = {
      ...currentState,
      selectedAnswer: null,
    };

    setAnswers((prev) => ({
      ...prev,
      [qId]: updatedState,
    }));

    mockTestApi.saveAnswer({
      sessionId: initialData.sessionId,
      questionId: qId,
      selectedAnswer: null,
      isMarkedForReview: currentState.isMarkedForReview,
    }).catch((err) => {
      console.warn('Failed to clear answer:', err.message);
    });
  };

  // Navigation within active section
  const handleNext = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentSectionIndex < 3) {
      Alert.alert(
        'Section Completed',
        `You have reached the end of Section ${currentSectionIndex + 1}. Do you want to advance to the next section? (Current section will be locked).`,
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

  // Calculate stats for confirmation dialog & palette
  const answeredCount = Object.values(answers).filter((a) => a.selectedAnswer !== null).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = 100 - answeredCount;

  // Format timer
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentAnswerState = currentQuestion ? answers[currentQuestion._id] : undefined;

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20) + 6;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Section Nav Bar & Timer */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        {/* Section Tabs */}
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

        {/* Timer & Palette Buttons Bar */}
        <View style={styles.timerRow}>
          <View style={[styles.timerPill, sectionTimeRemaining < 180 && styles.timerWarning]}>
            <Text style={styles.timerClockEmoji}>⏱️</Text>
            <Text
              style={[
                styles.timerText,
                sectionTimeRemaining < 180 && styles.timerTextWarning,
              ]}
            >
              {formatTime(sectionTimeRemaining)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.paletteTriggerButton}
            onPress={() => setIsPaletteOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.paletteTriggerText}>
              ☰ Q{currentQuestionIndex + 1}/25
            </Text>
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

      {/* Main Question Body */}
      {currentQuestion ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Question Metadata Bar */}
          <View style={styles.questionMetaBar}>
            <Text style={styles.questionIndexTitle}>
              Section {currentSectionIndex + 1} • Question {currentQuestionIndex + 1} of 25
            </Text>
            <View
              style={[
                styles.difficultyBadge,
                currentQuestion.difficulty === 'Easy' && styles.diffEasy,
                currentQuestion.difficulty === 'Medium' && styles.diffMed,
                currentQuestion.difficulty === 'Hard' && styles.diffHard,
              ]}
            >
              <Text style={styles.difficultyText}>{currentQuestion.difficulty}</Text>
            </View>
          </View>

          {/* Question Stem */}
          <View style={styles.questionCard}>
            <Text style={styles.questionStemText}>{currentQuestion.questionText}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {(['A', 'B', 'C', 'D'] as MockOptionChoice[]).map((choice) => {
              const optText = currentQuestion[`option${choice}` as keyof MockQuestion] as string;
              const isSelected = currentAnswerState?.selectedAnswer === choice;

              return (
                <TouchableOpacity
                  key={choice}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelectOption(choice)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.choiceCircle, isSelected && styles.choiceCircleSelected]}>
                    <Text style={[styles.choiceCircleText, isSelected && styles.choiceCircleTextSelected]}>
                      {choice}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {optText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      )}

      {/* Bottom Action Controls */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomRowTop}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.clearBtn]}
            onPress={handleClearResponse}
            disabled={!currentAnswerState?.selectedAnswer}
            activeOpacity={0.7}
          >
            <Text style={[styles.clearBtnText, !currentAnswerState?.selectedAnswer && styles.disabledText]}>
              Clear
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.markReviewBtn,
              currentAnswerState?.isMarkedForReview && styles.markReviewBtnActive,
            ]}
            onPress={handleToggleMarkForReview}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.markReviewBtnText,
                currentAnswerState?.isMarkedForReview && styles.markReviewBtnTextActive,
              ]}
            >
              {currentAnswerState?.isMarkedForReview ? '✓ Marked' : '🔖 Mark'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRowNav}>
          <TouchableOpacity
            style={[styles.navBtn, styles.prevBtn, currentQuestionIndex === 0 && styles.disabledBtn]}
            onPress={handlePrev}
            disabled={currentQuestionIndex === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.navBtnText}>‹ Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, styles.nextBtn]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>
              {currentQuestionIndex === activeQuestions.length - 1 && currentSectionIndex === 3
                ? 'Finish Test ›'
                : 'Save & Next ›'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Question Palette Modal */}
      <Modal visible={isPaletteOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.paletteModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Section {currentSectionIndex + 1} Palette</Text>
              <TouchableOpacity onPress={() => setIsPaletteOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Legend */}
            <View style={styles.paletteLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Answered</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.legendText}>Marked</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#94a3b8' }]} />
                <Text style={styles.legendText}>Unanswered</Text>
              </View>
            </View>

            {/* 25 Question Bubbles Grid */}
            <ScrollView contentContainerStyle={styles.paletteGrid}>
              {activeQuestions.map((q, idx) => {
                const ans = answers[q._id];
                const isAnswered = ans && ans.selectedAnswer !== null;
                const isMarked = ans && ans.isMarkedForReview;
                const isCurrent = idx === currentQuestionIndex;

                let bubbleBg = '#e2e8f0'; // Unanswered grey
                let bubbleText = '#475569';

                if (isAnswered && isMarked) {
                  bubbleBg = '#7c3aed';
                  bubbleText = '#ffffff';
                } else if (isAnswered) {
                  bubbleBg = '#10b981';
                  bubbleText = '#ffffff';
                } else if (isMarked) {
                  bubbleBg = '#a855f7';
                  bubbleText = '#ffffff';
                }

                return (
                  <TouchableOpacity
                    key={q._id}
                    style={[
                      styles.paletteBubble,
                      { backgroundColor: bubbleBg },
                      isCurrent && styles.paletteBubbleCurrent,
                    ]}
                    onPress={() => {
                      setCurrentQuestionIndex(idx);
                      setIsPaletteOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.paletteBubbleText, { color: bubbleText }]}>
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
            <Text style={styles.confirmTitle}>Submit SSC CGL Mock Test?</Text>
            <Text style={styles.confirmSubtitle}>
              Check your attempt summary before completing the examination:
            </Text>

            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Questions:</Text>
                <Text style={styles.summaryValue}>100</Text>
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
                <Text style={[styles.summaryLabel, { color: '#7c3aed' }]}>Marked Questions:</Text>
                <Text style={[styles.summaryValue, { color: '#7c3aed' }]}>{markedCount}</Text>
              </View>
            </View>

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
                  <Text style={styles.finalSubmitText}>Confirm Submit</Text>
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
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#312e81',
  },
  sectionTabsScroll: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sectionTab: {
    backgroundColor: '#312e81',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  sectionTabActive: {
    backgroundColor: '#4f46e5',
  },
  sectionTabLocked: {
    backgroundColor: '#1e1b4b',
    opacity: 0.5,
  },
  sectionTabText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionTabTextLocked: {
    color: '#64748b',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312e81',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerWarning: {
    backgroundColor: '#991b1b',
  },
  timerClockEmoji: {
    fontSize: 13,
    marginRight: 6,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerTextWarning: {
    color: '#fef08a',
  },
  paletteTriggerButton: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 12,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  submitHeaderButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  questionMetaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionIndexTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffEasy: { backgroundColor: '#ecfdf5' },
  diffMed: { backgroundColor: '#fffbeb' },
  diffHard: { backgroundColor: '#fef2f2' },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionStemText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#0f172a',
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
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  optionCardSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#f5f3ff',
  },
  choiceCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  choiceCircleSelected: {
    backgroundColor: '#4f46e5',
  },
  choiceCircleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  choiceCircleTextSelected: {
    color: '#ffffff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 20,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#312e81',
  },
  bottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
    paddingBottom: 16,
  },
  bottomRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    backgroundColor: '#f1f5f9',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  markReviewBtn: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  markReviewBtnActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  markReviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7c3aed',
  },
  markReviewBtnTextActive: {
    color: '#ffffff',
  },
  bottomRowNav: {
    flexDirection: 'row',
    gap: 10,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtn: {
    backgroundColor: '#f1f5f9',
  },
  nextBtn: {
    backgroundColor: '#4f46e5',
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  disabledText: {
    color: '#94a3b8',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  paletteModalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  paletteLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
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
    color: '#64748b',
    fontWeight: '600',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
  },
  paletteBubble: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteBubbleCurrent: {
    borderWidth: 2.5,
    borderColor: '#3b82f6',
  },
  paletteBubbleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  confirmModalContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  summaryTable: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelSubmitBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  finalSubmitBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
