import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExamInfo,
  AVAILABLE_EXAMS,
  DEFAULT_EXAM_SLUG,
  getExamBySlug,
} from '../types/exam';

const STORAGE_KEY = '@selected_exam_slug';

interface ExamContextValue {
  /** The currently active exam. Always defined after loading. */
  activeExam: ExamInfo;
  /** Exam slug shorthand for API calls */
  examSlug: string;
  /** Whether the persisted exam choice has been loaded from storage */
  isLoaded: boolean;
  /** Whether this is a first-time user who hasn't picked an exam yet */
  isFirstTime: boolean;
  /** Change the active exam. Persists to AsyncStorage. */
  setActiveExam: (slug: string) => Promise<void>;
  /** All available exams for the picker UI */
  availableExams: ExamInfo[];
}

const ExamContext = createContext<ExamContextValue | undefined>(undefined);

/**
 * Provides exam-awareness to the entire app.
 * All screens and API calls should read from this context.
 */
export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);

  // Load persisted exam choice on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && getExamBySlug(stored)) {
          setExamSlug(stored);
          setIsFirstTime(false);
        } else {
          // No stored exam — first time user
          setIsFirstTime(true);
        }
      } catch {
        setIsFirstTime(true);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const setActiveExam = useCallback(async (slug: string) => {
    const exam = getExamBySlug(slug);
    if (!exam) return;

    setExamSlug(slug);
    setIsFirstTime(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // Storage write failure is non-critical
    }
  }, []);

  const activeExam = getExamBySlug(examSlug) || AVAILABLE_EXAMS[0];

  return (
    <ExamContext.Provider
      value={{
        activeExam,
        examSlug,
        isLoaded,
        isFirstTime,
        setActiveExam,
        availableExams: AVAILABLE_EXAMS,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

/**
 * Hook to access the active exam context.
 * Must be used within an ExamProvider.
 */
export const useExam = (): ExamContextValue => {
  const ctx = useContext(ExamContext);
  if (!ctx) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return ctx;
};
