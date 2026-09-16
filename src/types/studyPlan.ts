export type StudyPlanItemType =
  | 'REVISION'
  | 'WEAK_TOPIC'
  | 'RECOMMENDED'
  | 'BALANCED_PRACTICE'
  | 'MINI_MOCK';

export type StudyPlanStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface StudyPlanItem {
  id: string;
  type: StudyPlanItemType;
  title: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  completedCount: number;
  remainingCount: number;
  completed: boolean;
}

export interface DailyStudyPlanSummary {
  date: string;
  goalQuestions: number;
  completedQuestions: number;
  remainingQuestions: number;
  progressPercent: number;
  estimatedMinutes: number;
  status: StudyPlanStatus;
  items: StudyPlanItem[];
}

export interface StartDailyPlanResponse {
  plan: {
    id: string;
    dateKey: string;
    goalQuestions: number;
    completedQuestions: number;
    status: StudyPlanStatus;
    estimatedMinutes: number;
    items: StudyPlanItem[];
  };
  nextItem: StudyPlanItem | null;
}

export interface CompletePlanItemResponse {
  plan: {
    id: string;
    dateKey: string;
    goalQuestions: number;
    completedQuestions: number;
    status: StudyPlanStatus;
    estimatedMinutes: number;
    items: StudyPlanItem[];
  };
  updatedItem: StudyPlanItem;
  nextItem: StudyPlanItem | null;
}
