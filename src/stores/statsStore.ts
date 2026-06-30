/**
 * Stats store — streaks, badges, weekly calorie report.
 *
 * Streak logic:
 *   - updateStreak(type, dateStr) is called after each successful log
 *   - If last_log_date == yesterday → increment streak
 *   - If last_log_date == today → no change (already counted)
 *   - Otherwise → reset to 1
 *
 * Badge check:
 *   - loadStats() queries DB for unlocked badges + re-checks conditions
 *   - New badges get inserted; newly unlocked IDs returned to caller for toast
 */

import { create } from 'zustand';
import { eq, gte, asc, desc } from 'drizzle-orm';
import { db } from '../db';
import { streaks, badges, foodLogs, weightLogs, waterLogs } from '../db/schema';
import { colors } from '../constants/theme';
import { useProfileStore } from './profileStore';

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

export interface BadgeDef {
  id: string;
  icon: string;
  color: string;
  titleKey: string;
  descKey: string;
  /** Milestones get a full-screen celebration instead of a small toast. */
  isMilestone?: boolean;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_food',     icon: 'restaurant',    color: colors.primary,  titleKey: 'badge.first_food',     descKey: 'badge.first_food_desc' },
  { id: 'first_weight',   icon: 'scale',         color: colors.skyBlue,  titleKey: 'badge.first_weight',   descKey: 'badge.first_weight_desc' },
  { id: 'first_water',    icon: 'water',         color: colors.skyBlue,  titleKey: 'badge.first_water',    descKey: 'badge.first_water_desc' },
  { id: 'streak_3',       icon: 'flame',         color: colors.amber,    titleKey: 'badge.streak_3',       descKey: 'badge.streak_3_desc' },
  { id: 'streak_7',       icon: 'flame',         color: colors.coral,    titleKey: 'badge.streak_7',       descKey: 'badge.streak_7_desc' },
  { id: 'streak_30',      icon: 'trophy',        color: colors.purple,   titleKey: 'badge.streak_30',      descKey: 'badge.streak_30_desc' },
  { id: 'water_streak_7', icon: 'water',         color: colors.skyBlue,  titleKey: 'badge.water_streak_7', descKey: 'badge.water_streak_7_desc' },
  { id: 'weight_streak_7', icon: 'scale',        color: colors.skyBlue,  titleKey: 'badge.weight_streak_7', descKey: 'badge.weight_streak_7_desc' },
  { id: 'weight_streak_30', icon: 'trophy',      color: colors.purple,   titleKey: 'badge.weight_streak_30', descKey: 'badge.weight_streak_30_desc' },
  { id: 'early_bird',     icon: 'sunny',         color: colors.amber,    titleKey: 'badge.early_bird',     descKey: 'badge.early_bird_desc' },
  { id: 'comeback_kid',   icon: 'refresh',       color: colors.coral,    titleKey: 'badge.comeback_kid',   descKey: 'badge.comeback_kid_desc' },
  { id: 'lost_1kg',       icon: 'trending-down', color: colors.primary,  titleKey: 'badge.lost_1kg',       descKey: 'badge.lost_1kg_desc', isMilestone: true },
  { id: 'lost_3kg',       icon: 'trending-down', color: colors.primary,  titleKey: 'badge.lost_3kg',       descKey: 'badge.lost_3kg_desc', isMilestone: true },
  { id: 'lost_5kg',       icon: 'trending-down', color: colors.primary,  titleKey: 'badge.lost_5kg',       descKey: 'badge.lost_5kg_desc', isMilestone: true },
  { id: 'half_way',       icon: 'trending-down', color: colors.primary,  titleKey: 'badge.half_way',       descKey: 'badge.half_way_desc', isMilestone: true },
  { id: 'goal_reached',   icon: 'trophy',        color: colors.amber,    titleKey: 'badge.goal_reached',   descKey: 'badge.goal_reached_desc', isMilestone: true },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreakInfo {
  current: number;
  longest: number;
  lastDate: string | null;
}

export interface WeeklyEntry {
  dateStr: string;
  calories: number;
}

interface StatsState {
  streakMap: Record<string, StreakInfo>;
  unlockedBadgeIds: string[];
  weeklyCalories: WeeklyEntry[];
  isLoaded: boolean;

