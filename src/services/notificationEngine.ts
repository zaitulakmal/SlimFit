/**
 * Notification engine — decides, every time it's called, which "smart"
 * notifications actually deserve to fire today, and schedules only those.
 *
 * Call sites:
 *   - App foreground (root layout AppState listener)
 *   - Right after a relevant log action (food/water/weight/workout stores)
 *
 * Design: suppress anything already satisfied, cap total pushes/day so the
 * app never feels spammy, and prefer the user's own historical log times
 * over a fixed clock when there's enough data (rule-based personalization).
 */

import { eq, gte, and } from 'drizzle-orm';
import { db } from '../db';
import {
  notificationSettings,
  foodLogs,
  waterLogs,
  weightLogs,
  workouts,
  streaks,
  notificationLog,
  userProfile,
} from '../db/schema';
import {
  type NotifType,
  WATER_SLOTS_PER_DAY,
  scheduleOneShotToday,
  scheduleWeekly,
  scheduleDaily,
  scheduleDailyWindow,
  cancelDailyWindow,
  cancelNotification,
} from './notifications';
import { quoteForToday } from './motivationQuotes';

const MAX_DAILY_DYNAMIC = 4;
const MOTIVATION_COOLDOWN_DAYS = 5;

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function offsetDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

interface Candidate {
  type: NotifType;
  hour: number;
  minute: number;
  title: string;
  body: string;
  priority: number;
}

