/**
 * cycleStore — manages period/symptom logs and updates the profile's
 * lastPeriodStart anchor whenever a new period is detected.
 */

import { create } from 'zustand';
import { eq, desc, gte } from 'drizzle-orm';
import { db } from '../db';
import { cycleLogs, type CycleLog } from '../db/schema';
import { useProfileStore } from './profileStore';

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function offsetDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

interface CycleStore {
  logs: CycleLog[];
  isLoaded: boolean;
  loadLogs: (days?: number) => Promise<void>;
  logFlow: (dateStr: string, flow: FlowLevel, symptoms?: string[]) => Promise<void>;
  deleteLog: (dateStr: string) => Promise<void>;
}

export const useCycleStore = create<CycleStore>((set, get) => ({
  logs: [],
  isLoaded: false,

  loadLogs: async (days = 180) => {
    try {
      const since = offsetDateStr(todayStr(), -days);
      const rows = await db
        .select()
        .from(cycleLogs)
        .where(gte(cycleLogs.dateStr, since))
        .orderBy(desc(cycleLogs.dateStr));
      set({ logs: rows, isLoaded: true });
    } catch (err) {
      console.error('[cycleStore] loadLogs error:', err);
      set({ isLoaded: true });
    }
  },

  logFlow: async (dateStr, flow, symptoms) => {
    try {
      const yesterday = offsetDateStr(dateStr, -1);
      const existingYesterday = await db
        .select()
        .from(cycleLogs)
        .where(eq(cycleLogs.dateStr, yesterday))
        .limit(1);
      const isNewPeriodStart = existingYesterday.length === 0;

      const existingToday = await db
        .select()
        .from(cycleLogs)
        .where(eq(cycleLogs.dateStr, dateStr))
        .limit(1);

      const symptomsJson = symptoms ? JSON.stringify(symptoms) : null;
      if (existingToday.length > 0) {
        await db
          .update(cycleLogs)
          .set({ flow, symptoms: symptomsJson })
          .where(eq(cycleLogs.dateStr, dateStr));
      } else {
        await db.insert(cycleLogs).values({ dateStr, flow, symptoms: symptomsJson });
      }

      if (isNewPeriodStart) {
        await useProfileStore.getState().updateCycleSettings({ lastPeriodStart: dateStr });
      }

      await get().loadLogs();
    } catch (err) {
      console.error('[cycleStore] logFlow error:', err);
      throw err;
    }
  },

  deleteLog: async (dateStr) => {
    try {
      await db.delete(cycleLogs).where(eq(cycleLogs.dateStr, dateStr));
      await get().loadLogs();
    } catch (err) {
      console.error('[cycleStore] deleteLog error:', err);
    }
  },
}));
