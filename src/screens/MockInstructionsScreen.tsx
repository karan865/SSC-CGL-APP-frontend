import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockInstructionsScreenProps } from '../navigation/types';
import { useExam } from '../context/ExamContext';
import { mockTestApi } from '../services/api/mockTestApi';

type SelectedPaperKey = 'jpsc-paper-1' | 'jpsc-paper-2' | 'ssc-tier-1';

interface PaperConfig {
  key: SelectedPaperKey;
  examSlug: string;
  paperSlug: string;
  badge: string;
  title: string;
  subtitle: string;
  totalQuestions: number;
  durationText: string;
  maxMarks: number;
  correctMarks: number;
  wrongMarks: number;
  hasNegativeMarking: boolean;
  subjects: { name: string; details: string; timer?: string }[];
  instructions: string[];
}

const PAPERS: Record<SelectedPaperKey, PaperConfig> = {
  'jpsc-paper-1': {
    key: 'jpsc-paper-1',
    examSlug: 'jpsc',
    paperSlug: 'paper-1',
    badge: 'JPSC PRELIMS 2024-26',
    title: 'Paper I — General Studies',
    subtitle: 'Official Combined Civil Services Exam simulation covering complete GS syllabus.',
    totalQuestions: 100,
    durationText: '120m',
    maxMarks: 200,
    correctMarks: 2,
    wrongMarks: 0,
    hasNegativeMarking: false,
    subjects: [
      { name: 'History of India (Ancient, Medieval, Modern)', details: '15 Questions • 30 Marks' },
      { name: 'Geography of India (General, Physical, Economic)', details: '10 Questions • 20 Marks' },
      { name: 'Indian Polity & Governance', details: '10 Questions • 20 Marks' },
      { name: 'Economic & Sustainable Development', details: '10 Questions • 20 Marks' },
      { name: 'Science & Technology (General, Agri, ICT)', details: '15 Questions • 30 Marks' },
      { name: 'Jharkhand Specific Awareness', details: '10 Questions • 20 Marks' },
      { name: 'National & International Current Affairs', details: '15 Questions • 30 Marks' },
      { name: 'General Miscellaneous & Human Rights', details: '15 Questions • 30 Marks' },
    ],
    instructions: [
      'The exam duration is 120 minutes with a single continuous countdown timer.',
      'No Negative Marking: Every correct answer earns +2 marks. Wrong or unanswered questions incur 0 deduction.',
      'You can freely navigate between all 100 questions using the Question Palette at any time.',
      'Use "Mark for Review" to flag doubtful questions for later inspection before final submission.',
      'Test automatically submits when the 120-minute countdown concludes.',
    ],
  },
  'jpsc-paper-2': {
    key: 'jpsc-paper-2',
    examSlug: 'jpsc',
    paperSlug: 'paper-2',
    badge: 'JPSC PRELIMS 2024-26',
    title: 'Paper II — Jharkhand Special',
    subtitle: 'Comprehensive Jharkhand statehood, tribal governance, CNT/SPT land laws and history exam.',
    totalQuestions: 100,
    durationText: '120m',
    maxMarks: 200,
    correctMarks: 2,
    wrongMarks: 0,
    hasNegativeMarking: false,
    subjects: [
      { name: 'Traditional Tribal Governance Systems', details: '14 Questions • 28 Marks' },
      { name: 'Jharkhand Movements & Freedom Fighters', details: '13 Questions • 26 Marks' },
      { name: 'Land Laws (CNT Act 1908 & SPT Act 1949)', details: '14 Questions • 28 Marks' },
      { name: 'Jharkhand Geography, Rivers & Relief', details: '12 Questions • 24 Marks' },
      { name: 'Mines, Minerals & Major Industries', details: '13 Questions • 26 Marks' },
      { name: 'State Government Welfare Schemes', details: '12 Questions • 24 Marks' },
      { name: 'Forest, Wildlife & Environmental Disaster', details: '12 Questions • 24 Marks' },
      { name: 'Culture, Sports & Miscellaneous Jharkhand GK', details: '12 Questions • 24 Marks' },
    ],
    instructions: [
      'The exam duration is 120 minutes with a single continuous countdown timer.',
      'No Negative Marking: Every correct answer earns +2 marks. Wrong or unanswered questions incur 0 deduction.',
      'You can freely navigate between all 100 questions using the Question Palette at any time.',
      'Full post-exam review with step-by-step solutions and explanations is provided after submission.',
      'Test automatically submits when the 120-minute countdown concludes.',
    ],
  },
  'ssc-tier-1': {
    key: 'ssc-tier-1',
    examSlug: 'ssc-cgl',
    paperSlug: 'tier-1',
    badge: 'OFFICIAL SSC PATTERN',
    title: 'SSC CGL Tier-I Simulation',
    subtitle: 'Timed 4-section practice engineered precisely to mirror the official SSC CGL examination.',
    totalQuestions: 100,
    durationText: '60m',
    maxMarks: 200,
    correctMarks: 2,
    wrongMarks: 0.5,
    hasNegativeMarking: true,
    subjects: [
      { name: 'General Intelligence & Reasoning', details: '25 Questions • 50 Marks', timer: '15:00' },
      { name: 'General Awareness', details: '25 Questions • 50 Marks', timer: '15:00' },
      { name: 'Quantitative Aptitude', details: '25 Questions • 50 Marks', timer: '15:00' },
      { name: 'English Comprehension', details: '25 Questions • 50 Marks', timer: '15:00' },
    ],
    instructions: [
      'Test consists of 4 sequentially timed sections of 15 minutes each (Total 60 minutes).',
      'Negative Marking Applied: +2 for correct, -0.50 deduction for incorrect answers.',
      'Once a section timer concludes or is locked, you cannot return to modify answers.',
      'Final submission reveals full solution breakdown and topic analysis.',
    ],
  },
};

