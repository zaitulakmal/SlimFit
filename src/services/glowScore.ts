/**
 * Glow Score — composite daily consistency score (0-100), built entirely
 * from data the app already tracks: food logging, water goal, weigh-ins,
 * and activity, each worth up to 25 points based on 7-day hit rate.
 */

export interface GlowScoreDayInputs {
  hasFoodLog: boolean;
  metWaterGoal: boolean;
  hasWeighIn: boolean;
  hasActivity: boolean;
}

export interface GlowScoreBreakdown {
  score: number;
  loggingScore: number;
  waterScore: number;
  weighInScore: number;
  activityScore: number;
}

const COMPONENT_MAX = 25;

export function computeGlowScore(last7Days: GlowScoreDayInputs[]): GlowScoreBreakdown {
  const n = Math.max(last7Days.length, 1);
  const rate = (pred: (d: GlowScoreDayInputs) => boolean) =>
    Math.round((last7Days.filter(pred).length / n) * COMPONENT_MAX);

  const loggingScore = rate((d) => d.hasFoodLog);
  const waterScore = rate((d) => d.metWaterGoal);
  const weighInScore = rate((d) => d.hasWeighIn);
  const activityScore = rate((d) => d.hasActivity);

  return {
    score: loggingScore + waterScore + weighInScore + activityScore,
    loggingScore,
    waterScore,
    weighInScore,
    activityScore,
  };
}

export function glowScoreLabel(score: number): string {
  if (score >= 85) return 'Glowing';
  if (score >= 60) return 'On track';
  if (score >= 35) return 'Warming up';
  return 'Just starting';
}
