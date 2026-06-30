/**
 * glowScoreStore — computes today's Glow Score from existing log tables
 * and persists a daily snapshot to glow_scores for trend history.
 */

import { create } from 'zustand';
import { eq, gte, desc } from 'drizzle-orm';
import { db } from '../db';
import { foodLogs, waterLogs, weightLogs, workouts, glowScores, type GlowScore } from '../db/schema';
import { computeGlowScore, type GlowScoreBreakdown, type GlowScoreDayInputs } from '../services/glowScore';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function offsetDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(offsetDateStr(todayStr(), -i));
  return days;
}

interface GlowScoreStore {
  today: GlowScoreBreakdown | null;
  history: GlowScore[];
  isLoaded: boolean;
  loadAndCompute: () => Promise<void>;
}

export const useGlowScoreStore = create<GlowScoreStore>((set) => ({
  today: null,
  history: [],
  isLoaded: false,

  loadAndCompute: async () => {
    try {
      const since = offsetDateStr(todayStr(), -6);
      const [foodRows, waterRows, weightRows, workoutRows, historyRows] = await Promise.all([
        db.select().from(foodLogs).where(gte(foodLogs.dateStr, since)),
        db.select().from(waterLogs).where(gte(waterLogs.dateStr, since)),
        db.select().from(weightLogs).where(gte(weightLogs.dateStr, since)),
        db.select().from(workouts).where(gte(workouts.dateStr, since)),
        db.select().from(glowScores).orderBy(desc(glowScores.dateStr)).limit(14),
      ]);

      const foodDates = new Set(foodRows.map((r) => r.dateStr));
      const weightDates = new Set(weightRows.map((r) => r.dateStr));
      const workoutDates = new Set(workoutRows.map((r) => r.dateStr));
      const waterByDate = new Map(waterRows.map((r) => [r.dateStr, r]));

      const days: GlowScoreDayInputs[] = last7Days().map((d) => {
        const water = waterByDate.get(d);
        return {
          hasFoodLog: foodDates.has(d),
          metWaterGoal: !!water && water.totalMl >= water.goalMl,
          hasWeighIn: weightDates.has(d),
          hasActivity: workoutDates.has(d),
        };
      });

      const breakdown = computeGlowScore(days);

      const today = todayStr();
      const existing = await db.select().from(glowScores).where(eq(glowScores.dateStr, today)).limit(1);
      if (existing.length > 0) {
        await db
          .update(glowScores)
          .set({
            score: breakdown.score,
            loggingScore: breakdown.loggingScore,
            waterScore: breakdown.waterScore,
            weighInScore: breakdown.weighInScore,
            activityScore: breakdown.activityScore,
          })
          .where(eq(glowScores.dateStr, today));
      } else {
        await db.insert(glowScores).values({
          dateStr: today,
          score: breakdown.score,
          loggingScore: breakdown.loggingScore,
          waterScore: breakdown.waterScore,
          weighInScore: breakdown.weighInScore,
          activityScore: breakdown.activityScore,
        });
      }

      const refreshedHistory = await db.select().from(glowScores).orderBy(desc(glowScores.dateStr)).limit(14);
      set({ today: breakdown, history: refreshedHistory.reverse(), isLoaded: true });
    } catch (err) {
      console.error('[glowScoreStore] loadAndCompute error:', err);
      set({ isLoaded: true });
    }
  },
}));
