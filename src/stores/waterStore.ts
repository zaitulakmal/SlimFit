/**
 * waterStore — manages daily water intake.
 *
 * - loadToday(): get or create today's water_logs row
 * - addWater(): add ml to today's total
 * - setGoal(): update daily goal
 */

import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { waterLogs, type WaterLog } from '../db/schema';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// Streak + notification bookkeeping after a water change. Deliberately not
// awaited by callers: reconcileTodayNotifications runs seven DB queries and
// reschedules native notifications, which made every tap feel laggy.
function onWaterGoalProgress(totalMl: number, goalMl: number): void {
  void (async () => {
    if (totalMl >= goalMl) {
      try {
        const { useStatsStore } = await import('./statsStore');
        await useStatsStore.getState().updateStreak('water', todayStr());
      } catch {}
    }
    try {
      const { reconcileTodayNotifications } = await import('../services/notificationEngine');
      await reconcileTodayNotifications();
    } catch {}
  })();
}

interface WaterStore {
  today: WaterLog | null;
  isLoaded: boolean;
  loadToday: () => Promise<void>;
  addWater: (ml: number) => Promise<void>;
  removeWater: (ml: number) => Promise<void>;
  setGoal: (ml: number) => Promise<void>;
}

export const useWaterStore = create<WaterStore>((set, get) => ({
  today: null,
  isLoaded: false,

  loadToday: async () => {
    const date = todayStr();
    try {
      const rows = await db
        .select()
        .from(waterLogs)
        .where(eq(waterLogs.dateStr, date))
        .limit(1);

      if (rows.length > 0) {
        set({ today: rows[0], isLoaded: true });
      } else {
        // Create today's row
        const result = await db
          .insert(waterLogs)
          .values({ dateStr: date, totalMl: 0, goalMl: 2000 })
          .returning();
        set({ today: result[0], isLoaded: true });
      }
    } catch (err) {
      console.error('[waterStore] loadToday error:', err);
      set({ isLoaded: true });
    }
  },

  addWater: async (ml) => {
    const current = get().today;
    if (!current) return;
    const newTotal = current.totalMl + ml;
    try {
      await db
        .update(waterLogs)
        .set({ totalMl: newTotal })
        .where(eq(waterLogs.id, current.id));
      set({ today: { ...current, totalMl: newTotal } });
      onWaterGoalProgress(newTotal, current.goalMl);
    } catch (err) {
      console.error('[waterStore] addWater error:', err);
    }
  },

  removeWater: async (ml) => {
    const current = get().today;
    if (!current) return;
    const newTotal = Math.max(0, current.totalMl - ml);
    try {
      await db
        .update(waterLogs)
        .set({ totalMl: newTotal })
        .where(eq(waterLogs.id, current.id));
      set({ today: { ...current, totalMl: newTotal } });
    } catch (err) {
      console.error('[waterStore] removeWater error:', err);
    }
  },

  setGoal: async (ml) => {
    const current = get().today;
    if (!current) return;
    try {
      await db
        .update(waterLogs)
        .set({ goalMl: ml })
        .where(eq(waterLogs.id, current.id));
      set({ today: { ...current, goalMl: ml } });
    } catch (err) {
      console.error('[waterStore] setGoal error:', err);
    }
  },
}));
