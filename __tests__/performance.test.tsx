import React from 'react';
import { performanceApi } from '../src/services/api/performanceApi';
import { UserPerformanceSummary, PracticeRecommendation, TopicPerformanceMetric } from '../src/types/performance';

describe('Performance API & State Tracking', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('performanceApi', () => {
    const mockPerformanceSummary: UserPerformanceSummary = {
      userId: 'test-guest-123',
      totalQuestions: 50,
      totalAttempted: 45,
      totalCorrect: 32,
      totalWrong: 13,
      overallAccuracy: 71,
      totalMarks: 32,
      subjects: [
        {
          subjectId: 's1',
          subjectName: 'Quantitative Aptitude',
          subjectSlug: 'quant',
          attempted: 25,
          correct: 18,
          wrong: 7,
          accuracy: 72,
          totalMarks: 18,
          averageMarks: 0.72,
        },
      ],
      topics: [
        {
          topicId: 't1',
          topicName: 'Percentage',
          topicSlug: 'percentage',
          subjectId: 's1',
          subjectName: 'Quantitative Aptitude',
          subjectSlug: 'quant',
          attempted: 20,
          correct: 10,
          wrong: 10,
          accuracy: 50,
          lastAttempted: new Date().toISOString(),
          status: 'NEEDS_PRACTICE',
          priorityScore: 66,
          difficultyBreakdown: {
            Easy: { attempted: 10, correct: 8, accuracy: 80 },
            Medium: { attempted: 10, correct: 2, accuracy: 20 },
            Hard: { attempted: 0, correct: 0, accuracy: 0 },
          },
        },
      ],
      weakTopics: [],
      difficulty: {
        Easy: { attempted: 20, correct: 16, wrong: 4, accuracy: 80 },
        Medium: { attempted: 20, correct: 12, wrong: 8, accuracy: 60 },
        Hard: { attempted: 5, correct: 4, wrong: 1, accuracy: 80 },
      },
      hasEnoughData: true,
    };

    it('getPerformanceSummary returns summary on success', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Performance summary retrieved successfully',
          data: mockPerformanceSummary,
        }),
      } as unknown as Response);

      const result = await performanceApi.getPerformanceSummary();
      expect(result).toEqual(mockPerformanceSummary);
      expect(result.overallAccuracy).toBe(71);
      expect(result.totalAttempted).toBe(45);
      expect(result.subjects).toHaveLength(1);
    });

    it('getRecommendations returns prioritized recommendations', async () => {
      const mockRecommendation: PracticeRecommendation = {
        topicId: 't1',
        topicName: 'Percentage',
        subjectId: 's1',
        subjectName: 'Quantitative Aptitude',
        difficulty: 'Medium',
        questionCount: 10,
        reason: 'Your accuracy in Percentage is 50% (Needs Practice).',
        status: 'NEEDS_PRACTICE',
        currentAccuracy: 50,
        attemptsCount: 20,
        availableQuestions: 25,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Recommendations generated successfully',
          data: mockRecommendation,
        }),
      } as unknown as Response);

      const result = await performanceApi.getRecommendations();
      expect(result).toEqual(mockRecommendation);
      expect(result.topicName).toBe('Percentage');
      expect(result.difficulty).toBe('Medium');
      expect(result.questionCount).toBe(10);
    });

    it('getTopicPerformance returns single topic performance metric', async () => {
      const mockTopicMetric: TopicPerformanceMetric = {
        topicId: 't1',
        topicName: 'Percentage',
        topicSlug: 'percentage',
        subjectId: 's1',
        subjectName: 'Quantitative Aptitude',
        subjectSlug: 'quant',
        attempted: 15,
        correct: 6,
        wrong: 9,
        accuracy: 40,
        lastAttempted: new Date().toISOString(),
        status: 'CRITICAL',
        priorityScore: 72,
        difficultyBreakdown: {
          Easy: { attempted: 5, correct: 3, accuracy: 60 },
          Medium: { attempted: 10, correct: 3, accuracy: 30 },
          Hard: { attempted: 0, correct: 0, accuracy: 0 },
        },
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Topic performance retrieved',
          data: mockTopicMetric,
        }),
      } as unknown as Response);

      const result = await performanceApi.getTopicPerformance('t1');
      expect(result).not.toBeNull();
      expect(result?.topicName).toBe('Percentage');
      expect(result?.status).toBe('CRITICAL');
      expect(result?.accuracy).toBe(40);
    });

    it('handles empty / new student performance summary without crashing', async () => {
      const emptySummary: UserPerformanceSummary = {
        userId: 'new-guest',
        totalQuestions: 0,
        totalAttempted: 0,
        totalCorrect: 0,
        totalWrong: 0,
        overallAccuracy: 0,
        totalMarks: 0,
        subjects: [],
        topics: [],
        weakTopics: [],
        difficulty: {
          Easy: { attempted: 0, correct: 0, wrong: 0, accuracy: 0 },
          Medium: { attempted: 0, correct: 0, wrong: 0, accuracy: 0 },
          Hard: { attempted: 0, correct: 0, wrong: 0, accuracy: 0 },
        },
        hasEnoughData: false,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Performance summary retrieved successfully',
          data: emptySummary,
        }),
      } as unknown as Response);

      const result = await performanceApi.getPerformanceSummary();
      expect(result.totalAttempted).toBe(0);
      expect(result.topics).toEqual([]);
    });
  });
});
