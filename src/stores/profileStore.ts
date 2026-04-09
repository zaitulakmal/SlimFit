/**
 * profileStore — Zustand store that bridges UI state with SQLite.
 *
 * Responsibilities:
 *  - loadProfile(): reads the single user_profile row from SQLite on app start
 *  - saveProfile(): inserts a new profile row (first-time onboarding completion)
 *  - updateProfile(): merges partial changes, recalculates TDEE + BMI, updates DB
 *  - setLanguage(): persists language preference to DB and fires i18n.changeLanguage()
 *
 * Patterns:
 *  - All DB access goes through src/db/index.ts (Pattern 1)
 *  - TDEE/BMI are always recalculated from raw values — never stored stale (D-07)
 *  - i18n language sync happens both on load and on language change (D-10)
 */

import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import {
  userProfile,
  weightLogs,
  waterLogs,
  foodLogs,
  mealPresets,
  nixCache,
  streaks,
  badges,
  notificationSettings,
  workouts,
  fastingLogs,
} from '../db/schema';
import {
  calculateTDEE,
  calculateBMI,
  roundTDEE,
  calculateCalorieTarget,
  type Gender,
  type ActivityLevel,
  type GoalType,
} from '../constants/tdee';
import i18n from '../i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileData {
  id?: number;
  name: string | null;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetWeightKg: number;
  deadline: string | null;
  tdee: number | null;
  calorieTarget: number | null;
  bmi: number | null;
  language: string;
  onboardingCompleted: boolean;
}

export type ProfileInput = Omit<
  ProfileData,
  'id' | 'tdee' | 'calorieTarget' | 'bmi' | 'onboardingCompleted'
>;

interface ProfileStore {
  profile: ProfileData | null;
  isLoaded: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (data: ProfileInput) => Promise<void>;
  updateProfile: (data: Partial<ProfileInput>) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  resetProfile: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoaded: false,

  /** Read the single user_profile row from SQLite. Syncs i18n language. */
  loadProfile: async () => {
    try {
      const rows = await db.select().from(userProfile).limit(1);
      if (rows.length > 0) {
        const row = rows[0];
        const profile: ProfileData = {
          id: row.id,
          name: row.name,
          gender: row.gender,
          age: row.age,
          heightCm: row.heightCm,
          weightKg: row.weightKg,
          activityLevel: row.activityLevel,
          targetWeightKg: row.targetWeightKg,
          deadline: row.deadline ?? null,
          goalType: (row.goalType as GoalType) ?? 'lose_weight',
          tdee: row.tdee,
          calorieTarget: row.tdee
            ? calculateCalorieTarget(row.tdee, (row.goalType as GoalType) ?? 'lose_weight', row.weightKg, row.targetWeightKg, row.deadline)
            : null,
          bmi: row.bmi,
          language: row.language,
          onboardingCompleted: row.onboardingCompleted,
        };
        set({ profile, isLoaded: true });
        // Sync i18n with persisted language (D-10)
        if (row.language && row.language !== i18n.language) {
          i18n.changeLanguage(row.language);
        }
      } else {
        set({ profile: null, isLoaded: true });
      }
    } catch (err) {
      console.error('[profileStore] loadProfile error:', err);
      set({ isLoaded: true });
    }
  },

  /** Insert a new profile row after completing the onboarding wizard. */
  saveProfile: async (data: ProfileInput) => {
    const tdeeRaw = calculateTDEE(
      data.gender,
      data.weightKg,
      data.heightCm,
      data.age,
      data.activityLevel
    );
    const tdee = roundTDEE(tdeeRaw);
    const calorieTarget = calculateCalorieTarget(tdee, data.goalType, data.weightKg, data.targetWeightKg, data.deadline);
    const bmi = parseFloat(
      calculateBMI(data.weightKg, data.heightCm).toFixed(1)
    );
    const now = new Date().toISOString();

    try {
      const result = await db
        .insert(userProfile)
        .values({
          name: data.name,
          gender: data.gender,
          age: data.age,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          activityLevel: data.activityLevel,
          goalType: data.goalType,
          targetWeightKg: data.targetWeightKg,
          deadline: data.deadline,
          tdee,
          bmi,
          language: data.language,
          onboardingCompleted: true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      set({
        profile: {
          id: result[0].id,
          ...data,
          tdee,
          calorieTarget,
          bmi,
          onboardingCompleted: true,
        },
      });
    } catch (err) {
      console.error('[profileStore] saveProfile error:', err);
      throw err;
    }
  },

  /** Merge partial updates, recalculate TDEE/BMI, persist to SQLite. */
  updateProfile: async (data: Partial<ProfileInput>) => {
    const current = get().profile;
    if (!current?.id) {
      console.warn('[profileStore] updateProfile called before loadProfile');
      return;
    }

    const merged: ProfileData = { ...current, ...data };
    const tdeeRaw = calculateTDEE(
      merged.gender,
      merged.weightKg,
      merged.heightCm,
      merged.age,
      merged.activityLevel
    );
    const tdee = roundTDEE(tdeeRaw);
    const calorieTarget = calculateCalorieTarget(tdee, merged.goalType, merged.weightKg, merged.targetWeightKg, merged.deadline);
    const bmi = parseFloat(
      calculateBMI(merged.weightKg, merged.heightCm).toFixed(1)
    );

    try {
      await db
        .update(userProfile)
        .set({
          ...data,
          tdee,
          bmi,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userProfile.id, current.id));

      set({ profile: { ...merged, tdee, calorieTarget, bmi } });
    } catch (err) {
      console.error('[profileStore] updateProfile error:', err);
      throw err;
    }
  },

  /**
   * Switch app language and persist preference.
   * i18n.changeLanguage() is synchronous — all t() subscribers re-render (D-10).
   */
  /** Delete all user data from every table and reset store state. */
  resetProfile: async () => {
    await db.delete(foodLogs);
    await db.delete(waterLogs);
    await db.delete(weightLogs);
    await db.delete(workouts);
    await db.delete(fastingLogs);
    await db.delete(streaks);
    await db.delete(badges);
    await db.delete(mealPresets);
    await db.delete(nixCache);
    await db.delete(notificationSettings);
    await db.delete(userProfile);
    set({ profile: null, isLoaded: true });
  },

  setLanguage: async (lang: string) => {
    i18n.changeLanguage(lang);
    const current = get().profile;
    if (current?.id) {
      try {
        await db
          .update(userProfile)
          .set({ language: lang, updatedAt: new Date().toISOString() })
          .where(eq(userProfile.id, current.id));
        set({ profile: { ...current, language: lang } });
      } catch (err) {
        console.error('[profileStore] setLanguage error:', err);
      }
    }
  },
}));
