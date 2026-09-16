import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExamSelectionScreenProps } from '../navigation/types';
import { useExam } from '../context/ExamContext';
import { ExamInfo } from '../types/exam';

export const ExamSelectionScreen: React.FC<ExamSelectionScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { availableExams, setActiveExam } = useExam();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 20) + 12;

  const handleSelectExam = async (exam: ExamInfo) => {
    await setActiveExam(exam.slug);
    navigation.replace('Subjects');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>🎯 MULTI-EXAM PLATFORM</Text>
          </View>
          <Text style={styles.heroTitle}>Choose Your{'\n'}Examination</Text>
          <Text style={styles.heroSubtitle}>
            Select the exam you're preparing for. All subjects, questions, mock tests, and
            analytics will be scoped to your selection.
          </Text>
          <View style={styles.heroSwitchHint}>
            <Text style={styles.heroSwitchHintText}>
              💡 You can switch exams anytime from the home screen
            </Text>
          </View>
        </View>

        {/* Exam Cards */}
        {availableExams.map((exam) => (
          <TouchableOpacity
            key={exam.slug}
            style={[styles.examCard, { borderColor: exam.color + '40' }]}
            onPress={() => handleSelectExam(exam)}
            activeOpacity={0.85}
          >
            {/* Card Header with Icon & Badge */}
            <View style={styles.cardHeader}>
              <View style={[styles.examIconBadge, { backgroundColor: exam.bgLight }]}>
                <Text style={styles.examIcon}>{exam.icon}</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.examName}>{exam.name}</Text>
                <View style={[styles.examTaglinePill, { backgroundColor: exam.color + '18' }]}>
                  <Text style={[styles.examTaglineText, { color: exam.color }]}>{exam.tagline}</Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.examDescription}>{exam.description}</Text>

            {/* CTA Button */}
            <View style={[styles.selectButton, { backgroundColor: exam.color }]}>
              <Text style={styles.selectButtonText}>Prepare for {exam.shortName}</Text>
              <Text style={styles.selectButtonArrow}>➔</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Coming Soon Teaser */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonIcon}>🚀</Text>
          <Text style={styles.comingSoonTitle}>More Exams Coming Soon</Text>
          <Text style={styles.comingSoonDesc}>
            BPSC, UPSC, JSSC, and more competitive exams will be added as plug-and-play modules.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // ── Hero ────────────────────────────────────
  heroSection: {
    marginBottom: 28,
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 18,
  },
  heroBadgeText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  heroSwitchHint: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  heroSwitchHintText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Exam Cards ──────────────────────────────
  examCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  examIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  examIcon: {
    fontSize: 30,
  },
  cardHeaderText: {
    flex: 1,
  },
  examName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  examTaglinePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  examTaglineText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  examDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 18,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  selectButtonArrow: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '700',
  },

  // ── Coming Soon ─────────────────────────────
  comingSoonCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    padding: 22,
    alignItems: 'center',
    marginTop: 4,
  },
  comingSoonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  comingSoonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  comingSoonDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
});
