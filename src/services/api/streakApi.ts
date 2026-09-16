import { apiClient } from './apiClient';
import { StudyStreakSummary } from '../../types/streak';

export const streakApi = {
  /**
   * Fetches current study streak metrics and today's completion state.
   * Calls: GET /api/streak
   */
  getStudyStreak: async (): Promise<StudyStreakSummary> => {
    return apiClient.get<StudyStreakSummary>('/streak');
  },

  /**
   * Records completion of today's study plan daily goal.
   * Idempotent: Can safely be called on plan completion.
   * Calls: POST /api/streak/complete
   */
  completeDailyGoal: async (): Promise<StudyStreakSummary> => {
    return apiClient.post<StudyStreakSummary>('/streak/complete');
  },
};
