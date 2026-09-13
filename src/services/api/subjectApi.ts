import { apiClient } from './apiClient';
import { Subject } from '../../types/subject';
import { Topic } from '../../types/topic';

export const subjectApi = {
  /**
   * Fetches all active subjects.
   * Calls: GET /api/subjects
   */
  getSubjects: async (): Promise<Subject[]> => {
    return apiClient.get<Subject[]>('/subjects');
  },

  /**
   * Fetches active topics for a specific subject.
   * Calls: GET /api/subjects/:subjectId/topics
   */
  getTopics: async (subjectId: string): Promise<Topic[]> => {
    return apiClient.get<Topic[]>(`/subjects/${subjectId}/topics`);
  },
};
