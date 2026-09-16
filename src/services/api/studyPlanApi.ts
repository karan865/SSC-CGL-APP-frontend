import { apiClient } from './apiClient';
import {
  DailyStudyPlanSummary,
  StartDailyPlanResponse,
  CompletePlanItemResponse,
} from '../../types/studyPlan';

export const studyPlanApi = {
  /**
   * Fetches today's active study plan and current task checklist.
   * Calls: GET /api/study-plan/today?examId=<slug>
   */
  getTodayStudyPlan: async (examSlug?: string): Promise<DailyStudyPlanSummary> => {
    const params = examSlug ? `?examId=${encodeURIComponent(examSlug)}` : '';
    return apiClient.get<DailyStudyPlanSummary>(`/study-plan/today${params}`);
  },

  /**
   * Generates or regenerates daily study plan.
   * Calls: POST /api/study-plan/generate
   */
  generateStudyPlan: async (
    goalQuestions?: number,
    forceRegenerate: boolean = false,
    examSlug?: string
  ): Promise<any> => {
    return apiClient.post('/study-plan/generate', {
      goalQuestions,
      forceRegenerate,
      ...(examSlug ? { examId: examSlug } : {}),
    });
  },

  /**
   * Starts or resumes today's study plan.
   * Calls: POST /api/study-plan/start
   */
  startStudyPlan: async (examSlug?: string): Promise<StartDailyPlanResponse> => {
    return apiClient.post<StartDailyPlanResponse>('/study-plan/start', {
      ...(examSlug ? { examId: examSlug } : {}),
    });
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
   * Calls: GET /api/study-plan/progress?examId=<slug>
   */
  getStudyPlanProgress: async (examSlug?: string): Promise<DailyStudyPlanSummary> => {
    const params = examSlug ? `?examId=${encodeURIComponent(examSlug)}` : '';
    return apiClient.get<DailyStudyPlanSummary>(`/study-plan/progress${params}`);
  },

  /**
   * Updates user daily questions goal (20, 35, 50).
   * Calls: PATCH /api/study-plan/goal
   */
  updateDailyGoal: async (goalQuestions: number, examSlug?: string): Promise<any> => {
    return apiClient.patch('/study-plan/goal', {
      goalQuestions,
      ...(examSlug ? { examId: examSlug } : {}),
    });
  },
};
