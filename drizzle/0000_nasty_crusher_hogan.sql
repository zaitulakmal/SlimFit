CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`gender` text NOT NULL,
	`age` integer NOT NULL,
	`height_cm` real NOT NULL,
	`weight_kg` real NOT NULL,
	`activity_level` text NOT NULL,
	`target_weight_kg` real NOT NULL,
	`deadline` text,
	`tdee` integer,
	`bmi` real,
	`language` text DEFAULT 'en' NOT NULL,
	`onboarding_completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
