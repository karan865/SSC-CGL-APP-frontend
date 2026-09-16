import { apiClient } from './apiClient';
import {
  MockStartResponse,
  MockSaveAnswerParams,
  MockSaveAnswerResponse,
  MockAdvanceSectionResponse,
  MockScoreSummary,
  MockReviewResponse,
  MockMarkedQuestionsResponse,
} from '../../types/mockTest';

export const mockTestApi = {
  /**
   * Starts an official Mock Test session with 100 questions.
   * Calls: POST /api/mock-tests/start
   */
  startMockTest: async (
    params?:
      | {
          testType?: string;
          examId?: string;
          stageId?: string;
          paperId?: string;
        }
      | string
  ): Promise<MockStartResponse> => {
    const payload =
      typeof params === 'string'
        ? { testType: params }
        : params || { testType: 'TIER_1' };
    return apiClient.post<MockStartResponse>('/mock-tests/start', payload);
  },

  /**
   * Saves or updates the candidate's selected answer or review flag.
   * Calls: POST /api/mock-tests/:sessionId/answer
   */
  saveAnswer: async (params: MockSaveAnswerParams): Promise<MockSaveAnswerResponse> => {
    return apiClient.post<MockSaveAnswerResponse>(
      `/mock-tests/${params.sessionId}/answer`,
      {
        questionId: params.questionId,
        selectedAnswer: params.selectedAnswer,
        isMarkedForReview: params.isMarkedForReview,
      }
    );
  },

  /**
   * Locks the current section and advances to the next section.
   * Calls: POST /api/mock-tests/:sessionId/section-lock
   */
  advanceSection: async (
    sessionId: string,
    currentSectionIndex: number
  ): Promise<MockAdvanceSectionResponse> => {
    return apiClient.post<MockAdvanceSectionResponse>(
      `/mock-tests/${sessionId}/section-lock`,
      { currentSectionIndex }
    );
  },

  /**
   * Submits the full mock test and computes official Tier-1 scoring (+2 / -0.50).
   * Calls: POST /api/mock-tests/:sessionId/submit
   */
  submitMockTest: async (sessionId: string): Promise<MockScoreSummary> => {
    return apiClient.post<MockScoreSummary>(`/mock-tests/${sessionId}/submit`, {});
  },

  /**
   * Retrieves full post-test review with solutions and explanations.
   * Calls: GET /api/mock-tests/:sessionId/review
   */
  getMockReview: async (sessionId: string): Promise<MockReviewResponse> => {
    return apiClient.get<MockReviewResponse>(`/mock-tests/${sessionId}/review`);
  },

  /**
   * Retrieves all marked for review questions (always fresh).
   * Calls: GET /api/mock-tests/marked-questions
   */
  getMarkedQuestions: async (sessionId?: string, examSlug?: string): Promise<MockMarkedQuestionsResponse> => {
    const params = [
      sessionId ? `sessionId=${encodeURIComponent(sessionId)}` : '',
      examSlug ? `examId=${encodeURIComponent(examSlug)}` : '',
      `_t=${Date.now()}`,
    ]
      .filter(Boolean)
      .join('&');
    return apiClient.get<MockMarkedQuestionsResponse>(`/mock-tests/marked-questions?${params}`);
  },
};

