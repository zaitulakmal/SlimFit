import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import {
  foodLogs,
  mealPresets,
  type FoodLog,
  type NewFoodLog,
  type MealPreset,
  type NewMealPreset,
} from '../db/schema';

export interface FoodTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface FoodState {
  dayLogs: FoodLog[];
  presets: MealPreset[];
  isLoaded: boolean;
  currentDateStr: string;

  loadDayLogs: (dateStr?: string) => Promise<void>;
  logFood: (item: Omit<NewFoodLog, 'loggedAt'> & { dateStr?: string }) => Promise<void>;
  deleteFood: (id: number) => Promise<void>;
  saveMealPreset: (preset: Omit<NewMealPreset, 'createdAt'>) => Promise<void>;
  loadPresets: () => Promise<void>;
  getTotals: () => FoodTotals;
  getMealLogs: (mealType: string) => FoodLog[];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export const useFoodStore = create<FoodState>((set, get) => ({
  dayLogs: [],
  presets: [],
  isLoaded: false,
  currentDateStr: todayStr(),

  loadDayLogs: async (dateStr) => {
    const date = dateStr ?? todayStr();
    try {
      const logs = await db
        .select()
        .from(foodLogs)
        .where(eq(foodLogs.dateStr, date))
        .orderBy(foodLogs.loggedAt);
      set({ dayLogs: logs, currentDateStr: date, isLoaded: true });
    } catch (e) {
      set({ isLoaded: true });
    }
  },

  logFood: async (item) => {
    const dateStr = item.dateStr ?? todayStr();
    const loggedAt = new Date().toISOString();
    await db.insert(foodLogs).values({ ...item, dateStr, loggedAt });
    await get().loadDayLogs(get().currentDateStr);
    // Update food streak (lazy import to avoid circular deps)
    try {
      const { useStatsStore } = await import('./statsStore');
      await useStatsStore.getState().updateStreak('food', dateStr);
    } catch {}
  },

  deleteFood: async (id) => {
    await db.delete(foodLogs).where(eq(foodLogs.id, id));
    await get().loadDayLogs(get().currentDateStr);
  },

  saveMealPreset: async (preset) => {
    const createdAt = new Date().toISOString();
    await db.insert(mealPresets).values({ ...preset, createdAt });
    await get().loadPresets();
  },

  loadPresets: async () => {
    const rows = await db.select().from(mealPresets).orderBy(mealPresets.createdAt);
    set({ presets: rows });
  },

  getTotals: () => {
    return get().dayLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        proteinG: acc.proteinG + log.proteinG,
        carbsG: acc.carbsG + log.carbsG,
        fatG: acc.fatG + log.fatG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
  },

  getMealLogs: (mealType) => {
    return get().dayLogs.filter((l) => l.mealType === mealType);
  },
}));
