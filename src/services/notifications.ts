/**
 * Notification service — wraps expo-notifications.
 *
 * Notification types:
 *   breakfast  07:30  Remind to log breakfast
 *   lunch      12:30  Remind to log lunch
 *   dinner     19:00  Remind to log dinner
 *   water      09:00  Remind to drink water (also at 11, 13, 15, 17)
 *   weigh_in   07:00  Daily weigh-in prompt
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotifType = 'breakfast' | 'lunch' | 'dinner' | 'water' | 'weigh_in';

export const NOTIF_DEFAULTS: Record<NotifType, { hour: number; minute: number }> = {
  breakfast: { hour: 7, minute: 30 },
  lunch: { hour: 12, minute: 30 },
  dinner: { hour: 19, minute: 0 },
  water: { hour: 9, minute: 0 },
  weigh_in: { hour: 7, minute: 0 },
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

export async function scheduleNotification(
  type: NotifType,
  hour: number,
  minute: number,
  titleKey: string,
  bodyKey: string
): Promise<void> {
  // Cancel existing before rescheduling
  await cancelNotification(type);

  await Notifications.scheduleNotificationAsync({
    identifier: `slimtrack-${type}`,
    content: {
      title: titleKey,
      body: bodyKey,
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelNotification(type: NotifType): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`slimtrack-${type}`);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
