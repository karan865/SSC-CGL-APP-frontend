import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Modal,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { OnboardingScreenProps } from '../navigation/types';
import { serverWakeupService } from '../services/serverWakeupService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  icon: string;
  title: string;
  description: string;
  pills: string[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    badge: '📚 Authentic Question Bank',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    icon: '🎯',
    title: '2,300+ Premium\nQuestions',
    description:
      'Master SSC CGL with authentic Tier-1 & Tier-2 PYQs, shortcut formulas, and instant step-by-step explanations.',
    pills: ['📐 813 Quant', '🧩 556 Reasoning', '📖 506 English', '🌍 512 GA'],
  },
  {
    id: '2',
    badge: '⏱️ Real Exam Simulation',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    icon: '🏆',
    title: 'Real Exam Mock\nSimulator',
    description:
      'Experience the real exam pressure with actual 60-minute countdown timers, official +2 / -0.5 marking, and question palettes.',
    pills: ['⚡ 100 Qs / 60 Min Tier-1', '📊 Instant Scorecard', '🔍 Step-by-Step Review'],
  },
  {
    id: '3',
    badge: '📈 AI Study Engine',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    icon: '🔥',
    title: 'Smart Weakness\nTracker & Streaks',
    description:
      'Target low-accuracy topics automatically. Build unbroken daily study streaks and monitor your average solving speed.',
    pills: ['🎯 Weak Area Focus', '🔥 5-Day Study Streaks', '⏱️ Speed Tracking (sec/Q)'],
  },
  {
    id: '4',
    badge: '🚀 Your Preparation Toolkit',
    badgeColor: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    icon: '🌟',
    title: 'Ready to Ace\nSSC CGL?',
    description:
      'All 2,387 questions, topic tests, full-length mocks, and bookmark revisions are ready for you. Let’s begin!',
    pills: ['✅ Tier 1 & Tier 2 Ready', '📱 Offline-Friendly', '💡 100% Free Practice'],
  },
];

const MOTIVATIONAL_QUOTES = [
  'Waking up the cloud server (Render free tier takes ~40s on first load)...',
  'Consistency is the DNA of mastery. Preparing your test arena...',
  'Every question solved brings you closer to your dream post...',
  'Connecting to MongoDB Atlas high-speed question bank...',
  'Almost ready! Loading subjects and exam simulation modules...',
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Trigger silent server wakeup as soon as onboarding mounts
  useEffect(() => {
    serverWakeupService.startWakeup();
  }, []);

  // Rotate motivational quotes during warm-up modal
  useEffect(() => {
    if (!isWarmingUp) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isWarmingUp]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    // If server is already hot and ready, proceed immediately!
    if (serverWakeupService.isReady()) {
      navigation.replace('Subjects');
      return;
    }

    // Server is still booting up (Render cold start)
    // Show warm-up modal while waiting
    setIsWarmingUp(true);

    const isReady = await serverWakeupService.waitForServer(45000);
    setIsWarmingUp(false);
    navigation.replace('Subjects');
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.cardContainer}>
          {/* Badge */}
          <View style={[styles.badgeContainer, { backgroundColor: item.badgeBg }]}>
            <Text style={[styles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
          </View>

          {/* Big Graphic Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.largeIcon}>{item.icon}</Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {/* Feature Pills */}
          <View style={styles.pillsContainer}>
            {item.pills.map((pill, i) => (
              <View key={i} style={styles.pill}>
                <Text style={styles.pillText}>{pill}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header: App Name & Skip */}
      <View style={styles.topBar}>
        <Text style={styles.brandTitle}>🎯 SSC CGL Prep</Text>
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleGetStarted} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      />

      {/* Bottom Footer: Dots & Next/Get Started Button */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, isLastSlide ? styles.getStartedButton : styles.nextButton]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>
            {isLastSlide ? 'Get Started 🚀' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Render Server Warm-Up Modal */}
      <Modal visible={isWarmingUp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.warmUpCard}>
            <View style={styles.warmUpIconBadge}>
              <Text style={{ fontSize: 36 }}>⚡</Text>
            </View>

            <Text style={styles.warmUpTitle}>Warming Up Cloud Server</Text>
            <Text style={styles.warmUpSubtitle}>
              Render free tier spins up on the first visit (~40s). Your question bank is loading!
            </Text>

            <View style={styles.spinnerContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>

            {/* Rotating Motivational Quote */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>💡 {MOTIVATIONAL_QUOTES[quoteIndex]}</Text>
            </View>

            <Text style={styles.warmUpFootnote}>
              Connecting to 2,387 questions & mock simulators...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#818cf8',
  },
  carousel: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#131d33',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  badgeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  largeIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 14,
  },
  description: {
    fontSize: 14.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pillText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 26,
    backgroundColor: '#6366f1',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#334155',
  },
  actionButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4f46e5',
  },
  getStartedButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  warmUpCard: {
    width: '100%',
    backgroundColor: '#131d33',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 28,
    alignItems: 'center',
  },
  warmUpIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  warmUpTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  warmUpSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  spinnerContainer: {
    marginVertical: 12,
  },
  quoteBox: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginTop: 10,
    marginBottom: 14,
  },
  quoteText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  warmUpFootnote: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
});
