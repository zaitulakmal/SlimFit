/**
 * Goal countdown — projects an ETA to the target weight from the user's
 * recent average weekly loss rate. Pure function, no DB access.
 */

export interface WeightPoint {
  dateStr: string;
  weightKg: number;
}

export interface GoalProjection {
  weeklyRateKg: number;
  daysRemaining: number;
  etaDateStr: string;
}

const MIN_WINDOW_DAYS = 7;
const TREND_WINDOW_DAYS = 28;

function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(fromStr + 'T00:00:00');
  const to = new Date(toStr + 'T00:00:00');
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split('T')[0];
}

/** Returns null when there isn't enough recent data, or the trend isn't moving toward the goal. */
export function projectGoalDate(
  logsAsc: WeightPoint[],
  targetWeightKg: number,
  todayStr: string
): GoalProjection | null {
  if (logsAsc.length < 2) return null;

  const since = addDays(todayStr, -TREND_WINDOW_DAYS);
  const windowed = logsAsc.filter((l) => l.dateStr >= since);
  const points = windowed.length >= 2 ? windowed : logsAsc;

  const first = points[0];
  const last = points[points.length - 1];
  const spanDays = daysBetween(first.dateStr, last.dateStr);
  if (spanDays < MIN_WINDOW_DAYS) return null;

  const totalLost = first.weightKg - last.weightKg;
  const dailyRate = totalLost / spanDays;
  if (dailyRate <= 0) return null; // not trending toward loss

  const remaining = last.weightKg - targetWeightKg;
  if (remaining <= 0) return null; // already at/past goal

  const daysRemaining = Math.ceil(remaining / dailyRate);
  return {
    weeklyRateKg: parseFloat((dailyRate * 7).toFixed(2)),
    daysRemaining,
    etaDateStr: addDays(todayStr, daysRemaining),
  };
}