/** Median minute-of-day a meal was logged over the last 14 days, if there's enough data. */
async function personalizedMealTime(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<{ hour: number; minute: number } | null> {
  const since = offsetDateStr(todayStr(), -14);
  const rows = await db
    .select()
    .from(foodLogs)
    .where(and(eq(foodLogs.mealType, mealType), gte(foodLogs.dateStr, since)));
  if (rows.length < 3) return null;

  const minutesOfDay = rows
    .map((r) => {
      const d = new Date(r.loggedAt);
      return d.getHours() * 60 + d.getMinutes();
    })
    .sort((a, b) => a - b);

  const median = minutesOfDay[Math.floor(minutesOfDay.length / 2)];
  return { hour: Math.floor(median / 60), minute: median % 60 };
}

async function alreadySentToday(type: NotifType): Promise<boolean> {
  const today = todayStr();
  const rows = await db
    .select()
    .from(notificationLog)
    .where(and(eq(notificationLog.type, type), eq(notificationLog.dateStr, today)))
    .limit(1);
  return rows.length > 0;
}

async function markSentToday(type: NotifType): Promise<void> {
  if (await alreadySentToday(type)) return;
  await db.insert(notificationLog).values({ type, dateStr: todayStr() });
}

export async function reconcileTodayNotifications(): Promise<void> {
  const today = todayStr();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [settingsRows, profileRows, todayFood, todayWater, todayWeight, todayWorkouts, streakRows] =
    await Promise.all([
      db.select().from(notificationSettings),
      db.select().from(userProfile).limit(1),
      db.select().from(foodLogs).where(eq(foodLogs.dateStr, today)),
      db.select().from(waterLogs).where(eq(waterLogs.dateStr, today)).limit(1),
      db.select().from(weightLogs).where(eq(weightLogs.dateStr, today)).limit(1),
      db.select().from(workouts).where(eq(workouts.dateStr, today)),
      db.select().from(streaks),
    ]);

  const settings: Partial<Record<NotifType, { enabled: boolean; hour: number; minute: number }>> =
    Object.fromEntries(settingsRows.map((r) => [r.type, r]));
  const profile = profileRows[0];

  const isEnabled = (type: NotifType) => settings[type]?.enabled === true;
  const timeFor = (type: NotifType) => ({
    hour: settings[type]?.hour ?? 8,
    minute: settings[type]?.minute ?? 0,
  });
  const minutesPassed = (hour: number, minute: number) => nowMinutes >= hour * 60 + minute;

  const candidates: Candidate[] = [];

  // --- Meal reminders: rolling multi-day window (personalized time when
  // there's enough history). Scheduled outside the daily candidate cap —
  // they are the guaranteed backbone that still fires when the app stays
  // closed; today's slot is skipped once the meal is logged or past due.
  const mealLogged = (m: 'breakfast' | 'lunch' | 'dinner' | 'snack') => todayFood.some((f) => f.mealType === m);
  const mealCopy: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', { title: string; body: string }> = {
    breakfast: { title: 'Breakfast Reminder', body: 'Log your breakfast to stay on track!' },
    lunch: { title: 'Lunch Reminder', body: "Don't forget to log your lunch!" },
    dinner: { title: 'Dinner Reminder', body: 'Log your dinner for today.' },
    snack: { title: 'Snack Check-In', body: 'Had a snack today? Log it to keep your totals accurate.' },
  };
  for (const meal of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
    if (!isEnabled(meal)) {
      await cancelDailyWindow(meal);
      continue;
    }
    const personalized = await personalizedMealTime(meal);
    const { hour, minute } = personalized ?? timeFor(meal);
    const skipToday = mealLogged(meal) || minutesPassed(hour, minute);
    // Drop any legacy single-shot id scheduled by pre-window app versions
    // so it can't fire alongside today's -d0 slot after an upgrade.
    await cancelNotification(meal);
    await scheduleDailyWindow(meal, hour, minute, mealCopy[meal].title, mealCopy[meal].body, skipToday);
    if (!skipToday) {
      await markSentToday(meal);
    }
  }

  // --- Water reminders: MyFitnessPal-style fixed slots through the day
  // (base time + every 3 hours, WATER_SLOTS_PER_DAY total), each a rolling
  // multi-day window so they fire without the app being reopened. Today's
  // remaining slots are skipped once the daily goal is reached.
  if (isEnabled('water')) {
    const water = todayWater[0];
    const goal = water?.goalMl ?? 2000;
    const have = water?.totalMl ?? 0;
    const goalMet = have >= goal;
    const { hour: baseHour, minute: baseMinute } = timeFor('water');
    const waterCopy = [
      { title: 'Water Reminder 💧', body: 'Start hydrating — log your first glass of the day!' },
      { title: 'Hydration Check 💧', body: 'Halfway through the day — keep the water coming!' },
      { title: 'Water Break 💧', body: 'Almost there — a glass now helps you hit your daily goal.' },
    ];
    // Drop any legacy single-shot id scheduled by pre-window app versions.
    await cancelNotification('water');
    for (let slot = 0; slot < WATER_SLOTS_PER_DAY; slot++) {
      const hour = Math.min(baseHour + slot * 3, 21);
      const skipToday = goalMet || minutesPassed(hour, baseMinute);
      const copy = waterCopy[slot] ?? waterCopy[0];
      await scheduleDailyWindow('water', hour, baseMinute, copy.title, copy.body, skipToday, `s${slot}`);
    }
  } else {
    await cancelDailyWindow('water');
  }

  // --- Weigh-in ---
  if (isEnabled('weigh_in')) {
    const hasWeighIn = todayWeight.length > 0;
    const { hour, minute } = timeFor('weigh_in');
    if (!hasWeighIn && !minutesPassed(hour, minute)) {
      candidates.push({
        type: 'weigh_in',
        hour,
        minute,
        title: 'Daily Weigh-In',
        body: 'Start your day by logging your weight.',
        priority: 70,
      });
    } else {
      await cancelNotification('weigh_in');
    }
  } else {
    await cancelNotification('weigh_in');
  }

  // --- Exercise: no activity logged today ---
  if (isEnabled('exercise')) {
    const { hour, minute } = timeFor('exercise');
    if (todayWorkouts.length === 0 && !minutesPassed(21, 0)) {
      const foodStreak = streakRows.find((s) => s.type === 'food')?.currentStreak ?? 0;
      candidates.push({
        type: 'exercise',
        hour,
        minute,
        title: 'Exercise Reminder',
        body:
          foodStreak >= 3
            ? `20 min today keeps your ${foodStreak}-day streak going 🔥`
            : 'A short walk or workout today counts — log it when you do.',
        priority: 50,
      });
    } else {
      await cancelNotification('exercise');
    }
  } else {
    await cancelNotification('exercise');
  }

  // --- Streak protection: an active streak with nothing logged yet today ---
  if (isEnabled('streak_protection')) {
    const bestStreak = Math.max(
      0,
      ...streakRows.filter((s) => s.lastLogDate !== today).map((s) => s.currentStreak)
    );
    const { hour, minute } = timeFor('streak_protection');
    const anyLoggedToday = todayFood.length > 0 || (todayWater[0]?.totalMl ?? 0) > 0 || todayWeight.length > 0;
    if (bestStreak >= 3 && !anyLoggedToday && !minutesPassed(23, 30)) {
      candidates.push({
        type: 'streak_protection',
        hour,
        minute,
        title: 'Your streak is about to end',
        body: `Your ${bestStreak}-day streak ends at midnight. One log saves it.`,
        priority: 100,
      });
    } else {
      await cancelNotification('streak_protection');
    }
  } else {
    await cancelNotification('streak_protection');
  }

  // --- Motivation: engagement dip vs. the user's own recent baseline ---
  if (isEnabled('motivation')) {
    const recentlySent = await hasRecentMotivation();
    if (!recentlySent) {
      const dipDetected = await detectEngagementDip();
      const { hour, minute } = timeFor('motivation');
      if (dipDetected && !minutesPassed(hour, minute)) {
        candidates.push({
          type: 'motivation',
          hour,
          minute,
          title: 'Bad days happen',
          body: "Yesterday doesn't erase your progress — let's restart today.",
          priority: 30,
        });
      } else {
        await cancelNotification('motivation');
      }
    } else {
      await cancelNotification('motivation');
    }
  } else {
    await cancelNotification('motivation');
  }

  // --- Apply global daily cap, highest priority first ---
  candidates.sort((a, b) => b.priority - a.priority);
  const chosen = candidates.slice(0, MAX_DAILY_DYNAMIC);
  const dropped = candidates.slice(MAX_DAILY_DYNAMIC);

  for (const c of dropped) {
    await cancelNotification(c.type);
  }
  for (const c of chosen) {
    await scheduleOneShotToday(c.type, c.hour, c.minute, c.title, c.body);
    await markSentToday(c.type);
  }
}

