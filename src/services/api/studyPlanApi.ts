import { apiClient } from './apiClient';
import {
  DailyStudyPlanSummary,
  StartDailyPlanResponse,
  CompletePlanItemResponse,
} from '../../types/studyPlan';

export const studyPlanApi = {
  /**
   * Fetches today's active study plan and current task checklist.
   * Calls: GET /api/study-plan/today
   */
  getTodayStudyPlan: async (): Promise<DailyStudyPlanSummary> => {
    return apiClient.get<DailyStudyPlanSummary>('/study-plan/today');
  },

  /**
   * Generates or regenerates daily study plan.
   * Calls: POST /api/study-plan/generate
   */
  generateStudyPlan: async (
    goalQuestions?: number,
    forceRegenerate: boolean = false
  ): Promise<any> => {
    return apiClient.post('/study-plan/generate', {
      goalQuestions,
      forceRegenerate,
    });
  },

  /**
   * Starts or resumes today's study plan.
   * Calls: POST /api/study-plan/start
   */
  startStudyPlan: async (): Promise<StartDailyPlanResponse> => {
    return apiClient.post<StartDailyPlanResponse>('/study-plan/start');
  },

  /**
   * Records completion of questions toward a specific study plan item.
   * Calls: POST /api/study-plan/item/:itemId/complete
   */
  completeStudyPlanItem: async (
    itemId: string,
    answeredCount: number = 1
  ): Promise<CompletePlanItemResponse> => {
    return apiClient.post<CompletePlanItemResponse>(
      `/study-plan/item/${itemId}/complete`,
      { answeredCount }
    );
  },

  /**
   * Retrieves summary progress of today's study plan.
   * Calls: GET /api/study-plan/progress
   */
  getStudyPlanProgress: async (): Promise<DailyStudyPlanSummary> => {
    return apiClient.get<DailyStudyPlanSummary>('/study-plan/progress');
  },

  /**
   * Updates user daily questions goal (20, 35, 50).
   * Calls: PATCH /api/study-plan/goal
   */
  updateDailyGoal: async (goalQuestions: number): Promise<any> => {
    return apiClient.patch('/study-plan/goal', { goalQuestions });
  },
};
