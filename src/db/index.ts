import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'slimtrack.db';

const client = openDatabaseSync(DATABASE_NAME);

client.execSync('PRAGMA journal_mode = WAL;');
client.execSync('PRAGMA foreign_keys = ON;');
client.execSync('PRAGMA busy_timeout = 3000;');

const tables = [
  `CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT,
    gender TEXT NOT NULL DEFAULT 'male',
    age INTEGER NOT NULL DEFAULT 25,
    height_cm REAL NOT NULL DEFAULT 170,
    weight_kg REAL NOT NULL DEFAULT 70,
    activity_level TEXT NOT NULL DEFAULT 'sedentary',
    target_weight_kg REAL NOT NULL DEFAULT 65,
    deadline TEXT,
    tdee INTEGER,
    bmi REAL,
    language TEXT NOT NULL DEFAULT 'en',
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS weight_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    weight_kg REAL NOT NULL,
    bmi REAL,
    note TEXT,
    logged_at TEXT NOT NULL,
    date_str TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS water_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    total_ml INTEGER NOT NULL DEFAULT 0,
    goal_ml INTEGER NOT NULL DEFAULT 2000,
    date_str TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS food_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    date_str TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    food_name TEXT NOT NULL,
    brand_name TEXT,
    calories REAL NOT NULL,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0,
    serving_qty REAL NOT NULL DEFAULT 1,
    serving_unit TEXT NOT NULL DEFAULT 'serving',
    logged_at TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    nix_item_id TEXT,
    barcode TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS meal_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    items TEXT NOT NULL,
    total_calories REAL NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS nix_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    query TEXT NOT NULL UNIQUE,
    result_json TEXT NOT NULL,
    cached_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    type TEXT NOT NULL UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_log_date TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    badge_id TEXT NOT NULL UNIQUE,
    unlocked_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    type TEXT NOT NULL UNIQUE,
    enabled INTEGER NOT NULL DEFAULT 0,
    hour INTEGER NOT NULL DEFAULT 8,
    minute INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    date_str TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    duration_min INTEGER NOT NULL,
    calories_burned INTEGER NOT NULL,
    notes TEXT,
    logged_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS fasting_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    date_str TEXT NOT NULL,
    start_hour INTEGER NOT NULL,
    start_minute INTEGER NOT NULL,
    duration_hours INTEGER NOT NULL DEFAULT 16,
    is_active INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS cycle_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    date_str TEXT NOT NULL UNIQUE,
    flow TEXT NOT NULL,
    symptoms TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS glow_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    date_str TEXT NOT NULL UNIQUE,
    score INTEGER NOT NULL,
    logging_score INTEGER NOT NULL DEFAULT 0,
    water_score INTEGER NOT NULL DEFAULT 0,
    weigh_in_score INTEGER NOT NULL DEFAULT 0,
    activity_score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    type TEXT NOT NULL,
    date_str TEXT NOT NULL,
    sent_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transformation_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    date_str TEXT NOT NULL,
    photo_uri TEXT NOT NULL,
    weight_kg REAL,
    created_at TEXT NOT NULL
  )`,
];

for (const sql of tables) {
  try {
    client.execSync(sql);
  } catch (e) {
    console.warn('[DB] Table init error:', e);
  }
}

// Migrations for existing installs
const migrations = [
  `ALTER TABLE user_profile ADD COLUMN goal_type TEXT DEFAULT 'lose_weight'`,
  `ALTER TABLE user_profile ADD COLUMN cycle_tracking_enabled INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE user_profile ADD COLUMN avg_cycle_length_days INTEGER NOT NULL DEFAULT 28`,
  `ALTER TABLE user_profile ADD COLUMN avg_period_length_days INTEGER NOT NULL DEFAULT 5`,
  `ALTER TABLE user_profile ADD COLUMN last_period_start TEXT`,
];
for (const sql of migrations) {
  try {
    client.execSync(sql);
  } catch {
    // Column already exists — safe to ignore
  }
}

export const db = drizzle(client, { schema });
