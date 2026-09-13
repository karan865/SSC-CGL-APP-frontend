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
import { mockTestApi } from '../services/api/mockTestApi';

export const MockInstructionsScreen: React.FC<MockInstructionsScreenProps> = ({
  navigation,
}) => {
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20) + 8;

  const handleStartMock = async () => {
    try {
      setLoading(true);
      const res = await mockTestApi.startMockTest('TIER_1');
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
        <Text style={styles.headerTitle}>SSC CGL Tier-I Mock Test</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroBadge}>OFFICIAL 2026 PATTERN</Text>
          <Text style={styles.heroTitle}>Full Tier-I Exam Simulation</Text>
          <Text style={styles.heroSubtitle}>
            Timed 4-section practice engineered precisely to mirror the actual SSC CGL examination environment.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>100</Text>
              <Text style={styles.heroStatLabel}>Questions</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>60m</Text>
              <Text style={styles.heroStatLabel}>Total Time</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>200</Text>
              <Text style={styles.heroStatLabel}>Max Marks</Text>
            </View>
          </View>
        </View>

        {/* Section Structure Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sectional Distribution & Timers</Text>
          <Text style={styles.cardSubtitle}>
            Each subject has an individual 15-minute timer before automatically locking.
          </Text>

          <View style={styles.sectionRow}>
            <View style={styles.sectionIndexBadge}>
              <Text style={styles.sectionIndexText}>1</Text>
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionName}>Reasoning & Intelligence</Text>
              <Text style={styles.sectionDetails}>25 Questions • 50 Marks</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>15:00</Text>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.sectionIndexBadge}>
              <Text style={styles.sectionIndexText}>2</Text>
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionName}>General Awareness</Text>
              <Text style={styles.sectionDetails}>25 Questions • 50 Marks</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>15:00</Text>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.sectionIndexBadge}>
              <Text style={styles.sectionIndexText}>3</Text>
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionName}>Quantitative Aptitude</Text>
              <Text style={styles.sectionDetails}>25 Questions • 50 Marks</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>15:00</Text>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.sectionIndexBadge}>
              <Text style={styles.sectionIndexText}>4</Text>
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionName}>English Comprehension</Text>
              <Text style={styles.sectionDetails}>25 Questions • 50 Marks</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>15:00</Text>
            </View>
          </View>
        </View>

        {/* Marking Scheme Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Official Marking Scheme</Text>
          <View style={styles.markingRow}>
            <View style={[styles.markingCard, { borderColor: '#10b981', backgroundColor: '#ecfdf5' }]}>
              <Text style={[styles.markingValue, { color: '#059669' }]}>+2.00</Text>
              <Text style={styles.markingLabel}>Correct Answer</Text>
            </View>
            <View style={[styles.markingCard, { borderColor: '#ef4444', backgroundColor: '#fef2f2' }]}>
              <Text style={[styles.markingValue, { color: '#dc2626' }]}>-0.50</Text>
              <Text style={styles.markingLabel}>Wrong Answer</Text>
            </View>
            <View style={[styles.markingCard, { borderColor: '#94a3b8', backgroundColor: '#f8fafc' }]}>
              <Text style={[styles.markingValue, { color: '#64748b' }]}>0.00</Text>
              <Text style={styles.markingLabel}>Unanswered</Text>
            </View>
          </View>
        </View>

        {/* Exam Rules & Warning Card */}
        <View style={styles.warningCard}>
          <Text style={styles.warningHeader}>⚠️ Important Exam Instructions</Text>
          <Text style={styles.warningBullet}>
            • <Text style={styles.bold}>Section Lock</Text>: When a section timer hits 00:00, that section will lock automatically and cannot be re-opened.
          </Text>
          <Text style={styles.warningBullet}>
            • <Text style={styles.bold}>Palette Navigation</Text>: Use the question palette grid to jump between questions in the active section.
          </Text>
          <Text style={styles.warningBullet}>
            • <Text style={styles.bold}>Mark Question</Text>: Mark questions you want to visit again before the section timer expires.
          </Text>
          <Text style={styles.warningBullet}>
            • <Text style={styles.bold}>Full Solutions</Text>: Detailed derivations and answer keys will be unlocked immediately upon submitting the test.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Start Button Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, loading && styles.disabledButton]}
          onPress={handleStartMock}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.startButtonText}>🚀 Start Tier-I Mock Test</Text>
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
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#312e81',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  heroBadge: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#c7d2fe',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#3730a3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: '#c7d2fe',
    fontSize: 11,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#4338ca',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
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
    fontSize: 13,
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
  bold: {
    fontWeight: '700',
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
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
