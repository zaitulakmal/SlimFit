import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { notificationSettings, type NotificationSetting } from '../db/schema';
import {
  type NotifType,
  NOTIF_DEFAULTS,
  requestNotificationPermission,
  initNotificationChannel,
  cancelNotification,
} from '../services/notifications';
import { reconcileTodayNotifications, scheduleWeeklyReport } from '../services/notificationEngine';

type SettingsMap = Record<NotifType, NotificationSetting>;

interface NotificationState {
  settings: SettingsMap | null;
  isLoaded: boolean;
  permissionGranted: boolean;

  loadSettings: () => Promise<void>;
  toggleNotification: (type: NotifType, enabled: boolean) => Promise<void>;
  updateTime: (type: NotifType, hour: number, minute: number) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

const ALL_TYPES: NotifType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'water',
  'weigh_in',
  'exercise',
  'streak_protection',
  'weekly_report',
  'motivation',
];

async function ensureRows(): Promise<void> {
  for (const type of ALL_TYPES) {
    const existing = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.type, type));
    if (existing.length === 0) {
      const def = NOTIF_DEFAULTS[type];
      await db.insert(notificationSettings).values({
        type,
        enabled: false,
        hour: def.hour,
        minute: def.minute,
      });
    }
  }
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  settings: null,
  isLoaded: false,
  permissionGranted: false,

  loadSettings: async () => {
    await ensureRows();
    const rows = await db.select().from(notificationSettings);
    const map = Object.fromEntries(rows.map((r) => [r.type, r])) as SettingsMap;
    set({ settings: map, isLoaded: true });
  },

  toggleNotification: async (type, enabled) => {
    const settings = get().settings;
    if (!settings) return;

    if (enabled) {
      const granted = await requestNotificationPermission();
      await initNotificationChannel();
      if (!granted) {
        set({ permissionGranted: false });
        return;
      }
      set({ permissionGranted: true });
    } else {
      await cancelNotification(type);
    }

    await db
      .update(notificationSettings)
      .set({ enabled })
      .where(eq(notificationSettings.type, type));

    await get().loadSettings();

    if (enabled) {
      if (type === 'weekly_report') {
        await scheduleWeeklyReport();
      } else {
        await reconcileTodayNotifications();
      }
    }
  },

  updateTime: async (type, hour, minute) => {
    await db
      .update(notificationSettings)
      .set({ hour, minute })
      .where(eq(notificationSettings.type, type));

    await get().loadSettings();

    const settings = get().settings;
    if (settings?.[type]?.enabled) {
      if (type === 'weekly_report') {
        await scheduleWeeklyReport();
      } else {
        await reconcileTodayNotifications();
      }
    }
  },

  requestPermission: async () => {
    const granted = await requestNotificationPermission();
    set({ permissionGranted: granted });
    return granted;
  },
}));
