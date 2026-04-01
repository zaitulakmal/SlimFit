CREATE TABLE `food_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date_str` text NOT NULL,
	`meal_type` text NOT NULL,
	`food_name` text NOT NULL,
	`brand_name` text,
	`calories` real NOT NULL,
	`protein_g` real NOT NULL DEFAULT 0,
	`carbs_g` real NOT NULL DEFAULT 0,
	`fat_g` real NOT NULL DEFAULT 0,
	`serving_qty` real NOT NULL DEFAULT 1,
	`serving_unit` text NOT NULL DEFAULT 'serving',
	`logged_at` text NOT NULL,
	`source` text NOT NULL DEFAULT 'manual',
	`nix_item_id` text,
	`barcode` text
);

CREATE TABLE `meal_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`meal_type` text NOT NULL,
	`items` text NOT NULL,
	`total_calories` real NOT NULL,
	`created_at` text NOT NULL
);

CREATE TABLE `nix_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`query` text NOT NULL,
	`result_json` text NOT NULL,
	`cached_at` text NOT NULL
);
