CREATE TABLE `weight_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`weight_kg` real NOT NULL,
	`bmi` real,
	`note` text,
	`logged_at` text NOT NULL,
	`date_str` text NOT NULL
);

CREATE TABLE `water_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`total_ml` integer NOT NULL DEFAULT 0,
	`goal_ml` integer NOT NULL DEFAULT 2000,
	`date_str` text NOT NULL
);
