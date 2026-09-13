import { apiClient } from './apiClient';
import {
  StartPracticeParams,
  SubmitAnswerParams,
  PracticeStartResponse,
  AnswerResponse,
  OptionChoice,
} from '../../types/question';

export const practiceApi = {
  /**
   * Generates a practice test (5, 10, or 25 questions).
   * Calls: POST /api/practice/start
   * Request payload: { subjectId, topicId, difficulty, count }
   */
  startPractice: async (params: StartPracticeParams): Promise<PracticeStartResponse> => {
    return apiClient.post<PracticeStartResponse>('/practice/start', params);
  },

  /**
   * Submits an answer for a question to get validation and explanation.
   * Calls: POST /api/practice/answer
   * Request payload: { questionId, selectedAnswer }
   */
  answerQuestion: async (params: SubmitAnswerParams): Promise<AnswerResponse> => {
    return apiClient.post<AnswerResponse>('/practice/answer', params);
  },

  /**
   * Marks or unmarks a practice question for revision.
   * Calls: POST /api/practice/mark
   */
  markQuestion: async (params: {
    questionId: string;
    userSelectedAnswer?: OptionChoice | null;
    isMarked?: boolean;
  }): Promise<{ questionId: string; isMarked: boolean }> => {
    return apiClient.post('/practice/mark', params);
  },
};

