/**
 * fastingStore — manages intermittent fasting state.
 *
 * - loadToday(): get or create today's fasting row
 * - startFast(): start fasting timer
 * - stopFast(): stop fasting timer
 * - setDuration(): set fasting duration (16, 18, 20 hours)
 */

import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { fastingLogs, type FastingLog } from '../db/schema';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface FastingStore {
  today: FastingLog | null;
  isLoaded: boolean;
  loadToday: () => Promise<void>;
  startFast: () => Promise<void>;
  stopFast: () => Promise<void>;
  setDuration: (hours: number) => Promise<void>;
  getElapsedMinutes: () => number;
  getRemainingMinutes: () => number;
  getProgress: () => number;
  isFasting: () => boolean;
}

export const useFastingStore = create<FastingStore>((set, get) => ({
  today: null,
  isLoaded: false,

  loadToday: async () => {
    const date = todayStr();
    try {
      const rows = await db
        .select()
        .from(fastingLogs)
        .where(eq(fastingLogs.dateStr, date))
        .limit(1);

      if (rows.length > 0) {
        set({ today: rows[0], isLoaded: true });
      } else {
        const result = await db
          .insert(fastingLogs)
          .values({ 
            dateStr: date, 
            startHour: 20, 
            startMinute: 0, 
            durationHours: 16, 
            isActive: false 
          })
          .returning();
        set({ today: result[0], isLoaded: true });
      }
    } catch (err) {
      console.error('[fastingStore] loadToday error:', err);
      set({ isLoaded: true });
    }
  },

  startFast: async () => {
    const current = get().today;
    if (!current) return;
    const now = new Date();
    try {
      await db
        .update(fastingLogs)
        .set({ 
          startHour: now.getHours(), 
          startMinute: now.getMinutes(),
          isActive: true,
          completedAt: null 
        })
        .where(eq(fastingLogs.id, current.id));
      set({ 
        today: { 
          ...current, 
          startHour: now.getHours(), 
          startMinute: now.getMinutes(),
          isActive: true,
          completedAt: null 
        } 
      });
    } catch (err) {
      console.error('[fastingStore] startFast error:', err);
    }
  },

  stopFast: async () => {
    const current = get().today;
    if (!current) return;
    try {
      await db
        .update(fastingLogs)
        .set({ 
          isActive: false,
          completedAt: new Date().toISOString()
        })
        .where(eq(fastingLogs.id, current.id));
      set({ 
        today: { 
          ...current, 
          isActive: false,
          completedAt: new Date().toISOString()
        } 
      });
    } catch (err) {
      console.error('[fastingStore] stopFast error:', err);
    }
  },

  setDuration: async (hours: number) => {
    const current = get().today;
    if (!current) return;
    try {
      await db
        .update(fastingLogs)
        .set({ durationHours: hours })
        .where(eq(fastingLogs.id, current.id));
      set({ today: { ...current, durationHours: hours } });
    } catch (err) {
      console.error('[fastingStore] setDuration error:', err);
    }
  },

  getElapsedMinutes: () => {
    const today = get().today;
    if (!today || !today.isActive) return 0;
    const now = new Date();
    const startMinutes = today.startHour * 60 + today.startMinute;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return Math.max(0, currentMinutes - startMinutes);
  },

  getRemainingMinutes: () => {
    const today = get().today;
    if (!today) return 0;
    const totalMinutes = today.durationHours * 60;
    const elapsed = get().getElapsedMinutes();
    return Math.max(0, totalMinutes - elapsed);
  },

  getProgress: () => {
    const today = get().today;
    if (!today) return 0;
    const totalMinutes = today.durationHours * 60;
    const elapsed = get().getElapsedMinutes();
    return Math.min(1, elapsed / totalMinutes);
  },

  isFasting: () => {
    const today = get().today;
    return today?.isActive ?? false;
  },
}));
