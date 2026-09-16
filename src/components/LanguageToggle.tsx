import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface LanguageToggleProps {
  variant?: 'dark' | 'light';
  size?: 'small' | 'default';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'dark',
  size = 'small',
}) => {
  const { language, setLanguage } = useLanguage();
  const isDark = variant === 'dark';
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        isSmall && styles.containerSmall,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setLanguage('both')}
        style={[
          styles.pill,
          isSmall && styles.pillSmall,
          language === 'both' && (isDark ? styles.pillActiveDark : styles.pillActiveLight),
        ]}
      >
        <Text
          style={[
            styles.pillText,
            isSmall && styles.pillTextSmall,
            language === 'both'
              ? (isDark ? styles.pillTextActiveDark : styles.pillTextActiveLight)
              : (isDark ? styles.pillTextInactiveDark : styles.pillTextInactiveLight),
          ]}
        >
          Both
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setLanguage('en')}
        style={[
          styles.pill,
          isSmall && styles.pillSmall,
          language === 'en' && (isDark ? styles.pillActiveDark : styles.pillActiveLight),
        ]}
      >
        <Text
          style={[
            styles.pillText,
            isSmall && styles.pillTextSmall,
            language === 'en'
              ? (isDark ? styles.pillTextActiveDark : styles.pillTextActiveLight)
              : (isDark ? styles.pillTextInactiveDark : styles.pillTextInactiveLight),
          ]}
        >
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setLanguage('hi')}
        style={[
          styles.pill,
          isSmall && styles.pillSmall,
          language === 'hi' && (isDark ? styles.pillActiveDark : styles.pillActiveLight),
        ]}
      >
        <Text
          style={[
            styles.pillText,
            isSmall && styles.pillTextSmall,
            language === 'hi'
              ? (isDark ? styles.pillTextActiveDark : styles.pillTextActiveLight)
              : (isDark ? styles.pillTextInactiveDark : styles.pillTextInactiveLight),
          ]}
        >
          HI
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 2,
  },
  containerSmall: {
    borderRadius: 16,
    padding: 2,
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  containerLight: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  pillActiveDark: {
    backgroundColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  pillActiveLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextSmall: {
    fontSize: 11,
    fontWeight: '800',
  },
  pillTextActiveDark: {
    color: '#ffffff',
  },
  pillTextActiveLight: {
    color: '#1e293b',
  },
  pillTextInactiveDark: {
    color: '#94a3b8',
  },
  pillTextInactiveLight: {
    color: '#64748b',
  },
});
