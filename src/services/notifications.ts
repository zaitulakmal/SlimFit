/**
 * Notification service — wraps expo-notifications.
 *
 * Every notification type below is scheduled as a one-shot "today" (or
 * "this week" for weekly_report) trigger, not a blind repeating daily
 * alarm. The notificationEngine decides each time the app foregrounds
 * (or right after a relevant log action) whether a type's condition is
 * still unmet — if the user already did the thing, the pending
 * notification for today is cancelled instead of firing anyway.
 *
 * Notification types and their default send time:
 *   breakfast          07:30  no breakfast logged yet
 *   lunch              12:30  no lunch logged yet
 *   dinner             19:00  no dinner logged yet
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
  | 'water'
  | 'weigh_in'
  | 'exercise'
  | 'streak_protection'
  | 'weekly_report'
  | 'motivation';

export const NOTIF_DEFAULTS: Record<NotifType, { hour: number; minute: number }> = {
  breakfast: { hour: 7, minute: 30 },
  lunch: { hour: 12, minute: 30 },
  dinner: { hour: 19, minute: 0 },
  water: { hour: 9, minute: 0 },
  weigh_in: { hour: 7, minute: 0 },
  exercise: { hour: 18, minute: 0 },
  streak_protection: { hour: 20, minute: 30 },
  weekly_report: { hour: 18, minute: 0 },
  motivation: { hour: 19, minute: 0 },
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
      lightColor: '#4CAF50',
    });
  }
}

function identifierFor(type: NotifType): string {
  return `slimtrack-${type}`;
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
