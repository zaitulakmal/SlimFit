import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { bodyMeasurements, type BodyMeasurement, type NewBodyMeasurement } from '../db/schema';

export type { BodyMeasurement };

interface MeasurementsState {
  logs: BodyMeasurement[];
  isLoaded: boolean;
  loadLogs: () => Promise<void>;
  logMeasurement: (data: Omit<NewBodyMeasurement, 'id' | 'loggedAt'>) => Promise<void>;
  deleteMeasurement: (id: number) => Promise<void>;
  getTodayLog: () => BodyMeasurement | null;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export const useMeasurementsStore = create<MeasurementsState>((set, get) => ({
  logs: [],
  isLoaded: false,

  loadLogs: async () => {
    const rows = await db
      .select()
      .from(bodyMeasurements)
      .orderBy(desc(bodyMeasurements.loggedAt));
    set({ logs: rows, isLoaded: true });
  },

  logMeasurement: async (data) => {
    const today = todayStr();
    const existing = get().logs.find((l) => l.dateStr === today);
    if (existing) {
      await db
        .update(bodyMeasurements)
        .set({ ...data, loggedAt: new Date().toISOString() })
        .where(eq(bodyMeasurements.id, existing.id));
    } else {
      await db.insert(bodyMeasurements).values({
        ...data,
        loggedAt: new Date().toISOString(),
      });
    }
    await get().loadLogs();
  },

  deleteMeasurement: async (id) => {
    await db.delete(bodyMeasurements).where(eq(bodyMeasurements.id, id));
    await get().loadLogs();
  },

  getTodayLog: () => {
    const today = todayStr();
    return get().logs.find((l) => l.dateStr === today) ?? null;
  },
}));
