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
