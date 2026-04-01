CREATE TABLE `streaks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`current_streak` integer NOT NULL DEFAULT 0,
	`longest_streak` integer NOT NULL DEFAULT 0,
	`last_log_date` text,
	UNIQUE(`type`)
);

CREATE TABLE `badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`badge_id` text NOT NULL,
	`unlocked_at` text NOT NULL,
	UNIQUE(`badge_id`)
);

CREATE TABLE `notification_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`enabled` integer NOT NULL DEFAULT 0,
	`hour` integer NOT NULL DEFAULT 8,
	`minute` integer NOT NULL DEFAULT 0,
	UNIQUE(`type`)
);
