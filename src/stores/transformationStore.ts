import { create } from 'zustand';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { transformationPhotos, type TransformationPhoto } from '../db/schema';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface TransformationStore {
  photos: TransformationPhoto[];
  isLoaded: boolean;
  loadPhotos: () => Promise<void>;
  addPhoto: (photoUri: string, weightKg: number | null, dateStr?: string) => Promise<void>;
  deletePhoto: (id: number) => Promise<void>;
}

export const useTransformationStore = create<TransformationStore>((set, get) => ({
  photos: [],
  isLoaded: false,

  loadPhotos: async () => {
    try {
      const rows = await db.select().from(transformationPhotos).orderBy(desc(transformationPhotos.dateStr));
      set({ photos: rows, isLoaded: true });
    } catch (err) {
      console.error('[transformationStore] loadPhotos error:', err);
      set({ isLoaded: true });
    }
  },

  addPhoto: async (photoUri, weightKg, dateStr) => {
    await db.insert(transformationPhotos).values({
      dateStr: dateStr ?? todayStr(),
      photoUri,
      weightKg: weightKg ?? undefined,
    });
    await get().loadPhotos();
  },

  deletePhoto: async (id) => {
    await db.delete(transformationPhotos).where(eq(transformationPhotos.id, id));
    await get().loadPhotos();
  },
}));
