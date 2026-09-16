import { Question, AnswerResponse } from './question';

export interface RevisionSummary {
  dueCount: number;
  criticalCount: number;
  topicCount: number;
  lastRevisionAt: string | null;
  hasRevision: boolean;
}

export interface RevisionStats {
  dueToday: number;
  mastered: number;
  inRevision: number;
  totalMistakes: number;
}

export interface RevisionQuestion extends Question {
  revisionLevel: number;
  nextRevisionAt: string;
  wrongRevisionAttempts: number;
}

export interface RevisionStartResponse {
  totalQuestions: number;
  questions: RevisionQuestion[];
  revisionInfo: {
    dueCount: number;
    selectedCount: number;
  };
}

export interface RevisionAnswerResponse extends AnswerResponse {
  revision: {
    revisionLevel: number;
    nextRevisionAt: string;
    status: 'DUE' | 'SCHEDULED' | 'MASTERED';
  };
}
