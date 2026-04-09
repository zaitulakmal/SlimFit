/**
 * TDEE / BMI calculation utilities for SlimTrack.
 * All formulas are pure functions — no side effects, no imports.
 *
 * TDEE uses the Harris-Benedict revised formula (Roza-Shizgal, 1984).
 * Multiplied by PAL (Physical Activity Level) per D-07.
 *
 * D-07: roundTDEE rounds to nearest 50 kcal and is displayed with a "~" prefix
 * to communicate honest approximation rather than false precision.
 */

export type Gender = 'male' | 'female';
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active';

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

/** Physical Activity Level multipliers (Harris-Benedict standard). */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

/**
 * Harris-Benedict Basal Metabolic Rate (BMR).
 * Men:   88.36  + (13.4  × weightKg) + (4.8  × heightCm) − (5.7  × age)
 * Women: 447.6  + (9.2   × weightKg) + (3.1  × heightCm) − (4.3  × age)
 */
export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  if (gender === 'male') {
    return 88.36 + 13.4 * weightKg + 4.8 * heightCm - 5.7 * age;
  }
  return 447.6 + 9.2 * weightKg + 3.1 * heightCm - 4.3 * age;
}

/**
 * Total Daily Energy Expenditure = BMR × activity multiplier.
 */
export function calculateTDEE(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel
): number {
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Round TDEE to nearest 50 kcal (D-07).
 * Display value: prefix with "~" in UI layer (not done here).
 */
export function roundTDEE(tdee: number): number {
  return Math.round(tdee / 50) * 50;
}

export type GoalType = 'lose_weight' | 'maintain' | 'get_fit';

/**
 * Goal-adjusted daily calorie target.
 *
 * lose_weight → TDEE − 500 kcal/day (or deadline-based deficit)
 * maintain    → TDEE
 * get_fit     → TDEE + 200 kcal/day (lean body recomposition)
 *
 * Caps: max deficit 1 000 kcal, never below 1 200 kcal/day.
 * If deadline is provided for lose_weight, calculates precise deficit.
 */
export function calculateCalorieTarget(
  tdee: number,
  goalType: GoalType,
  currentWeightKg: number,
  targetWeightKg: number,
  deadline?: string | null
): number {
  if (goalType === 'maintain') return Math.round(tdee);
  if (goalType === 'get_fit') return Math.round(tdee + 200);

  // lose_weight
  let deficit = 500;
  if (deadline) {
    const end = new Date(deadline);
    if (!isNaN(end.getTime())) {
      const today = new Date();
      const daysRemaining = Math.max(
        Math.ceil((end.getTime() - today.getTime()) / 86_400_000),
        7
      );
      const weightToLose = Math.max(currentWeightKg - targetWeightKg, 0);
      deficit = Math.min(1000, (weightToLose * 7700) / daysRemaining);
    }
  }

  return Math.round(Math.max(1200, tdee - deficit));
}

/**
 * Recommend a goal type based on BMI category.
 *
 * underweight → get_fit  (need to gain mass / build muscle)
 * normal      → maintain (already in healthy range)
 * overweight  → lose_weight
 * obese       → lose_weight
 */
export function suggestGoal(bmiCategory: BMICategory): GoalType {
  if (bmiCategory === 'underweight') return 'get_fit';
  if (bmiCategory === 'normal') return 'maintain';
  return 'lose_weight';
}

/**
 * Return calorie targets for all three goals given a TDEE.
 * Useful for displaying all options side-by-side so the user
 * can make an informed choice.
 */
export function getGoalCalorieOptions(
  tdee: number,
  weightKg: number,
  targetWeightKg: number,
  deadline?: string | null
): Record<GoalType, number> {
  return {
    lose_weight: calculateCalorieTarget(tdee, 'lose_weight', weightKg, targetWeightKg, deadline),
    maintain: calculateCalorieTarget(tdee, 'maintain', weightKg, targetWeightKg, deadline),
    get_fit: calculateCalorieTarget(tdee, 'get_fit', weightKg, targetWeightKg, deadline),
  };
}

/**
 * Body Mass Index = weight (kg) / height (m)^2.
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * BMI categories per MOH ranges (UI-SPEC):
 *   Underweight < 18.5
 *   Normal      18.5 – 24.9
 *   Overweight  25   – 29.9
 *   Obese       ≥ 30
 */
export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}
