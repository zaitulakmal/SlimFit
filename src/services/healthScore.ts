/**
 * healthScore — a single 0–10 "health score" + per-system sub-scores,
 * computed from Slimora's real stores. Powers the Home dashboard that mirrors
 * the reference "Plan check-up" design (a petal donut + health-systems list).
 *
 * Each subsystem returns 0..10. The composite is a weighted average. When a
 * subsystem has no data yet (e.g. user hasn't logged anything), it contributes
 * a neutral partial so the score reflects "getting started" rather than 0.
 */

export interface SystemScore {
  key: string;
  label: string;
  score: number; // 0..10
  accent: string; // pastel accent for the progress bar
  icon: 'nutrition' | 'water' | 'weight' | 'activity' | 'fasting' | 'consistency';
}

export interface HealthScore {
  total: number; // 0..10, one decimal
  systems: SystemScore[];
  trendLabel: string;
}

const clamp = (n: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, n));
// map a 0..1 ratio to 0..10
const r = (ratio: number) => clamp(Math.round(ratio * 10 * 2) / 2); // 0.5 steps

export function computeHealthScore(input: {
  profile?: { calorieTarget?: number | null; tdee?: number | null; targetWeightKg?: number | null; weightKg?: number | null };
  foodCalories: number;
  foodCalorieTarget: number; // tdee + burned
  waterMl: number;
  waterGoalMl: number;
  currentWeight?: number | null;
  startWeight?: number | null;
  targetWeight?: number | null;
  workoutStreak: number;
  fastingActive: boolean;
  foodStreak: number;
}): HealthScore {
  const {
    profile,
    foodCalories,
    foodCalorieTarget,
    waterMl,
    waterGoalMl,
    currentWeight,
    startWeight,
    targetWeight,
    workoutStreak,
    fastingActive,
    foodStreak,
  } = input;

  // ── Nutrition: did they log food, and is intake within a sane band? ──
  const logged = foodCalories > 0;
  const withinBand =
    foodCalorieTarget > 0
      ? foodCalories <= foodCalorieTarget * 1.1 && foodCalories >= foodCalorieTarget * 0.4
      : true;
  const nutrition = r((logged ? 6 : 2) + (withinBand ? 4 : 0) * 0); // base 6 if logged
  const nutritionScore = clamp((logged ? 6 : 2) + (withinBand && logged ? 4 : 0));

  // ── Hydration ──
  const waterRatio = waterGoalMl > 0 ? waterMl / waterGoalMl : 0;
  const hydrationScore = clamp(r(waterRatio) === 0 && waterMl === 0 ? 2 : r(waterRatio));

  // ── Weight goal progress ──
  let weightScore = 5;
  if (startWeight != null && targetWeight != null && currentWeight != null && startWeight !== targetWeight) {
    const total = Math.abs(startWeight - targetWeight);
    const done = Math.abs(startWeight - currentWeight);
    weightScore = r(Math.min(done / total, 1));
  } else if (currentWeight != null) {
    weightScore = 6; // weighed in, goal not set
  }

  // ── Activity ──
  const activityScore = clamp(2 + Math.min(workoutStreak, 8) * 1); // 2..10 by streak

  // ── Fasting ──
  const fastingScore = fastingActive ? 9 : foodStreak >= 1 ? 5 : 3;

  // ── Consistency ──
  const consistencyScore = clamp(2 + Math.min(foodStreak, 8) * 1);

  const systems: SystemScore[] = [
    { key: 'nutrition', label: 'Nutrition', score: nutritionScore, accent: '#FF8FA3', icon: 'nutrition' },
    { key: 'hydration', label: 'Hydration', score: hydrationScore, accent: '#7FC8F8', icon: 'water' },
    { key: 'weight', label: 'Weight goal', score: weightScore, accent: '#9B8BE0', icon: 'weight' },
    { key: 'activity', label: 'Activity', score: activityScore, accent: '#5BD6B4', icon: 'activity' },
    { key: 'fasting', label: 'Fasting', score: fastingScore, accent: '#FFC53D', icon: 'fasting' },
    { key: 'consistency', label: 'Consistency', score: consistencyScore, accent: '#FF6FB5', icon: 'consistency' },
  ];

  const total = clamp(
    Math.round((systems.reduce((a, s) => a + s.score, 0) / systems.length) * 10) / 10
  );

  const trendLabel =
    total >= 8 ? 'Looking great' : total >= 6 ? 'On track' : total >= 4 ? 'Getting there' : 'Let’s begin';

  return { total, systems, trendLabel };
}
