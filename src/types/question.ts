export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type OptionChoice = 'A' | 'B' | 'C' | 'D';

/**
 * Question returned by /api/practice/start.
 * NOTE: For security, correctAnswer and explanation are strictly omitted.
 */
export interface Question {
  _id: string;
  subjectId: string;
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
  difficulty: Difficulty;
}

export interface SelectionInfo {
  unseenCount: number;
  reviewCount: number;
  totalEligible: number;
}

export interface PracticeStartResponse {
  totalQuestions: number;
  questions: Question[];
  selectionInfo?: SelectionInfo;
}

export interface StartPracticeParams {
  subjectId: string;
  topicId: string;
  difficulty: Difficulty;
  count?: number;
}

export interface SubmitAnswerParams {
  questionId: string;
  selectedAnswer: OptionChoice;
}

export interface AnswerResponse {
  isCorrect: boolean;
  selectedAnswer: OptionChoice;
  correctAnswer: OptionChoice;
  marks: number;
  explanation: string;
  explanation_hi?: string;
}

export interface TestResultData {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  marks: number;
  accuracy: number;
  topicName: string;
  difficulty: Difficulty;
  subjectId?: string;
  topicId?: string;
  studyPlanItemId?: string;
}
