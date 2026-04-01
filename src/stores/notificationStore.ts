import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { notificationSettings, type NotificationSetting } from '../db/schema';
import {
  type NotifType,
  NOTIF_DEFAULTS,
  requestNotificationPermission,
  initNotificationChannel,
  scheduleNotification,
  cancelNotification,
} from '../services/notifications';

// Title / body strings per type (raw strings — i18n called at render)
const NOTIF_CONTENT: Record<NotifType, { title: string; body: string }> = {
  breakfast: { title: 'Breakfast Reminder', body: "Log your breakfast to stay on track!" },
  lunch: { title: 'Lunch Reminder', body: "Don't forget to log your lunch!" },
  dinner: { title: 'Dinner Reminder', body: "Log your dinner for today." },
  water: { title: 'Water Reminder', body: "Stay hydrated — log your water intake!" },
  weigh_in: { title: 'Daily Weigh-In', body: "Start your day by logging your weight." },
};

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

const ALL_TYPES: NotifType[] = ['breakfast', 'lunch', 'dinner', 'water', 'weigh_in'];

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
      const s = settings[type];
      const content = NOTIF_CONTENT[type];
      await scheduleNotification(type, s.hour, s.minute, content.title, content.body);
    } else {
      await cancelNotification(type);
    }

    await db
      .update(notificationSettings)
      .set({ enabled })
      .where(eq(notificationSettings.type, type));

    await get().loadSettings();
  },

  updateTime: async (type, hour, minute) => {
    await db
      .update(notificationSettings)
      .set({ hour, minute })
      .where(eq(notificationSettings.type, type));

    // Re-schedule if currently enabled
    const settings = get().settings;
    if (settings?.[type]?.enabled) {
      const content = NOTIF_CONTENT[type];
      await scheduleNotification(type, hour, minute, content.title, content.body);
    }

    await get().loadSettings();
  },

  requestPermission: async () => {
    const granted = await requestNotificationPermission();
    set({ permissionGranted: granted });
    return granted;
  },
}));
