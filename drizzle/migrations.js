// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo
// SQL is embedded directly as strings to avoid babel-plugin-inline-import bundling issues.

import journal from './meta/_journal.json';

const m0000 = `CREATE TABLE \`user_profile\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text,
	\`gender\` text NOT NULL,
	\`age\` integer NOT NULL,
	\`height_cm\` real NOT NULL,
	\`weight_kg\` real NOT NULL,
	\`activity_level\` text NOT NULL,
	\`target_weight_kg\` real NOT NULL,
	\`deadline\` text,
	\`tdee\` integer,
	\`bmi\` real,
	\`language\` text DEFAULT 'en' NOT NULL,
	\`onboarding_completed\` integer DEFAULT false NOT NULL,
	\`created_at\` text NOT NULL,
	\`updated_at\` text NOT NULL
);`;

const m0001 = `CREATE TABLE \`weight_logs\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`weight_kg\` real NOT NULL,
	\`bmi\` real,
	\`note\` text,
	\`logged_at\` text NOT NULL,
	\`date_str\` text NOT NULL
);

CREATE TABLE \`water_logs\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`total_ml\` integer NOT NULL DEFAULT 0,
	\`goal_ml\` integer NOT NULL DEFAULT 2000,
	\`date_str\` text NOT NULL
);`;

const m0002 = `CREATE TABLE \`food_logs\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`date_str\` text NOT NULL,
	\`meal_type\` text NOT NULL,
	\`food_name\` text NOT NULL,
	\`brand_name\` text,
	\`calories\` real NOT NULL,
	\`protein_g\` real NOT NULL DEFAULT 0,
	\`carbs_g\` real NOT NULL DEFAULT 0,
	\`fat_g\` real NOT NULL DEFAULT 0,
	\`serving_qty\` real NOT NULL DEFAULT 1,
	\`serving_unit\` text NOT NULL DEFAULT 'serving',
	\`logged_at\` text NOT NULL,
	\`source\` text NOT NULL DEFAULT 'manual',
	\`nix_item_id\` text,
	\`barcode\` text
);

CREATE TABLE \`meal_presets\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`meal_type\` text NOT NULL,
	\`items\` text NOT NULL,
	\`total_calories\` real NOT NULL,
	\`created_at\` text NOT NULL
);

CREATE TABLE \`nix_cache\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`query\` text NOT NULL,
	\`result_json\` text NOT NULL,
	\`cached_at\` text NOT NULL
);`;

const m0003 = `CREATE TABLE \`streaks\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`type\` text NOT NULL,
	\`current_streak\` integer NOT NULL DEFAULT 0,
	\`longest_streak\` integer NOT NULL DEFAULT 0,
	\`last_log_date\` text,
	UNIQUE(\`type\`)
);

CREATE TABLE \`badges\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`badge_id\` text NOT NULL,
	\`unlocked_at\` text NOT NULL,
	UNIQUE(\`badge_id\`)
);

CREATE TABLE \`notification_settings\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`type\` text NOT NULL,
	\`enabled\` integer NOT NULL DEFAULT 0,
	\`hour\` integer NOT NULL DEFAULT 8,
	\`minute\` integer NOT NULL DEFAULT 0,
	UNIQUE(\`type\`)
);`;

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
  },
};
