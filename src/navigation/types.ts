import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Difficulty, TestResultData } from '../types/question';
import { MockStartResponse, MockScoreSummary } from '../types/mockTest';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  ExamSelection: undefined;
  Subjects: undefined;
  Topics: {
    subjectId: string;
    subjectName: string;
  };
  Difficulty: {
    subjectId: string;
    topicId: string;
    topicName: string;
    totalQuestions?: number;
    targetQuestions?: number;
  };
  Practice: {
    subjectId: string;
    topicId: string;
    topicName: string;
    difficulty: Difficulty;
    questionCount?: number;
    studyPlanItemId?: string;
    examId?: string;
  };
  Result: TestResultData;
  MockInstructions: { examSlug?: string; paperSlug?: string } | undefined;
  MockTest: {
    initialData: MockStartResponse;
  };
  MockResult: {
    sessionId: string;
    scoreSummary: MockScoreSummary;
    examSlug?: string;
    paperSlug?: string;
  };
  MockReview: {
    sessionId: string;
  };
  Performance: undefined;
  Revision: undefined | { initialLimit?: number };
  DailyStudyPlan: undefined;
};

export type SplashScreenProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;
export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
export type ExamSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'ExamSelection'>;
export type SubjectsScreenProps = NativeStackScreenProps<RootStackParamList, 'Subjects'>;
export type TopicsScreenProps = NativeStackScreenProps<RootStackParamList, 'Topics'>;
export type DifficultyScreenProps = NativeStackScreenProps<RootStackParamList, 'Difficulty'>;
export type PracticeScreenProps = NativeStackScreenProps<RootStackParamList, 'Practice'>;
export type ResultScreenProps = NativeStackScreenProps<RootStackParamList, 'Result'>;
export type MockInstructionsScreenProps = NativeStackScreenProps<RootStackParamList, 'MockInstructions'>;
export type MockTestScreenProps = NativeStackScreenProps<RootStackParamList, 'MockTest'>;
export type MockResultScreenProps = NativeStackScreenProps<RootStackParamList, 'MockResult'>;
export type MockReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'MockReview'>;
export type PerformanceScreenProps = NativeStackScreenProps<RootStackParamList, 'Performance'>;
export type RevisionScreenProps = NativeStackScreenProps<RootStackParamList, 'Revision'>;
export type DailyStudyPlanScreenProps = NativeStackScreenProps<RootStackParamList, 'DailyStudyPlan'>;


