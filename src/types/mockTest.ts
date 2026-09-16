export type MockOptionChoice = 'A' | 'B' | 'C' | 'D';

export interface MockQuestion {
  _id: string;
  sectionIndex: number;
  subjectSlug: string;
  topicId: string;
  questionText: string;
  questionText_hi?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionA_hi?: string;
  optionB_hi?: string;
  optionC_hi?: string;
  optionD_hi?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface MockSectionConfig {
  sectionIndex: number;
  subjectSlug: string;
  name: string;
  durationMinutes: number;
  questionCount: number;
  startedAt: string;
  expiresAt: string;
  isLocked: boolean;
}

export interface MockStartResponse {
  sessionId: string;
  testType: 'TIER_1' | string;
  examSlug?: string;
  paperSlug?: string;
  examTitle?: string;
  totalQuestions: number;
  totalDurationMinutes: number;
  currentSectionIndex: number;
  scoringConfig?: {
    correctMarks: number;
    wrongMarks: number;
    unansweredMarks: number;
  };
  sections: MockSectionConfig[];
  questions: MockQuestion[];
}

export interface MockSaveAnswerParams {
  sessionId: string;
  questionId: string;
  selectedAnswer: MockOptionChoice | null;
  isMarkedForReview: boolean;
}

export interface MockSaveAnswerResponse {
  success: boolean;
  sessionId: string;
  questionId: string;
  selectedAnswer: MockOptionChoice | null;
  isMarkedForReview: boolean;
}

export interface MockAdvanceSectionResponse {
  success: boolean;
  sessionId: string;
  currentSectionIndex: number;
  isFinalSection: boolean;
  sections: {
    sectionIndex: number;
    name: string;
    isLocked: boolean;
  }[];
}

export interface MockSectionResult {
  sectionIndex: number;
  subjectSlug: string;
  name: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  marks: number;
  accuracy: number;
}

export interface MockScoreSummary {
  totalQuestions: number;
  maxMarks: number;
  totalScore: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  accuracy: number;
  sectionResults: MockSectionResult[];
}

export interface MockReviewQuestion {
  questionId: string;
  sectionIndex: number;
  subjectSlug: string;
  topicId: string;
  questionText: string;
  questionText_hi?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionA_hi?: string;
  optionB_hi?: string;
  optionC_hi?: string;
  optionD_hi?: string;
  difficulty: string;
  userSelectedAnswer: MockOptionChoice | null;
  correctAnswer: MockOptionChoice;
  isCorrect: boolean;
  isMarkedForReview: boolean;
  marksAwarded: number;
  explanation: string;
  explanation_hi?: string;
}

export interface MockReviewResponse {
  sessionId: string;
  scoreSummary: MockScoreSummary;
  questions: MockReviewQuestion[];
}

export interface MockMarkedQuestionsResponse {
  sessionId: string;
  totalMarked: number;
  questions: MockReviewQuestion[];
}

export interface LocalAnswerState {
  selectedAnswer: MockOptionChoice | null;
  isMarkedForReview: boolean;
}

