import { apiClient } from './apiClient';
import {
  UserPerformanceSummary,
  PracticeRecommendation,
  TopicPerformanceMetric,
} from '../../types/performance';

export const performanceApi = {
  /**
   * Fetches overall, subject, topic, and difficulty performance analytics.
   * Calls: GET /api/performance?examId=<slug>
   */
  getPerformanceSummary: async (examSlug?: string): Promise<UserPerformanceSummary> => {
    const params = examSlug ? `?examId=${encodeURIComponent(examSlug)}` : '';
    return apiClient.get<UserPerformanceSummary>(`/performance${params}`);
  },

  /**
   * Generates targeted practice recommendation based on weak topics.
   * Calls: GET /api/performance/recommendations?examId=<slug>
   */
  getRecommendations: async (examSlug?: string): Promise<PracticeRecommendation> => {
    const params = examSlug ? `?examId=${encodeURIComponent(examSlug)}` : '';
    return apiClient.get<PracticeRecommendation>(`/performance/recommendations${params}`);
  },

  /**
   * Retrieves performance metrics for a specific topic.
   * Calls: GET /api/performance/topics/:topicId
   */
  getTopicPerformance: async (topicId: string): Promise<TopicPerformanceMetric> => {
    return apiClient.get<TopicPerformanceMetric>(`/performance/topics/${encodeURIComponent(topicId)}`);
  },
};
