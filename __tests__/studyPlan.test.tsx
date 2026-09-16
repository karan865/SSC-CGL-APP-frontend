import { studyPlanApi } from '../src/services/api/studyPlanApi';
import {
  DailyStudyPlanSummary,
  StartDailyPlanResponse,
  CompletePlanItemResponse,
} from '../src/types/studyPlan';

describe('Daily Smart Study Plan Suite', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('studyPlanApi', () => {
    it('fetches today study plan successfully', async () => {
      const mockPlan: DailyStudyPlanSummary = {
        date: '2026-09-06',
        goalQuestions: 35,
        completedQuestions: 10,
        remainingQuestions: 25,
        progressPercent: 29,
        estimatedMinutes: 30,
        status: 'IN_PROGRESS',
        items: [
          {
            id: 'item1',
            type: 'REVISION',
            title: "Today's Revision",
            questionCount: 10,
            completedCount: 5,
            remainingCount: 5,
            completed: false,
          },
          {
            id: 'item2',
            type: 'WEAK_TOPIC',
            title: 'Percentage',
            questionCount: 10,
            completedCount: 5,
            remainingCount: 5,
            completed: false,
          },
        ],
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPlan,
        }),
      });

      const plan = await studyPlanApi.getTodayStudyPlan();
      expect(plan.goalQuestions).toBe(35);
      expect(plan.completedQuestions).toBe(10);
      expect(plan.remainingQuestions).toBe(25);
      expect(plan.status).toBe('IN_PROGRESS');
      expect(plan.items.length).toBe(2);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/study-plan/today'),
        expect.any(Object)
      );
    });

    it('generates study plan with custom goal questions', async () => {
      const mockGenerated = {
        id: 'plan123',
        goalQuestions: 50,
        status: 'NOT_STARTED',
        items: [],
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockGenerated,
        }),
      });

      const result = await studyPlanApi.generateStudyPlan(50, true);
      expect(result.goalQuestions).toBe(50);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/study-plan/generate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ goalQuestions: 50, forceRegenerate: true }),
        })
      );
    });

    it('starts today study plan and receives next item', async () => {
      const mockStartResp: StartDailyPlanResponse = {
        plan: {
          id: 'plan1',
          dateKey: '2026-09-06',
          goalQuestions: 35,
          completedQuestions: 0,
          status: 'IN_PROGRESS',
          estimatedMinutes: 30,
          items: [
            {
              id: 'it1',
              type: 'REVISION',
              title: "Today's Revision",
              questionCount: 10,
              completedCount: 0,
              remainingCount: 10,
              completed: false,
            },
          ],
        },
        nextItem: {
          id: 'it1',
          type: 'REVISION',
          title: "Today's Revision",
          questionCount: 10,
          completedCount: 0,
          remainingCount: 10,
          completed: false,
        },
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockStartResp,
        }),
      });

      const startData = await studyPlanApi.startStudyPlan();
      expect(startData.plan.status).toBe('IN_PROGRESS');
      expect(startData.nextItem).not.toBeNull();
      expect(startData.nextItem?.id).toBe('it1');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/study-plan/start'),
        expect.any(Object)
      );
    });

    it('completes plan item questions and updates progress', async () => {
      const mockCompleteResp: CompletePlanItemResponse = {
        plan: {
          id: 'plan1',
          dateKey: '2026-09-06',
          goalQuestions: 20,
          completedQuestions: 10,
          status: 'IN_PROGRESS',
          estimatedMinutes: 20,
          items: [],
        },
        updatedItem: {
          id: 'item1',
          type: 'WEAK_TOPIC',
          title: 'Ratio & Proportion',
          questionCount: 10,
          completedCount: 10,
          remainingCount: 0,
          completed: true,
        },
        nextItem: null,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockCompleteResp,
        }),
      });

      const res = await studyPlanApi.completeStudyPlanItem('item1', 10);
      expect(res.updatedItem.completed).toBe(true);
      expect(res.updatedItem.completedCount).toBe(10);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/study-plan/item/item1/complete'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ answeredCount: 10 }),
        })
      );
    });

    it('fetches study plan progress summary', async () => {
      const mockProgress: DailyStudyPlanSummary = {
        date: '2026-09-06',
        goalQuestions: 35,
        completedQuestions: 35,
        remainingQuestions: 0,
        progressPercent: 100,
        estimatedMinutes: 30,
        status: 'COMPLETED',
        items: [],
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockProgress,
        }),
      });

      const progress = await studyPlanApi.getStudyPlanProgress();
      expect(progress.status).toBe('COMPLETED');
      expect(progress.progressPercent).toBe(100);
      expect(progress.remainingQuestions).toBe(0);
    });

    it('updates daily questions goal target', async () => {
      const mockUpdated = {
        goalQuestions: 50,
        status: 'NOT_STARTED',
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdated,
        }),
      });

      const res = await studyPlanApi.updateDailyGoal(50);
      expect(res.goalQuestions).toBe(50);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/study-plan/goal'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ goalQuestions: 50 }),
        })
      );
    });
  });
});
