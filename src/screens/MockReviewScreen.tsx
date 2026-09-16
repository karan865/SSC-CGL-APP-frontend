import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockReviewScreenProps } from '../navigation/types';
import { MockReviewQuestion, MockReviewResponse } from '../types/mockTest';
import { mockTestApi } from '../services/api/mockTestApi';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

type FilterType = 'ALL' | 'CORRECT' | 'INCORRECT' | 'UNANSWERED' | 'MARKED';

export const MockReviewScreen: React.FC<MockReviewScreenProps> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const { language, isHindi, isBoth } = useLanguage();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<MockReviewResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(-1); // -1 = All

  useEffect(() => {
    fetchReview();
  }, [sessionId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await mockTestApi.getMockReview(sessionId);
      setData(res);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading post-exam solutions...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load review solutions.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchReview}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter questions
  const filteredQuestions = data.questions.filter((q) => {
    if (selectedSectionIndex !== -1 && q.sectionIndex !== selectedSectionIndex) {
      return false;
    }

    if (activeFilter === 'CORRECT') return q.isCorrect;
    if (activeFilter === 'INCORRECT') return q.userSelectedAnswer !== null && !q.isCorrect;
    if (activeFilter === 'UNANSWERED') return q.userSelectedAnswer === null;
    if (activeFilter === 'MARKED') return q.isMarkedForReview;
    return true;
  });

  const correctCount = data.questions.filter((q) => q.isCorrect).length;
  const incorrectCount = data.questions.filter(
    (q) => q.userSelectedAnswer !== null && !q.isCorrect
  ).length;
  const unansweredCount = data.questions.filter((q) => q.userSelectedAnswer === null).length;
  const markedCount = data.questions.filter((q) => q.isMarkedForReview).length;

  const sectionsList =
    data.scoreSummary?.sectionResults && data.scoreSummary.sectionResults.length > 0
      ? data.scoreSummary.sectionResults.map((s) => ({
          index: s.sectionIndex,
          name: s.name,
          count: s.totalQuestions,
        }))
      : [
          { index: 0, name: 'Reasoning', count: 25 },
          { index: 1, name: 'GA', count: 25 },
          { index: 2, name: 'Quant', count: 25 },
          { index: 3, name: 'English', count: 25 },
        ];

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20) + 8;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post-Exam Solutions</Text>
        <LanguageToggle variant="light" size="small" />
      </View>

      {/* Section Filter Pills */}
      <View style={styles.sectionFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionPillsContainer}>
          <TouchableOpacity
            style={[styles.sectionPill, selectedSectionIndex === -1 && styles.sectionPillActive]}
            onPress={() => setSelectedSectionIndex(-1)}
          >
            <Text style={[styles.sectionPillText, selectedSectionIndex === -1 && styles.sectionPillTextActive]}>
              All ({data.questions.length})
            </Text>
          </TouchableOpacity>
          {sectionsList.map((sec) => (
            <TouchableOpacity
              key={sec.index}
              style={[styles.sectionPill, selectedSectionIndex === sec.index && styles.sectionPillActive]}
              onPress={() => setSelectedSectionIndex(sec.index)}
            >
              <Text style={[styles.sectionPillText, selectedSectionIndex === sec.index && styles.sectionPillTextActive]}>
                {sec.name.split(' ')[0]} ({sec.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsContainer}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'ALL' && styles.filterTabTextActive]}>
              All ({data.questions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'CORRECT' && styles.filterTabActive]}
            onPress={() => setActiveFilter('CORRECT')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'CORRECT' && styles.filterTabTextActive]}>
              ✅ Correct ({correctCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'INCORRECT' && styles.filterTabActive]}
            onPress={() => setActiveFilter('INCORRECT')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'INCORRECT' && styles.filterTabTextActive]}>
              ❌ Wrong ({incorrectCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'UNANSWERED' && styles.filterTabActive]}
            onPress={() => setActiveFilter('UNANSWERED')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'UNANSWERED' && styles.filterTabTextActive]}>
              ⚪ Skipped ({unansweredCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'MARKED' && styles.filterTabActive]}
            onPress={() => setActiveFilter('MARKED')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'MARKED' && styles.filterTabTextActive]}>
              🔖 Marked ({markedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Questions Review List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No questions match this filter criteria.</Text>
          </View>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isUserCorrect = q.isCorrect;
            const isUserAnswered = q.userSelectedAnswer !== null;

            return (
              <View key={q.questionId} style={styles.reviewCard}>
                {/* Question Top Meta */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.qNumBadge}>
                    <Text style={styles.qNumText}>
                      Section {q.sectionIndex + 1} • Q{idx + 1}
                    </Text>
                  </View>

                  {/* Marks badge */}
                  <View
                    style={[
                      styles.marksBadge,
                      q.marksAwarded > 0
                        ? styles.marksPositive
                        : q.marksAwarded < 0
                        ? styles.marksNegative
                        : styles.marksNeutral,
                    ]}
                  >
                    <Text
                      style={[
                        styles.marksBadgeText,
                        q.marksAwarded > 0
                          ? { color: '#059669' }
                          : q.marksAwarded < 0
                          ? { color: '#dc2626' }
                          : { color: '#64748b' },
                      ]}
                    >
                      {q.marksAwarded > 0 ? '+2.00' : q.marksAwarded < 0 ? '-0.50' : '0.00'} Marks
                    </Text>
                  </View>
                </View>

                {/* Question Stem */}
                {(!isHindi || !q.questionText_hi) && (
                  <Text style={styles.questionStemText}>{q.questionText}</Text>
                )}
                {(isBoth || isHindi) && !!q.questionText_hi && (
                  <View style={[styles.hindiQuestionContainer, !isHindi && styles.hindiQuestionDivider]}>
                    {isBoth && (
                      <View style={styles.langTagBadge}>
                        <Text style={styles.langTagBadgeText}>हिन्दी</Text>
                      </View>
                    )}
                    <Text style={styles.hindiQuestionText}>{q.questionText_hi}</Text>
                  </View>
                )}

                {/* Options with color grading */}
                <View style={styles.optionsList}>
                  {(['A', 'B', 'C', 'D'] as ('A' | 'B' | 'C' | 'D')[]).map((choice) => {
                    const optKeyHi = `option${choice}_hi` as keyof MockReviewQuestion;
                    const optKeyEn = `option${choice}` as keyof MockReviewQuestion;
                    const optEn = q[optKeyEn] as string;
                    const optHi = q[optKeyHi] as string | undefined;
                    const isCorrectChoice = choice === q.correctAnswer;
                    const isUserChoice = choice === q.userSelectedAnswer;

                    let optBg = '#ffffff';
                    let optBorder = '#e2e8f0';
                    let badgeLabel = '';

                    if (isCorrectChoice) {
                      optBg = '#ecfdf5';
                      optBorder = '#10b981';
                      badgeLabel = isUserChoice ? '✓ Your Answer (Correct)' : '✓ Correct Answer';
                    } else if (isUserChoice) {
                      optBg = '#fef2f2';
                      optBorder = '#ef4444';
                      badgeLabel = '✗ Your Choice (Incorrect)';
                    }

                    return (
                      <View
                        key={choice}
                        style={[
                          styles.reviewOptionCard,
                          { backgroundColor: optBg, borderColor: optBorder },
                        ]}
                      >
                        <View style={styles.reviewOptionHeader}>
                          <Text style={styles.reviewChoiceText}>({choice})</Text>
                          <View style={{ flex: 1 }}>
                            {(!isHindi || !optHi) && (
                              <Text style={styles.reviewOptionBody}>{optEn}</Text>
                            )}
                            {(isBoth || isHindi) && !!optHi && (
                              <Text style={[styles.reviewOptionBodyHindi, isCorrectChoice && { color: '#047857' }]}>
                                {optHi}
                              </Text>
                            )}
                          </View>
                        </View>
                        {badgeLabel.length > 0 && (
                          <Text
                            style={[
                              styles.reviewOptionBadge,
                              isCorrectChoice ? { color: '#059669' } : { color: '#dc2626' },
                            ]}
                          >
                            {badgeLabel}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Detailed Solution Box */}
                <View style={styles.solutionBox}>
                  <Text style={styles.solutionTitle}>💡 Step-by-Step Derivation & Solution:</Text>
                  
                  {(!isHindi || !q.explanation_hi) && (
                    <View style={styles.solutionSection}>
                      {isBoth && q.explanation_hi && (
                        <Text style={styles.solutionLangLabel}>English:</Text>
                      )}
                      <Text style={styles.solutionText}>{q.explanation}</Text>
                    </View>
                  )}

                  {(isBoth || isHindi) && !!q.explanation_hi && (
                    <View style={[styles.solutionSection, !isHindi && styles.solutionSectionHindi]}>
                      <Text style={styles.solutionHindiTitle}>💡 हिन्दी व्याख्या:</Text>
                      <Text style={styles.solutionText}>{q.explanation_hi}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#1e293b',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSpacer: {
    width: 36,
  },
  sectionFilterRow: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
  },
  sectionPillsContainer: {
    paddingHorizontal: 12,
    gap: 6,
  },
  sectionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  sectionPillActive: {
    backgroundColor: '#312e81',
  },
  sectionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  sectionPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterTabsRow: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  filterTabsContainer: {
    paddingHorizontal: 12,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterTabActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qNumBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  marksBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  marksPositive: {
    backgroundColor: '#ecfdf5',
  },
  marksNegative: {
    backgroundColor: '#fef2f2',
  },
  marksNeutral: {
    backgroundColor: '#f8fafc',
  },
  marksBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  questionStemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 14,
  },
  optionsList: {
    gap: 8,
    marginBottom: 14,
  },
  reviewOptionCard: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
  },
  reviewOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reviewChoiceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginRight: 8,
  },
  reviewOptionBody: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  reviewOptionBodyHindi: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 18,
  },
  hindiQuestionContainer: {
    marginTop: 4,
    marginBottom: 14,
  },
  hindiQuestionDivider: {
    marginTop: 6,
    paddingTop: 8,
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
    lineHeight: 21,
  },
  solutionSection: {
    marginBottom: 6,
  },
  solutionSectionHindi: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  solutionLangLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 2,
  },
  solutionHindiTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
  },
  reviewOptionBadge: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    marginLeft: 26,
  },
  solutionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
  },
  solutionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312e81',
    marginBottom: 4,
  },
  solutionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