  loadStats: () => Promise<string[]>; // returns newly unlocked badge ids
  updateStreak: (type: 'food' | 'water' | 'weight', dateStr: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function offsetDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(offsetDateStr(todayStr(), -i));
  }
  return days;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useStatsStore = create<StatsState>((set, get) => ({
  streakMap: {},
  unlockedBadgeIds: [],
  weeklyCalories: [],
  isLoaded: false,

  loadStats: async () => {
    // 1. Load streaks
    const streakRows = await db.select().from(streaks);
    const streakMap: Record<string, StreakInfo> = {};
    for (const r of streakRows) {
      streakMap[r.type] = { current: r.currentStreak, longest: r.longestStreak, lastDate: r.lastLogDate ?? null };
    }

    // 2. Load already-unlocked badges
    const existingBadges = await db.select().from(badges);
    const unlockedSet = new Set(existingBadges.map((b) => b.badgeId));

    // 3. Weekly calories (last 7 days)
    const sevenDaysAgo = offsetDateStr(todayStr(), -6);
    const allFoodLogs = await db.select().from(foodLogs).where(gte(foodLogs.dateStr, sevenDaysAgo));
    const calByDate: Record<string, number> = {};
    for (const log of allFoodLogs) {
      calByDate[log.dateStr] = (calByDate[log.dateStr] ?? 0) + log.calories;
    }
    const weeklyCalories: WeeklyEntry[] = last7Days().map((d) => ({
      dateStr: d,
      calories: Math.round(calByDate[d] ?? 0),
    }));

    // 4. Check badge conditions
    const newlyUnlocked: string[] = [];
    const unlock = async (badgeId: string) => {
      if (!unlockedSet.has(badgeId)) {
        await db.insert(badges).values({ badgeId, unlockedAt: new Date().toISOString() }).onConflictDoNothing();
        unlockedSet.add(badgeId);
        newlyUnlocked.push(badgeId);
      }
    };

    // first_food: any food log exists
    const foodCount = await db.select().from(foodLogs);
    if (foodCount.length > 0) await unlock('first_food');

    // first_weight: any weight log exists
    const weightCount = await db.select().from(weightLogs);
    if (weightCount.length > 0) await unlock('first_weight');

    // first_water: any water log with totalMl > 0
    const waterRows = await db.select().from(waterLogs);
    if (waterRows.some((w) => w.totalMl > 0)) await unlock('first_water');

    // streak badges based on food streak
    const foodStreak = streakMap['food']?.current ?? 0;
    if (foodStreak >= 3) await unlock('streak_3');
    if (foodStreak >= 7) await unlock('streak_7');
    if (foodStreak >= 30) await unlock('streak_30');

    // water/weigh-in streak badges
    const waterStreak = streakMap['water']?.current ?? 0;
    if (waterStreak >= 7) await unlock('water_streak_7');
    const weightStreak = streakMap['weight']?.current ?? 0;
    if (weightStreak >= 7) await unlock('weight_streak_7');
    if (weightStreak >= 30) await unlock('weight_streak_30');

    // early_bird: 5+ breakfasts logged before 8am (all-time)
    const earlyBreakfasts = (await db.select().from(foodLogs).where(eq(foodLogs.mealType, 'breakfast'))).filter(
      (f) => new Date(f.loggedAt).getHours() < 8
    );
    if (earlyBreakfasts.length >= 5) await unlock('early_bird');

    // comeback_kid: returned to logging after a 4+ day gap
    const distinctDates = [...new Set((await db.select().from(foodLogs)).map((f) => f.dateStr))].sort();
    if (distinctDates.length >= 2) {
      const latest = distinctDates[distinctDates.length - 1];
      const prior = distinctDates[distinctDates.length - 2];
      const gapDays = Math.round(
        (new Date(latest + 'T00:00:00').getTime() - new Date(prior + 'T00:00:00').getTime()) / 86_400_000
      );
      const todayD = todayStr();
      const yesterdayD = offsetDateStr(todayD, -1);
      if (gapDays >= 4 && (latest === todayD || latest === yesterdayD)) await unlock('comeback_kid');
    }

    // Weight-loss milestones — based on the very first vs. most recent weigh-in
    const allWeightLogsAsc = await db.select().from(weightLogs).orderBy(asc(weightLogs.dateStr));
    if (allWeightLogsAsc.length >= 2) {
      const startWeight = allWeightLogsAsc[0].weightKg;
      const currentWeight = allWeightLogsAsc[allWeightLogsAsc.length - 1].weightKg;
      const lostSoFar = startWeight - currentWeight;

      if (lostSoFar >= 1) await unlock('lost_1kg');
      if (lostSoFar >= 3) await unlock('lost_3kg');
      if (lostSoFar >= 5) await unlock('lost_5kg');

      const targetWeightKg = useProfileStore.getState().profile?.targetWeightKg;
      if (targetWeightKg != null && startWeight > targetWeightKg) {
        const totalToLose = startWeight - targetWeightKg;
        if (lostSoFar / totalToLose >= 0.5) await unlock('half_way');
        if (currentWeight <= targetWeightKg) await unlock('goal_reached');
      }
    }

    set({
      streakMap,
      unlockedBadgeIds: [...unlockedSet],
      weeklyCalories,
      isLoaded: true,
    });

    return newlyUnlocked;
  },

  updateStreak: async (type, dateStr) => {
    const rows = await db.select().from(streaks).where(eq(streaks.type, type));
    const now = dateStr;
    const yesterday = offsetDateStr(now, -1);

    if (rows.length === 0) {
      await db.insert(streaks).values({
        type,
        currentStreak: 1,
        longestStreak: 1,
        lastLogDate: now,
      });
    } else {
      const row = rows[0];
      if (row.lastLogDate === now) return; // already counted today
      const newCurrent = row.lastLogDate === yesterday ? row.currentStreak + 1 : 1;
      const newLongest = Math.max(newCurrent, row.longestStreak);
      await db
        .update(streaks)
        .set({ currentStreak: newCurrent, longestStreak: newLongest, lastLogDate: now })
        .where(eq(streaks.type, type));
    }
  },
}));

/** Mini reward: a status emoji unlocked by consistency, shown next to the user's name. */
export function getFlairEmoji(unlockedBadgeIds: string[]): string | null {
  const has = (id: string) => unlockedBadgeIds.includes(id);
  if (has('goal_reached')) return '👑';
  if (has('streak_30') || has('weight_streak_30')) return '🏆';
  if (has('streak_7') || has('water_streak_7') || has('weight_streak_7')) return '🔥';
  return null;
}
