import { apiClient } from './apiClient';
import { Subject } from '../../types/subject';
import { Topic } from '../../types/topic';

export const subjectApi = {
  /**
   * Fetches subjects strictly scoped to a specific exam and optionally stage/paper.
   * Calls: GET /api/subjects?examSlug=<slug>&stageSlug=<slug>
   */
  getSubjects: async (
    examSlug?: string,
    stageSlug?: string,
    paperSlug?: string
  ): Promise<Subject[]> => {
    const queryParts: string[] = [];
    if (examSlug) {
      queryParts.push(`examSlug=${encodeURIComponent(examSlug)}`);
      queryParts.push(`examId=${encodeURIComponent(examSlug)}`);
    }
    if (stageSlug && stageSlug !== 'all') {
      queryParts.push(`stageSlug=${encodeURIComponent(stageSlug)}`);
    }
    if (paperSlug && paperSlug !== 'all') {
      queryParts.push(`paperSlug=${encodeURIComponent(paperSlug)}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiClient.get<Subject[]>(`/subjects${queryString}`);
  },

  /**
   * Fetches active topics for a specific subject, optionally scoped by exam.
   * Calls: GET /api/subjects/:subjectId/topics?examSlug=<slug>
   */
  getTopics: async (subjectId: string, examSlug?: string): Promise<Topic[]> => {
    const queryParts: string[] = [];
    if (examSlug) {
      queryParts.push(`examSlug=${encodeURIComponent(examSlug)}`);
      queryParts.push(`examId=${encodeURIComponent(examSlug)}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiClient.get<Topic[]>(`/subjects/${subjectId}/topics${queryString}`);
  },
};
