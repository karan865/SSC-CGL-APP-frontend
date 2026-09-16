import { apiClient } from './apiClient';
import {
  RevisionSummary,
  RevisionStats,
  RevisionStartResponse,
  RevisionAnswerResponse,
} from '../../types/revision';
import { OptionChoice } from '../../types/question';

export const revisionApi = {
  /**
   * Fetches compact revision summary for home screen cards.
   * Calls: GET /api/revision?examId=<slug>
   */
  getRevisionSummary: async (examSlug?: string): Promise<RevisionSummary> => {
    const params = examSlug ? `?examId=${encodeURIComponent(examSlug)}` : '';
    return apiClient.get<RevisionSummary>(`/revision${params}`);
  },

  /**
   * Starts a revision session.
   * Calls: POST /api/revision/start
   */
  startRevisionSession: async (limit: number = 10, examSlug?: string): Promise<RevisionStartResponse> => {
    return apiClient.post<RevisionStartResponse>('/revision/start', {
      limit,
      ...(examSlug ? { examId: examSlug } : {}),
    });
  },

  /**
   * Submits a revision question answer and advances or resets spaced repetition schedule.
   * Calls: POST /api/revision/answer
   */
  submitRevisionAnswer: async (
    questionId: string,
    selectedAnswer: OptionChoice
  ): Promise<RevisionAnswerResponse> => {
    return apiClient.post<RevisionAnswerResponse>('/revision/answer', {
      questionId,
      selectedAnswer,
    });
  },

  /**
   * Retrieves overall revision progress statistics.
   * Calls: GET /api/revision/stats?examId=<slug>
   */
  getRevisionStats: async (examSlug?: string): Promise<RevisionStats> => {
    const params = examSlug ? `?examId=${encodeURIComponent(examSlug)}` : '';
    return apiClient.get<RevisionStats>(`/revision/stats${params}`);
  },
};
