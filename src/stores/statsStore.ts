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
import { eq, gte, desc } from 'drizzle-orm';
import { db } from '../db';
import { streaks, badges, foodLogs, weightLogs, waterLogs } from '../db/schema';
import { colors } from '../constants/theme';

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

export interface BadgeDef {
  id: string;
  icon: string;
  color: string;
  titleKey: string;
  descKey: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_food',    icon: 'restaurant',    color: colors.primary,  titleKey: 'badge.first_food',    descKey: 'badge.first_food_desc' },
  { id: 'first_weight',  icon: 'scale',         color: colors.skyBlue,  titleKey: 'badge.first_weight',  descKey: 'badge.first_weight_desc' },
  { id: 'first_water',   icon: 'water',         color: colors.skyBlue,  titleKey: 'badge.first_water',   descKey: 'badge.first_water_desc' },
  { id: 'streak_3',      icon: 'flame',         color: colors.amber,    titleKey: 'badge.streak_3',      descKey: 'badge.streak_3_desc' },
  { id: 'streak_7',      icon: 'flame',         color: colors.coral,    titleKey: 'badge.streak_7',      descKey: 'badge.streak_7_desc' },
  { id: 'streak_30',     icon: 'trophy',        color: colors.purple,   titleKey: 'badge.streak_30',     descKey: 'badge.streak_30_desc' },
  { id: 'half_way',      icon: 'trending-down', color: colors.primary,  titleKey: 'badge.half_way',      descKey: 'badge.half_way_desc' },
  { id: 'goal_reached',  icon: 'trophy',        color: colors.amber,    titleKey: 'badge.goal_reached',  descKey: 'badge.goal_reached_desc' },
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
