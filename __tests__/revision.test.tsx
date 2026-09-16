import React from 'react';
import { revisionApi } from '../src/services/api/revisionApi';
import { RevisionSummary, RevisionStats, RevisionStartResponse, RevisionAnswerResponse } from '../src/types/revision';

describe('Revision API & Spaced Repetition Suite', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('revisionApi', () => {
    it('fetches revision summary successfully', async () => {
      const mockSummary: RevisionSummary = {
        dueCount: 4,
        criticalCount: 2,
        topicCount: 2,
        lastRevisionAt: '2026-09-06T10:00:00.000Z',
        hasRevision: true,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockSummary,
        }),
      });

      const summary = await revisionApi.getRevisionSummary();
      expect(summary.dueCount).toBe(4);
      expect(summary.criticalCount).toBe(2);
      expect(summary.hasRevision).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/revision'),
        expect.any(Object)
      );
    });

    it('starts revision session with requested limit', async () => {
      const mockSession: RevisionStartResponse = {
        totalQuestions: 2,
        questions: [
          {
            _id: 'q1',
            subjectId: 's1',
            topicId: 't1',
            questionText: 'What is 10% of 200?',
            optionA: '10',
            optionB: '20',
            optionC: '30',
            optionD: '40',
            difficulty: 'Easy',
            revisionLevel: 1,
            nextRevisionAt: '2026-09-06T00:00:00.000Z',
            wrongRevisionAttempts: 1,
          },
        ],
        revisionInfo: {
          dueCount: 2,
          selectedCount: 2,
        },
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockSession,
        }),
      });

      const session = await revisionApi.startRevisionSession(5);
      expect(session.totalQuestions).toBe(2);
      expect(session.questions.length).toBe(1);
      expect(session.questions[0].revisionLevel).toBe(1);
    });

    it('submits revision answer and updates schedule', async () => {
      const mockAnswerResp: RevisionAnswerResponse = {
        isCorrect: true,
        selectedAnswer: 'B',
        correctAnswer: 'B',
        marks: 1,
        explanation: '10% of 200 is (10/100)*200 = 20.',
        revision: {
          revisionLevel: 2,
          nextRevisionAt: '2026-09-09T00:00:00.000Z',
          status: 'SCHEDULED',
        },
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAnswerResp,
        }),
      });

      const result = await revisionApi.submitRevisionAnswer('q1', 'B');
      expect(result.isCorrect).toBe(true);
      expect(result.revision.revisionLevel).toBe(2);
      expect(result.revision.status).toBe('SCHEDULED');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/revision/answer'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ questionId: 'q1', selectedAnswer: 'B' }),
        })
      );
    });

    it('retrieves revision stats for performance dashboard', async () => {
      const mockStats: RevisionStats = {
        dueToday: 3,
        mastered: 15,
        inRevision: 8,
        totalMistakes: 23,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockStats,
        }),
      });

      const stats = await revisionApi.getRevisionStats();
      expect(stats.dueToday).toBe(3);
      expect(stats.mastered).toBe(15);
      expect(stats.inRevision).toBe(8);
      expect(stats.totalMistakes).toBe(23);
    });
  });
});
