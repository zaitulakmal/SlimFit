/**
 * gameStore — Slimora Garden gamification state.
 *
 * Plots: a small patch the user plants vegetables in. Each plot grows from a
 * seed over time when watered; fully grown veg can be "harvested" (resets the
 * plot) and bumps a garden score.
 *
 * Cats: two cats from CatPackFree you can pet to raise their affection; well
 * cared-for cats occasionally drop a bonus (here: a tiny affection gift).
 *
 * Persisted to AsyncStorage so progress survives app restarts.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlotStage = 'empty' | 'seed' | 'sprout' | 'growing' | 'ripe';

export interface Plot {
  index: number;
  vegKey: string | null;
  plantedAt: number | null; // epoch ms
  wateredAt: number | null; // epoch ms (last watering)
  water: number; // 0..1 hydration
  stage: PlotStage;
}

export interface CatFriend {
  key: string;
  name: string;
  affection: number; // 0..100
  pettedAt: number | null;
}

const PLOT_COUNT = 6;
const STORAGE_KEY = 'slimora-garden-v1';

// Growth: a seed reaches "ripe" after this many ms of accumulated hydration.
const GROW_MS = 1000 * 60 * 60 * 6; // 6 hours of care (demo-friendly)

function freshPlot(i: number): Plot {
  return { index: i, vegKey: null, plantedAt: null, wateredAt: null, water: 0, stage: 'empty' };
}

function freshCats(): CatFriend[] {
  return [
    { key: 'catIdle', name: 'Mochi', affection: 40, pettedAt: null },
    { key: 'catDracula', name: 'Draco', affection: 40, pettedAt: null },
  ];
}

interface GameState {
  plots: Plot[];
  cats: CatFriend[];
  score: number;
  harvests: number;

  plant: (index: number, vegKey: string) => void;
  waterPlot: (index: number) => void;
  harvest: (index: number) => void;
  petCat: (key: string) => void;
  tick: () => void; // recompute growth from elapsed time + hydration
  reset: () => void;
}

function stageFor(water: number, progress: number): PlotStage {
  if (progress <= 0) return 'seed';
  if (progress < 0.33) return 'sprout';
  if (progress < 1) return 'growing';
  return 'ripe';
}

export const useGameStore = create<GameState>((set, get) => ({
  plots: Array.from({ length: PLOT_COUNT }, (_, i) => freshPlot(i)),
  cats: freshCats(),
  score: 0,
  harvests: 0,

  plant: (index, vegKey) => {
    set((s) => {
      const plots = s.plots.slice();
      plots[index] = {
        ...freshPlot(index),
        vegKey,
        plantedAt: Date.now(),
        wateredAt: Date.now(),
        water: 1,
        stage: 'seed',
      };
      return { plots };
    });
    persistNow(get());
  },

  waterPlot: (index) => {
    set((s) => {
      const plots = s.plots.slice();
      const p = plots[index];
      if (!p.vegKey) return {};
      plots[index] = { ...p, water: Math.min(1, p.water + 0.5), wateredAt: Date.now() };
      return { plots };
    });
    get().tick();
    persistNow(get());
  },

  harvest: (index) => {
    set((s) => {
      const p = s.plots[index];
      if (!p.vegKey || p.stage !== 'ripe') return {};
      const plots = s.plots.slice();
      plots[index] = freshPlot(index);
      return { plots, score: s.score + 10, harvests: s.harvests + 1 };
    });
    persistNow(get());
  },

  petCat: (key) => {
    set((s) => {
      const cats = s.cats.map((c) =>
        c.key === key
          ? { ...c, affection: Math.min(100, c.affection + 8), pettedAt: Date.now() }
          : c,
      );
      return { cats };
    });
    persistNow(get());
  },

  tick: () => {
    set((s) => {
      const now = Date.now();
      const plots = s.plots.map((p) => {
        if (!p.vegKey || !p.plantedAt) return p;
        // Hydration decays over time; watering refills it.
        const sinceWater = p.wateredAt ? now - p.wateredAt : 0;
        const decay = (sinceWater / (1000 * 60 * 90)); // half-life ~90 min
        const water = Math.max(0, Math.min(1, p.water - decay));
        // progress accrues while hydrated
        const elapsed = now - p.plantedAt;
        const progress = Math.min(1, (elapsed / GROW_MS) * (0.4 + 0.6 * water));
        return { ...p, water, stage: stageFor(water, progress) };
      });
      return { plots };
    });
  },

  reset: () => {
    set({
      plots: Array.from({ length: PLOT_COUNT }, (_, i) => freshPlot(i)),
      cats: freshCats(),
      score: 0,
      harvests: 0,
    });
    persistNow(get());
  },
}));

// Persist a snapshot of the mutable bits (module-level so it isn't part of the
// public GameState type).
async function persistNow(s: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ plots: s.plots, cats: s.cats, score: s.score, harvests: s.harvests }),
    );
  } catch {
    /* ignore quota / unavailable */
  }
}

// Hydrate from AsyncStorage once at module load.
(async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Partial<GameState>;
    useGameStore.setState({
      plots: data.plots ?? useGameStore.getState().plots,
      cats: data.cats ?? useGameStore.getState().cats,
      score: data.score ?? 0,
      harvests: data.harvests ?? 0,
    });
  } catch {
    /* ignore */
  }
})();

export default useGameStore;
