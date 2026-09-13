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
   * Calls: GET /api/revision
   */
  getRevisionSummary: async (): Promise<RevisionSummary> => {
    return apiClient.get<RevisionSummary>('/revision');
  },

  /**
   * Starts a revision session.
   * Calls: POST /api/revision/start
   */
  startRevisionSession: async (limit: number = 10): Promise<RevisionStartResponse> => {
    return apiClient.post<RevisionStartResponse>('/revision/start', { limit });
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
   * Calls: GET /api/revision/stats
   */
  getRevisionStats: async (): Promise<RevisionStats> => {
    return apiClient.get<RevisionStats>('/revision/stats');
  },
};
