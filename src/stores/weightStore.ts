/**
 * weightStore — manages daily weight logs with BMI tracking.
 *
 * - logWeight(): insert or update today's entry
 * - loadLogs(): fetch last N days for chart
 * - deleteLog(): remove a log entry
 */

import { create } from 'zustand';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { weightLogs, type WeightLog } from '../db/schema';
import { calculateBMI } from '../constants/tdee';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface WeightStore {
  logs: WeightLog[];
  todayLog: WeightLog | null;
  isLoaded: boolean;
  logWeight: (weightKg: number, note?: string, heightCm?: number) => Promise<void>;
  loadLogs: (days?: number) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
}

export const useWeightStore = create<WeightStore>((set, get) => ({
  logs: [],
  todayLog: null,
  isLoaded: false,

  loadLogs: async (days = 90) => {
    try {
      const rows = await db
        .select()
        .from(weightLogs)
        .orderBy(desc(weightLogs.dateStr))
        .limit(days);
      const today = todayStr();
      const todayLog = rows.find((r) => r.dateStr === today) ?? null;
      set({ logs: rows.reverse(), todayLog, isLoaded: true });
    } catch (err) {
      console.error('[weightStore] loadLogs error:', err);
      set({ isLoaded: true });
    }
  },

  logWeight: async (weightKg, note, heightCm) => {
    const today = todayStr();
    const bmi = heightCm
      ? parseFloat(calculateBMI(weightKg, heightCm).toFixed(1))
      : null;

    try {
      const existing = await db
        .select()
        .from(weightLogs)
        .where(eq(weightLogs.dateStr, today))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(weightLogs)
          .set({ weightKg, bmi, note: note ?? null, loggedAt: new Date().toISOString() })
          .where(eq(weightLogs.id, existing[0].id));
      } else {
        await db.insert(weightLogs).values({
          weightKg,
          bmi,
          note: note ?? null,
          loggedAt: new Date().toISOString(),
          dateStr: today,
        });
      }
      // Reload after mutation
      await get().loadLogs();
    } catch (err) {
      console.error('[weightStore] logWeight error:', err);
      throw err;
    }
  },

  deleteLog: async (id) => {
    try {
      await db.delete(weightLogs).where(eq(weightLogs.id, id));
      await get().loadLogs();
    } catch (err) {
      console.error('[weightStore] deleteLog error:', err);
      throw err;
    }
  },
}));
