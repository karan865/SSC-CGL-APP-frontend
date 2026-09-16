import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingViewProps {
  title?: string;
  message?: string;
  isWarmup?: boolean;
}

const QUOTES = [
  'Consistency turns practice into top government rankings.',
  'Loading 2,387 questions & live exam simulators...',
  'Render cloud server boots up in ~40s on first load. Almost ready!',
  'Every formula revised is a mark guaranteed in Tier-2.',
  'Targeting high-accuracy drills across Quant, Reasoning, English & GA...',
];

export const LoadingView: React.FC<LoadingViewProps> = ({
  title = 'Warming Up Study Arena',
  message = 'Connecting to high-speed question bank...',
  isWarmup = true,
}) => {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⚡</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.spinnerWrapper}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>

        {isWarmup && (
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>💡 {QUOTES[quoteIdx]}</Text>
          </View>
        )}

        <Text style={styles.footerNote}>SSC CGL Exam Prep • Tier 1 & Tier 2</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0a0f1d',
  },
  card: {
    width: '100%',
    backgroundColor: '#131d33',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  spinnerWrapper: {
    marginVertical: 12,
  },
  quoteBox: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginTop: 12,
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 12.5,
    color: '#cbd5e1',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerNote: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
});
