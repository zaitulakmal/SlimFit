/**
 * Notification service — wraps expo-notifications.
 *
 * Meal reminders (breakfast/lunch/dinner/snack) are scheduled as a rolling
 * window of one-shot triggers covering the next MEAL_WINDOW_DAYS days, so
 * they keep firing even if the user never reopens the app. Each reconcile
 * (app foreground or a relevant log action) refreshes the window and skips
 * today's slot when the meal is already logged or the time has passed.
 *
 * The condition-based types (water/weigh_in/exercise/streak_protection/
 * motivation) stay one-shot "today" triggers — their conditions can only be
 * evaluated live. weekly_report and daily_motivation use OS repeating
 * triggers and always fire.
 *
 * Notification types and their default send time:
 *   breakfast          07:30  no breakfast logged yet
 *   lunch              12:30  no lunch logged yet
 *   dinner             19:00  no dinner logged yet
 *   snack              15:30  no snack logged yet
 *   water              09:00  behind today's water pace
 *   weigh_in           07:00  no weigh-in today
 *   exercise           18:00  no activity logged today
 *   streak_protection  20:30  an active streak (>=3 days) has no log yet today
 *   weekly_report      Sun 18:00  always (opt-out, not opt-in)
 *   motivation         19:00  engagement dipped vs. the user's own baseline
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotifType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'water'
  | 'weigh_in'
  | 'exercise'
  | 'streak_protection'
  | 'weekly_report'
  | 'motivation'
  | 'daily_motivation';

export const NOTIF_DEFAULTS: Record<NotifType, { hour: number; minute: number }> = {
  breakfast: { hour: 7, minute: 30 },
  lunch: { hour: 12, minute: 30 },
  dinner: { hour: 19, minute: 0 },
  snack: { hour: 15, minute: 30 },
  water: { hour: 9, minute: 0 },
  weigh_in: { hour: 7, minute: 0 },
  exercise: { hour: 18, minute: 0 },
  streak_protection: { hour: 20, minute: 30 },
  weekly_report: { hour: 18, minute: 0 },
  motivation: { hour: 19, minute: 0 },
  daily_motivation: { hour: 8, minute: 0 },
};

// Set foreground notification behavior once at app start
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function initNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#34C6A0',
    });
  }
}

function identifierFor(type: NotifType): string {
  return `slimtrack-${type}`;
}

/**
 * How many days ahead meal/water reminders are pre-scheduled. 4 meals × 7
 * days + 3 water slots × 7 days = 49 pending notifications, still under
 * iOS's 64-notification cap alongside the other one-shot/repeating types.
 */
export const MEAL_WINDOW_DAYS = 7;

/** Water reminders fire this many times per day, 3 hours apart. */
export const WATER_SLOTS_PER_DAY = 3;

/**
 * Schedules a rolling window of one-shot reminders: one per day for the next
 * MEAL_WINDOW_DAYS days at hour:minute. Unlike scheduleOneShotToday, delivery
 * does not depend on the app being reopened each day — if the user never
 * comes back this week, every day's reminder still fires. Each reconcile
 * refreshes the window (re-extending it back to full length) and sets
 * skipToday when today's occurrence is already satisfied or past due.
 */
export async function scheduleDailyWindow(
  type: NotifType,
  hour: number,
  minute: number,
  title: string,
  body: string,
  skipToday: boolean,
  idSuffix = ''
): Promise<void> {
  const now = new Date();
  for (let offset = 0; offset < MEAL_WINDOW_DAYS; offset++) {
    const id = `${identifierFor(type)}${idSuffix ? `-${idSuffix}` : ''}-d${offset}`;
    await Notifications.cancelScheduledNotificationAsync(id);

    const fireAt = new Date(now);
    fireAt.setDate(fireAt.getDate() + offset);
    fireAt.setHours(hour, minute, 0, 0);
    if (fireAt.getTime() <= now.getTime()) continue;
    if (offset === 0 && skipToday) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title,
        body,
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });
  }
}

/** Cancels a type's rolling window plus its legacy single-shot identifier. */
export async function cancelDailyWindow(type: NotifType): Promise<void> {
  for (let offset = 0; offset < MEAL_WINDOW_DAYS; offset++) {
    await Notifications.cancelScheduledNotificationAsync(`${identifierFor(type)}-d${offset}`);
    // Per-slot windows (water uses one window per daily slot)
    for (let slot = 0; slot < WATER_SLOTS_PER_DAY; slot++) {
      await Notifications.cancelScheduledNotificationAsync(`${identifierFor(type)}-s${slot}-d${offset}`);
    }
  }
  await cancelNotification(type);
}

/**
 * Schedules a one-shot notification for today at hour:minute. If that time
 * has already passed today, does nothing (caller is expected to have
 * already checked — this never silently schedules for tomorrow, since
 * "tomorrow's relevance" is re-evaluated by the engine on next reconcile).
 */
export async function scheduleOneShotToday(
  type: NotifType,
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<boolean> {
  await cancelNotification(type);

  const now = new Date();
  const fireAt = new Date();
  fireAt.setHours(hour, minute, 0, 0);
  if (fireAt.getTime() <= now.getTime()) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: identifierFor(type),
    content: {
      title,
      body,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
  return true;
}

/**
 * Schedules a recurring daily notification at hour:minute (e.g. the daily
 * motivation quote). Fires every day even if the app stays closed; callers
 * re-invoke this on app foreground to rotate the message content.
 */
export async function scheduleDaily(
  type: NotifType,
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<void> {
  await cancelNotification(type);
  await Notifications.scheduleNotificationAsync({
    identifier: identifierFor(type),
    content: {
      title,
      body,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** Schedules a recurring weekly notification (e.g. the Sunday progress report). */
export async function scheduleWeekly(
  type: NotifType,
  weekday: number, // 1 = Sunday ... 7 = Saturday
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<void> {
  await cancelNotification(type);
  await Notifications.scheduleNotificationAsync({
    identifier: identifierFor(type),
    content: {
      title,
      body,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    },
  });
}

export async function cancelNotification(type: NotifType): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifierFor(type));
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