async function hasRecentMotivation(): Promise<boolean> {
  const since = offsetDateStr(todayStr(), -MOTIVATION_COOLDOWN_DAYS);
  const rows = await db
    .select()
    .from(notificationLog)
    .where(and(eq(notificationLog.type, 'motivation'), gte(notificationLog.dateStr, since)));
  return rows.length > 0;
}

/** Compares the last 2 days of activity against the prior 5-day baseline. */
async function detectEngagementDip(): Promise<boolean> {
  const today = todayStr();
  const since = offsetDateStr(today, -6);
  const [foodRows, waterRows, weightRows, workoutRows] = await Promise.all([
    db.select().from(foodLogs).where(gte(foodLogs.dateStr, since)),
    db.select().from(waterLogs).where(gte(waterLogs.dateStr, since)),
    db.select().from(weightLogs).where(gte(weightLogs.dateStr, since)),
    db.select().from(workouts).where(gte(workouts.dateStr, since)),
  ]);

  const activeDates = new Set<string>();
  for (const r of foodRows) activeDates.add(r.dateStr);
  for (const r of waterRows) if (r.totalMl > 0) activeDates.add(r.dateStr);
  for (const r of weightRows) activeDates.add(r.dateStr);
  for (const r of workoutRows) activeDates.add(r.dateStr);

  const baselineDays = [-6, -5, -4, -3, -2].map((o) => offsetDateStr(today, o));
  const recentDays = [-1, 0].map((o) => offsetDateStr(today, o));

  const baselineActive = baselineDays.filter((d) => activeDates.has(d)).length;
  const recentActive = recentDays.filter((d) => activeDates.has(d)).length;

  // Only flag a dip if the user was previously engaged (>=3 of last 5 baseline days)
  // and has gone fully quiet for the most recent day being checked (yesterday).
  return baselineActive >= 3 && recentActive === 0 && !activeDates.has(today);
}

/**
 * Daily motivation quote — a repeating daily notification (default 08:00)
 * whose message rotates by day-of-year (always English). Re-invoked on
 * every app foreground so the content stays fresh; if the app stays closed,
 * the last-scheduled quote keeps firing daily (guaranteed delivery).
 */
export async function scheduleDailyMotivation(): Promise<void> {
  const settingsRows = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.type, 'daily_motivation'));
  const setting = settingsRows[0];
  if (!setting?.enabled) {
    await cancelNotification('daily_motivation');
    return;
  }
  const quote = quoteForToday();
  await scheduleDaily('daily_motivation', setting.hour, setting.minute, quote.title, quote.body);
}

export async function scheduleWeeklyReport(): Promise<void> {
  const settingsRows = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.type, 'weekly_report'));
  const setting = settingsRows[0];
  if (!setting?.enabled) {
    await cancelNotification('weekly_report');
    return;
  }
  await scheduleWeekly(
    'weekly_report',
    1, // Sunday
    setting.hour,
    setting.minute,
    'Your Weekly Report Is Ready',
    "See how this week went — tap to view your trend, streaks, and wins 📊"
  );
}
