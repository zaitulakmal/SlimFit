/**
 * Weekly report — pulls the last 7 days of data into one summary object,
 * used by both the in-app Weekly Report screen and the shareable text.
 */

import { gte } from 'drizzle-orm';
import { db } from '../db';
import { foodLogs, waterLogs, weightLogs, workouts } from '../db/schema';

export interface WeeklyReportSummary {
  daysLogged: number;
  avgCalories: number;
  waterGoalHitRate: number; // 0-1
  weightChangeKg: number | null;
  workoutCount: number;
  caloriesBurned: number;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function offsetDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function buildWeeklyReport(): Promise<WeeklyReportSummary> {
  const since = offsetDateStr(todayStr(), -6);

  const [foodRows, waterRows, weightRows, workoutRows] = await Promise.all([
    db.select().from(foodLogs).where(gte(foodLogs.dateStr, since)),
    db.select().from(waterLogs).where(gte(waterLogs.dateStr, since)),
    db.select().from(weightLogs).where(gte(weightLogs.dateStr, since)),
    db.select().from(workouts).where(gte(workouts.dateStr, since)),
  ]);

  const calByDate = new Map<string, number>();
  for (const f of foodRows) calByDate.set(f.dateStr, (calByDate.get(f.dateStr) ?? 0) + f.calories);
  const daysLogged = calByDate.size;
  const avgCalories = daysLogged > 0 ? Math.round([...calByDate.values()].reduce((a, b) => a + b, 0) / daysLogged) : 0;

  const waterHitDays = waterRows.filter((w) => w.totalMl >= w.goalMl).length;
  const waterGoalHitRate = waterRows.length > 0 ? waterHitDays / waterRows.length : 0;

  let weightChangeKg: number | null = null;
  if (weightRows.length >= 2) {
    const sorted = [...weightRows].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    weightChangeKg = parseFloat((sorted[sorted.length - 1].weightKg - sorted[0].weightKg).toFixed(1));
  }

  return {
    daysLogged,
    avgCalories,
    waterGoalHitRate,
    weightChangeKg,
    workoutCount: workoutRows.length,
    caloriesBurned: workoutRows.reduce((a, w) => a + w.caloriesBurned, 0),
  };
}

export function weeklyReportShareText(summary: WeeklyReportSummary): string {
  const lines = [
    `My week on Slimora 📊`,
    `• Logged food ${summary.daysLogged}/7 days`,
    `• Avg ${summary.avgCalories} cal/day`,
    `• Hit water goal ${Math.round(summary.waterGoalHitRate * 100)}% of days`,
  ];
  if (summary.weightChangeKg !== null) {
    const dir = summary.weightChangeKg <= 0 ? 'down' : 'up';
    lines.push(`• Weight ${dir} ${Math.abs(summary.weightChangeKg)}kg this week`);
  }
  if (summary.workoutCount > 0) {
    lines.push(`• ${summary.workoutCount} workouts, ${summary.caloriesBurned} cal burned`);
  }
  return lines.join('\n');
}
