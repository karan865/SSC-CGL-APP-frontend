import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'both' | 'en' | 'hi';

const STORAGE_KEY = '@preferred_language';

interface LanguageContextValue {
  language: SupportedLanguage;
  isHindi: boolean;
  isBoth: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  toggleLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('both');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'both' || stored === 'en' || stored === 'hi') {
          setLanguageState(stored as SupportedLanguage);
        } else {
          setLanguageState('both');
        }
      } catch {
        setLanguageState('both');
      }
    })();
  }, []);

  const setLanguage = useCallback(async (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Storage error is non-fatal
    }
  }, []);

  const toggleLanguage = useCallback(async () => {
    const nextLang: SupportedLanguage =
      language === 'both' ? 'en' : language === 'en' ? 'hi' : 'both';
    await setLanguage(nextLang);
  }, [language, setLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        isHindi: language === 'hi',
        isBoth: language === 'both',
        setLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
