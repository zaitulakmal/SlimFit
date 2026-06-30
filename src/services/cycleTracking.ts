/**
 * Cycle tracking — pure date-math helpers for predicting cycle phase.
 *
 * Phase model (standard approximation):
 *   menstrual  : day 1..avgPeriodLengthDays
 *   ovulation  : ovulationDay-1 .. ovulationDay+1   (luteal phase is ~14 days, fairly fixed)
 *   follicular : after menstrual, before ovulation window
 *   luteal     : after ovulation window, until cycle resets
 */

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CyclePrediction {
  dayInCycle: number;
  phase: CyclePhase;
  nextPeriodDateStr: string;
  daysUntilNextPeriod: number;
}

function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(fromStr + 'T00:00:00');
  const to = new Date(toStr + 'T00:00:00');
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getCyclePhase(
  dayInCycle: number,
  avgCycleLengthDays: number,
  avgPeriodLengthDays: number
): CyclePhase {
  if (dayInCycle <= avgPeriodLengthDays) return 'menstrual';

  const ovulationDay = Math.max(avgCycleLengthDays - 14, avgPeriodLengthDays + 2);
  if (dayInCycle >= ovulationDay - 1 && dayInCycle <= ovulationDay + 1) return 'ovulation';
  if (dayInCycle < ovulationDay - 1) return 'follicular';
  return 'luteal';
}

/**
 * Predicts today's cycle phase and the next period date, given the last
 * recorded period start date. Returns null if tracking has no anchor yet.
 */
export function predictCycle(
  lastPeriodStart: string | null,
  avgCycleLengthDays: number,
  avgPeriodLengthDays: number,
  todayStr: string
): CyclePrediction | null {
  if (!lastPeriodStart) return null;

  const daysSince = daysBetween(lastPeriodStart, todayStr);
  if (daysSince < 0) return null;

  const cyclesElapsed = Math.floor(daysSince / avgCycleLengthDays);
  const dayInCycle = daysSince - cyclesElapsed * avgCycleLengthDays + 1;
  const currentCycleStart = addDays(lastPeriodStart, cyclesElapsed * avgCycleLengthDays);
  const nextPeriodDateStr = addDays(currentCycleStart, avgCycleLengthDays);
  const daysUntilNextPeriod = daysBetween(todayStr, nextPeriodDateStr);

  return {
    dayInCycle,
    phase: getCyclePhase(dayInCycle, avgCycleLengthDays, avgPeriodLengthDays),
    nextPeriodDateStr,
    daysUntilNextPeriod,
  };
}

export const CYCLE_PHASE_COPY: Record<CyclePhase, { label: string; note: string }> = {
  menstrual: {
    label: 'Period',
    note: 'Energy may be lower — go easy and prioritize protein + rest.',
  },
  follicular: {
    label: 'Follicular',
    note: 'Energy is usually rising — a good window to push workouts.',
  },
  ovulation: {
    label: 'Ovulation',
    note: 'Peak energy for most people — great time for harder training.',
  },
  luteal: {
    label: 'Luteal (PMS window)',
    note: "Water retention and appetite shifts are normal here — don't stress small scale bumps.",
  },
};
