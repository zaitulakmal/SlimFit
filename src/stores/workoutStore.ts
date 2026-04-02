import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { workouts, type Workout, type NewWorkout } from '../db/schema';

interface WorkoutState {
  todayWorkouts: Workout[];
  isLoaded: boolean;
  totalBurned: number;

  loadToday: (dateStr?: string) => Promise<void>;
  logWorkout: (entry: Omit<NewWorkout, 'loggedAt'>) => Promise<void>;
  deleteWorkout: (id: number) => Promise<void>;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  todayWorkouts: [],
  isLoaded: false,
  totalBurned: 0,

  loadToday: async (dateStr) => {
    const date = dateStr ?? todayStr();
    try {
      const rows = await db
        .select()
        .from(workouts)
        .where(eq(workouts.dateStr, date))
        .orderBy(workouts.loggedAt);
      const total = rows.reduce((a, w) => a + w.caloriesBurned, 0);
      set({ todayWorkouts: rows, totalBurned: total, isLoaded: true });
    } catch (e) {
      console.warn('[workoutStore] loadToday error:', e);
      set({ isLoaded: true });
    }
  },

  logWorkout: async (entry) => {
    const loggedAt = new Date().toISOString();
    await db.insert(workouts).values({ ...entry, loggedAt });
    await get().loadToday(entry.dateStr);
  },

  deleteWorkout: async (id) => {
    const w = get().todayWorkouts.find((x) => x.id === id);
    await db.delete(workouts).where(eq(workouts.id, id));
    await get().loadToday(w?.dateStr ?? todayStr());
  },
}));
