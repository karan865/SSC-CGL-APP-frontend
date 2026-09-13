import { mockTestApi } from '../src/services/api/mockTestApi';
import { ApiError } from '../src/services/api/apiClient';
import {
  MockStartResponse,
  MockSaveAnswerResponse,
  MockScoreSummary,
  MockReviewResponse,
} from '../src/types/mockTest';

describe('mockTestApi Service', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('startMockTest returns 100 questions and 4 sections on success', async () => {
    const mockStartResponse: MockStartResponse = {
      sessionId: 'sess-1234',
      testType: 'TIER_1',
      totalQuestions: 100,
      totalDurationMinutes: 60,
      currentSectionIndex: 0,
      sections: [
        {
          sectionIndex: 0,
          subjectSlug: 'reasoning',
          name: 'General Intelligence & Reasoning',
          durationMinutes: 15,
          questionCount: 25,
          startedAt: '2026-09-06T00:00:00.000Z',
          expiresAt: '2026-09-06T00:15:00.000Z',
          isLocked: false,
        },
      ],
      questions: [
        {
          _id: 'q1',
          sectionIndex: 0,
          subjectSlug: 'reasoning',
          topicId: 't1',
          questionText: 'Which word is the odd one out?',
          optionA: 'Apple',
          optionB: 'Banana',
          optionC: 'Carrot',
          optionD: 'Mango',
          difficulty: 'Easy',
        },
      ],
    };

    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Mock test started',
        data: mockStartResponse,
      }),
    } as unknown as Response);

    const res = await mockTestApi.startMockTest('TIER_1');
    expect(res.sessionId).toBe('sess-1234');
    expect(res.totalQuestions).toBe(100);
    expect(res.totalDurationMinutes).toBe(60);
    expect(res.sections).toHaveLength(1);
    expect(res.questions[0].questionText).toBe('Which word is the odd one out?');
  });

  it('saveAnswer saves option and review flag', async () => {
    const mockAnswerRes: MockSaveAnswerResponse = {
      success: true,
      sessionId: 'sess-1234',
      questionId: 'q1',
      selectedAnswer: 'B',
      isMarkedForReview: true,
    };

    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Answer saved',
        data: mockAnswerRes,
      }),
    } as unknown as Response);

    const res = await mockTestApi.saveAnswer({
      sessionId: 'sess-1234',
      questionId: 'q1',
      selectedAnswer: 'B',
      isMarkedForReview: true,
    });

    expect(res.selectedAnswer).toBe('B');
    expect(res.isMarkedForReview).toBe(true);
  });

  it('advanceSection advances to next section', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Advanced section',
        data: {
          success: true,
          sessionId: 'sess-1234',
          currentSectionIndex: 1,
          isFinalSection: false,
          sections: [{ sectionIndex: 0, name: 'Reasoning', isLocked: true }],
        },
      }),
    } as unknown as Response);

    const res = await mockTestApi.advanceSection('sess-1234', 0);
    expect(res.currentSectionIndex).toBe(1);
    expect(res.sections[0].isLocked).toBe(true);
  });

  it('submitMockTest returns official score summary with +2 / -0.50 rules', async () => {
    const mockScore: MockScoreSummary = {
      totalQuestions: 100,
      maxMarks: 200,
      totalScore: 134,
      totalCorrect: 72,
      totalWrong: 20,
      totalUnanswered: 8,
      accuracy: 78.3,
      sectionResults: [
        {
          sectionIndex: 0,
          subjectSlug: 'reasoning',
          name: 'General Intelligence & Reasoning',
          totalQuestions: 25,
          correct: 20,
          wrong: 4,
          unanswered: 1,
          marks: 38,
          accuracy: 83.3,
        },
      ],
    };

    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Mock test submitted',
        data: mockScore,
      }),
    } as unknown as Response);

    const res = await mockTestApi.submitMockTest('sess-1234');
    expect(res.maxMarks).toBe(200);
    expect(res.totalScore).toBe(134);
    expect(res.totalCorrect).toBe(72);
    expect(res.totalWrong).toBe(20);
    expect(res.sectionResults).toHaveLength(1);
  });

  it('getMockReview returns review questions with answers and explanations', async () => {
    const mockReview: MockReviewResponse = {
      sessionId: 'sess-1234',
      scoreSummary: {
        totalQuestions: 100,
        maxMarks: 200,
        totalScore: 134,
        totalCorrect: 72,
        totalWrong: 20,
        totalUnanswered: 8,
        accuracy: 78.3,
        sectionResults: [],
      },
      questions: [
        {
          questionId: 'q1',
          sectionIndex: 0,
          subjectSlug: 'reasoning',
          topicId: 't1',
          questionText: 'Odd one out question',
          optionA: 'Apple',
          optionB: 'Banana',
          optionC: 'Carrot',
          optionD: 'Mango',
          difficulty: 'Easy',
          userSelectedAnswer: 'B',
          correctAnswer: 'C',
          isCorrect: false,
          isMarkedForReview: true,
          marksAwarded: -0.5,
          explanation: 'Carrot is a root vegetable whereas the others are fruits.',
        },
      ],
    };

    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Review fetched',
        data: mockReview,
      }),
    } as unknown as Response);

    const res = await mockTestApi.getMockReview('sess-1234');
    expect(res.questions).toHaveLength(1);
    expect(res.questions[0].correctAnswer).toBe('C');
    expect(res.questions[0].marksAwarded).toBe(-0.5);
    expect(res.questions[0].explanation).toContain('Carrot is a root vegetable');
  });

  it('getMarkedQuestions returns list of questions marked for review', async () => {
    const mockMarked = {
      sessionId: 'sess-1234',
      totalMarked: 1,
      questions: [
        {
          questionId: 'q1',
          sectionIndex: 0,
          subjectSlug: 'reasoning',
          topicId: 't1',
          questionText: 'Odd one out question',
          optionA: 'Apple',
          optionB: 'Banana',
          optionC: 'Carrot',
          optionD: 'Mango',
          difficulty: 'Easy',
          userSelectedAnswer: 'B',
          correctAnswer: 'C',
          isCorrect: false,
          isMarkedForReview: true,
          marksAwarded: -0.5,
          explanation: 'Carrot is a root vegetable.',
        },
      ],
    };

    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Marked questions retrieved',
        data: mockMarked,
      }),
    } as unknown as Response);

    const res = await mockTestApi.getMarkedQuestions();
    expect(res.totalMarked).toBe(1);
    expect(res.questions[0].isMarkedForReview).toBe(true);
    expect(res.questions[0].explanation).toContain('Carrot is a root vegetable');
  });

  it('throws ApiError on server error', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: 'Mock test session not found',
      }),
    } as unknown as Response);

    await expect(mockTestApi.startMockTest('TIER_1')).rejects.toThrow(ApiError);
  });
});
