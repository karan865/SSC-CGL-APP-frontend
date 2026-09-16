export type WeaknessStatus =
  | 'CRITICAL'
  | 'NEEDS_PRACTICE'
  | 'GOOD'
  | 'STRONG'
  | 'INSUFFICIENT_DATA';

export interface DifficultyMetric {
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

export interface TopicPerformanceMetric {
  topicId: string;
  topicName: string;
  topicSlug: string;
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  lastAttempted: string | null;
  status: WeaknessStatus;
  priorityScore: number;
  difficultyBreakdown: {
    Easy: { attempted: number; correct: number; accuracy: number };
    Medium: { attempted: number; correct: number; accuracy: number };
    Hard: { attempted: number; correct: number; accuracy: number };
  };
}

export interface SubjectPerformanceMetric {
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  totalMarks: number;
  averageMarks: number;
}

export interface UserPerformanceSummary {
  userId: string;
  totalQuestions: number;
  totalAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  overallAccuracy: number;
  totalMarks: number;
  subjects: SubjectPerformanceMetric[];
  topics: TopicPerformanceMetric[];
  weakTopics: TopicPerformanceMetric[];
  difficulty: {
    Easy: DifficultyMetric;
    Medium: DifficultyMetric;
    Hard: DifficultyMetric;
  };
  hasEnoughData: boolean;
}

export interface PracticeRecommendation {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  reason: string;
  status: WeaknessStatus;
  currentAccuracy: number;
  attemptsCount: number;
  availableQuestions: number;
}
