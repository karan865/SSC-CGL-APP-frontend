import { apiClient } from './apiClient';
import {
  UserPerformanceSummary,
  PracticeRecommendation,
  TopicPerformanceMetric,
} from '../../types/performance';

export const performanceApi = {
  /**
   * Fetches overall, subject, topic, and difficulty performance analytics.
   * Calls: GET /api/performance
   */
  getPerformanceSummary: async (): Promise<UserPerformanceSummary> => {
    return apiClient.get<UserPerformanceSummary>('/performance');
  },

  /**
   * Generates targeted practice recommendation based on weak topics.
   * Calls: GET /api/performance/recommendations
   */
  getRecommendations: async (): Promise<PracticeRecommendation> => {
    return apiClient.get<PracticeRecommendation>('/performance/recommendations');
  },

  /**
   * Retrieves performance metrics for a specific topic.
   * Calls: GET /api/performance/topics/:topicId
   */
  getTopicPerformance: async (topicId: string): Promise<TopicPerformanceMetric> => {
    return apiClient.get<TopicPerformanceMetric>(`/performance/topics/${encodeURIComponent(topicId)}`);
  },
};