export const MockInstructionsScreen: React.FC<MockInstructionsScreenProps> = ({
  route,
  navigation,
}) => {
  const { examSlug: activeExamSlug } = useExam();

  // Determine initial paper tab based on route params or active exam context
  const deriveInitialKey = (): SelectedPaperKey => {
    if (route.params?.examSlug === 'jpsc') {
      return route.params?.paperSlug === 'paper-2' ? 'jpsc-paper-2' : 'jpsc-paper-1';
    }
    if (route.params?.examSlug === 'ssc-cgl') {
      return 'ssc-tier-1';
    }
    // No explicit route params — use active exam context
    return activeExamSlug === 'jpsc' ? 'jpsc-paper-1' : 'ssc-tier-1';
  };

  const [selectedKey, setSelectedKey] = useState<SelectedPaperKey>(deriveInitialKey());
  const [loading, setLoading] = useState(false);

  const currentPaper = PAPERS[selectedKey];
  const insets = useSafeAreaInsets();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 20) + 8;

  const handleStartMock = async () => {
    try {
      setLoading(true);
      const res = await mockTestApi.startMockTest({
        testType: currentPaper.examSlug === 'jpsc' ? 'FULL' : 'TIER_1',
        examId: currentPaper.examSlug,
        paperId: currentPaper.paperSlug,
      });
      setLoading(false);
      navigation.navigate('MockTest', { initialData: res });
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Unable to Start Mock Test',
        error?.message || 'Could not initialize mock session. Please ensure backend is connected.',
        [{ text: 'Retry', onPress: handleStartMock }, { text: 'Cancel', style: 'cancel' }]
      );
    }
  };

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
        <Text style={styles.headerTitle}>Full Mock Test Simulator</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Exam & Paper Selector Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.tabButton, selectedKey === 'jpsc-paper-1' && styles.tabButtonActive]}
            onPress={() => setSelectedKey('jpsc-paper-1')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedKey === 'jpsc-paper-1' && styles.tabTextActive]}>
              🏛️ JPSC Paper I
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedKey === 'jpsc-paper-2' && styles.tabButtonActive]}
            onPress={() => setSelectedKey('jpsc-paper-2')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedKey === 'jpsc-paper-2' && styles.tabTextActive]}>
              🌲 JPSC Paper II
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedKey === 'ssc-tier-1' && styles.tabButtonActive]}
            onPress={() => setSelectedKey('ssc-tier-1')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, selectedKey === 'ssc-tier-1' && styles.tabTextActive]}>
              🏆 SSC CGL Tier-I
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Negative Marking Notice Pill */}
        {!currentPaper.hasNegativeMarking ? (
          <View style={styles.noNegativeBanner}>
            <Text style={styles.noNegativeIcon}>🟢</Text>
            <View style={styles.noNegativeTextContainer}>
              <Text style={styles.noNegativeTitle}>Official Rule: No Negative Marking</Text>
              <Text style={styles.noNegativeDesc}>
                Correct: +2 Marks • Wrong: 0 Deduction • Unanswered: 0
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.negativeBanner}>
            <Text style={styles.negativeIcon}>⚠️</Text>
            <View style={styles.noNegativeTextContainer}>
              <Text style={styles.negativeTitle}>Negative Marking in Tier-I</Text>
              <Text style={styles.negativeDesc}>
                Correct: +2 Marks • Wrong: -0.50 Marks Penalty • Unanswered: 0
              </Text>
            </View>
          </View>
        )}

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroBadge}>{currentPaper.badge}</Text>
          <Text style={styles.heroTitle}>{currentPaper.title}</Text>
          <Text style={styles.heroSubtitle}>{currentPaper.subtitle}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{currentPaper.totalQuestions}</Text>
              <Text style={styles.heroStatLabel}>Questions</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{currentPaper.durationText}</Text>
              <Text style={styles.heroStatLabel}>Total Time</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{currentPaper.maxMarks}</Text>
              <Text style={styles.heroStatLabel}>Max Marks</Text>
            </View>
          </View>
        </View>

        {/* Syllabus / Subject Structure Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Syllabus Distribution</Text>
          <Text style={styles.cardSubtitle}>
            {currentPaper.examSlug === 'jpsc'
              ? 'Proportional representation strictly matching official JPSC Prelims syllabus.'
              : 'Each section has an individual 15-minute timer before automatically locking.'}
          </Text>

          {currentPaper.subjects.map((sub, idx) => (
            <View key={idx} style={styles.sectionRow}>
              <View style={styles.sectionIndexBadge}>
                <Text style={styles.sectionIndexText}>{idx + 1}</Text>
              </View>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionName}>{sub.name}</Text>
                <Text style={styles.sectionDetails}>{sub.details}</Text>
              </View>
              {sub.timer ? (
                <View style={styles.timerBadge}>
                  <Text style={styles.timerBadgeText}>{sub.timer}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* Marking Scheme Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Official Marking Scheme</Text>
          <View style={styles.markingRow}>
            <View style={[styles.markingCard, { borderColor: '#10b981', backgroundColor: '#ecfdf5' }]}>
              <Text style={[styles.markingValue, { color: '#059669' }]}>
                +{currentPaper.correctMarks}.00
              </Text>
              <Text style={styles.markingLabel}>Correct Answer</Text>
            </View>

            <View
              style={[
                styles.markingCard,
                currentPaper.hasNegativeMarking
                  ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' }
                  : { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
              ]}
            >
              <Text
                style={[
                  styles.markingValue,
                  { color: currentPaper.hasNegativeMarking ? '#dc2626' : '#64748b' },
                ]}
              >
                {currentPaper.hasNegativeMarking ? `-${currentPaper.wrongMarks.toFixed(2)}` : '0.00'}
              </Text>
              <Text style={styles.markingLabel}>
                {currentPaper.hasNegativeMarking ? 'Wrong Answer' : 'Wrong (No Penalty)'}
              </Text>
            </View>

            <View style={[styles.markingCard, { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }]}>
              <Text style={[styles.markingValue, { color: '#64748b' }]}>0.00</Text>
              <Text style={styles.markingLabel}>Unanswered</Text>
            </View>
          </View>
        </View>

        {/* Test Rules & Instructions Card */}
        <View style={styles.warningCard}>
          <Text style={styles.warningHeader}>Important Exam Guidelines</Text>
          {currentPaper.instructions.map((ins, i) => (
            <Text key={i} style={styles.warningBullet}>
              • {ins}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* Start Button Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.startButton, loading && styles.disabledButton]}
          onPress={handleStartMock}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.startButtonText}>
              Start {currentPaper.title} (100 Qs)
            </Text>
          )}
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
    padding: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 22,
    color: '#0f172a',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSpacer: {
    width: 32,
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4338ca',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  noNegativeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  noNegativeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  noNegativeTextContainer: {
    flex: 1,
  },
  noNegativeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  noNegativeDesc: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  negativeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  negativeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  negativeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  negativeDesc: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  heroBadge: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338ca',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionDetails: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  markingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  markingCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  markingValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  markingLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  warningBullet: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
    marginBottom: 6,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  startButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.65,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
