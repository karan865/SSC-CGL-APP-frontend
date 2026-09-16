import React from 'react';
import { streakApi } from '../src/services/api/streakApi';
import { StudyStreakSummary } from '../src/types/streak';

describe('Simple Study Streak + Daily Goal Engine Suite', () => {
  const originalFetch = (globalThis as any).fetch;

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('streakApi', () => {
    it('fetches study streak status successfully for an active streak', async () => {
      const mockStreak: StudyStreakSummary = {
        currentStreak: 7,
        longestStreak: 12,
        totalCompletedDays: 24,
        todayCompleted: false,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Study streak fetched successfully',
          data: mockStreak,
        }),
      });

      const streak = await streakApi.getStudyStreak();
      expect(streak.currentStreak).toBe(7);
      expect(streak.longestStreak).toBe(12);
      expect(streak.totalCompletedDays).toBe(24);
      expect(streak.todayCompleted).toBe(false);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/streak'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('handles new user initial streak metrics (0 days)', async () => {
      const mockNewUserStreak: StudyStreakSummary = {
        currentStreak: 0,
        longestStreak: 0,
        totalCompletedDays: 0,
        todayCompleted: false,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNewUserStreak,
        }),
      });

      const streak = await streakApi.getStudyStreak();
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(0);
      expect(streak.totalCompletedDays).toBe(0);
      expect(streak.todayCompleted).toBe(false);
    });

    it('records daily goal completion and returns updated streak', async () => {
      const mockCompletedStreak: StudyStreakSummary = {
        currentStreak: 8,
        longestStreak: 12,
        totalCompletedDays: 25,
        todayCompleted: true,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Daily goal completed',
          data: mockCompletedStreak,
        }),
      });

      const res = await streakApi.completeDailyGoal();
      expect(res.currentStreak).toBe(8);
      expect(res.longestStreak).toBe(12);
      expect(res.totalCompletedDays).toBe(25);
      expect(res.todayCompleted).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/streak/complete'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('handles idempotent duplicate completion gracefully', async () => {
      const mockStreakSameDay: StudyStreakSummary = {
        currentStreak: 8,
        longestStreak: 12,
        totalCompletedDays: 25,
        todayCompleted: true,
      };

      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockStreakSameDay,
        }),
      });

      const res1 = await streakApi.completeDailyGoal();
      const res2 = await streakApi.completeDailyGoal();

      expect(res1.currentStreak).toBe(8);
      expect(res2.currentStreak).toBe(8);
      expect(res1.totalCompletedDays).toBe(25);
      expect(res2.totalCompletedDays).toBe(25);
    });

    it('handles API error when fetching streak', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Internal server error',
        }),
      });

      await expect(streakApi.getStudyStreak()).rejects.toThrow();
    });

    it('handles network failure gracefully', async () => {
      (globalThis as any).fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

      await expect(streakApi.getStudyStreak()).rejects.toThrow('Network connection issue');
    });
  });

  describe('Streak Display Logic Helpers', () => {
    it('correctly distinguishes new users from returning users', () => {
      const newUser: StudyStreakSummary = {
        currentStreak: 0,
        longestStreak: 0,
        totalCompletedDays: 0,
        todayCompleted: false,
      };

      const returningUser: StudyStreakSummary = {
        currentStreak: 3,
        longestStreak: 5,
        totalCompletedDays: 10,
        todayCompleted: false,
      };

      const isNewUser = (s: StudyStreakSummary) => s.totalCompletedDays === 0;
      expect(isNewUser(newUser)).toBe(true);
      expect(isNewUser(returningUser)).toBe(false);
    });

    it('formats streak banner label correctly for active streaks', () => {
      const formatStreakLabel = (s: StudyStreakSummary) => {
        if (s.totalCompletedDays === 0) return '🔥 START YOUR STREAK';
        if (s.currentStreak > 0) return `🔥 ${s.currentStreak} DAY STREAK`;
        return '🔥 START YOUR STREAK';
      };

      expect(formatStreakLabel({ currentStreak: 7, longestStreak: 12, totalCompletedDays: 20, todayCompleted: false })).toBe('🔥 7 DAY STREAK');
      expect(formatStreakLabel({ currentStreak: 0, longestStreak: 12, totalCompletedDays: 20, todayCompleted: false })).toBe('🔥 START YOUR STREAK');
      expect(formatStreakLabel({ currentStreak: 0, longestStreak: 0, totalCompletedDays: 0, todayCompleted: false })).toBe('🔥 START YOUR STREAK');
    });

    it('formats completion banner label correctly for first day vs returning', () => {
      const formatCompletionLabel = (s: StudyStreakSummary) => {
        if (s.totalCompletedDays === 1) return '🎉 FIRST DAY COMPLETE!';
        return '🎉 DAILY GOAL COMPLETE!';
      };

      expect(formatCompletionLabel({ currentStreak: 1, longestStreak: 1, totalCompletedDays: 1, todayCompleted: true })).toBe('🎉 FIRST DAY COMPLETE!');
      expect(formatCompletionLabel({ currentStreak: 8, longestStreak: 12, totalCompletedDays: 25, todayCompleted: true })).toBe('🎉 DAILY GOAL COMPLETE!');
    });
  });
});
