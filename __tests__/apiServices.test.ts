import { subjectApi } from '../src/services/api/subjectApi';
import { practiceApi } from '../src/services/api/practiceApi';
import { ApiError } from '../src/services/api/apiClient';

describe('API Services', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('subjectApi', () => {
    it('getSubjects returns subjects on success', async () => {
      const mockSubjects = [
        { _id: '1', name: 'Quantitative Aptitude', slug: 'quant', order: 1, isActive: true },
      ];

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Subjects fetched',
          data: mockSubjects,
        }),
      } as unknown as Response);

      const result = await subjectApi.getSubjects();
      expect(result).toEqual(mockSubjects);
    });

    it('getTopics returns topics for subject', async () => {
      const mockTopics = [
        { _id: '10', subjectId: '1', name: 'Percentage', slug: 'percentage', order: 1, isActive: true },
      ];

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Topics fetched',
          data: mockTopics,
        }),
      } as unknown as Response);

      const result = await subjectApi.getTopics('1');
      expect(result).toEqual(mockTopics);
    });

    it('throws ApiError on server failure', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: 'Server internal error',
        }),
      } as unknown as Response);

      await expect(subjectApi.getSubjects()).rejects.toThrow(ApiError);
    });
  });

  describe('practiceApi', () => {
    it('startPractice returns practice test response', async () => {
      const mockPracticeResponse = {
        totalQuestions: 25,
        questions: [
          {
            _id: 'q1',
            subjectId: 's1',
            topicId: 't1',
            questionText: 'What is 10% of 100?',
            optionA: '10',
            optionB: '20',
            optionC: '30',
            optionD: '40',
            difficulty: 'Easy' as const,
          },
        ],
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Test started',
          data: mockPracticeResponse,
        }),
      } as unknown as Response);

      const result = await practiceApi.startPractice({
        subjectId: 's1',
        topicId: 't1',
        difficulty: 'Easy',
      });

      expect(result.totalQuestions).toBe(25);
      expect(result.questions).toHaveLength(1);
    });

    it('answerQuestion returns answer validation result', async () => {
      const mockAnswerResult = {
        isCorrect: true,
        selectedAnswer: 'A' as const,
        correctAnswer: 'A' as const,
        marks: 1,
        explanation: '10% of 100 is 10',
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Answer evaluated',
          data: mockAnswerResult,
        }),
      } as unknown as Response);

      const result = await practiceApi.answerQuestion({
        questionId: 'q1',
        selectedAnswer: 'A',
      });

      expect(result.isCorrect).toBe(true);
      expect(result.marks).toBe(1);
    });

    it('markQuestion sends mark state and returns response', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Question marked status updated',
          data: { questionId: 'q1', isMarked: true, userSelectedAnswer: 'B' },
        }),
      } as unknown as Response);

      const result = await practiceApi.markQuestion({
        questionId: 'q1',
        userSelectedAnswer: 'B',
        isMarked: true,
      });

      expect(result.isMarked).toBe(true);
      expect(result.questionId).toBe('q1');
    });
  });
});
