import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  gender: text('gender', { enum: ['male', 'female'] }).notNull(),
  age: integer('age').notNull(),
  heightCm: real('height_cm').notNull(),
  weightKg: real('weight_kg').notNull(),
  activityLevel: text('activity_level', {
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active'],
  }).notNull(),
  goalType: text('goal_type', { enum: ['lose_weight', 'maintain', 'get_fit'] }).default('lose_weight'),
  targetWeightKg: real('target_weight_kg').notNull(),
  deadline: text('deadline'),
  tdee: integer('tdee'),
  bmi: real('bmi'),
  language: text('language').default('en').notNull(),
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' })
    .default(false)
    .notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;

// Weight logs
export const weightLogs = sqliteTable('weight_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weightKg: real('weight_kg').notNull(),
  bmi: real('bmi'),
  note: text('note'),
  loggedAt: text('logged_at').notNull().$defaultFn(() => new Date().toISOString()),
  dateStr: text('date_str').notNull(),
});
export type WeightLog = typeof weightLogs.$inferSelect;
export type NewWeightLog = typeof weightLogs.$inferInsert;

// Water logs
export const waterLogs = sqliteTable('water_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  totalMl: integer('total_ml').notNull().default(0),
  goalMl: integer('goal_ml').notNull().default(2000),
  dateStr: text('date_str').notNull(),
});
export type WaterLog = typeof waterLogs.$inferSelect;
export type NewWaterLog = typeof waterLogs.$inferInsert;

// ---------------------------------------------------------------------------
// Food logs — one row per food item logged
// ---------------------------------------------------------------------------
export const foodLogs = sqliteTable('food_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dateStr: text('date_str').notNull(),            // 'YYYY-MM-DD'
  mealType: text('meal_type', {
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  }).notNull(),
  foodName: text('food_name').notNull(),
  brandName: text('brand_name'),                   // packaged food brand
  calories: real('calories').notNull(),
  proteinG: real('protein_g').notNull().default(0),
  carbsG: real('carbs_g').notNull().default(0),
  fatG: real('fat_g').notNull().default(0),
  servingQty: real('serving_qty').notNull().default(1),
  servingUnit: text('serving_unit').notNull().default('serving'),
  loggedAt: text('logged_at').notNull().$defaultFn(() => new Date().toISOString()),
  // Source for dedup/reference: 'nutritionix', 'local', 'manual', 'preset'
  source: text('source').notNull().default('manual'),
  nixItemId: text('nix_item_id'),                  // Nutritionix item ID for cache
  barcode: text('barcode'),
});
export type FoodLog = typeof foodLogs.$inferSelect;
export type NewFoodLog = typeof foodLogs.$inferInsert;

// ---------------------------------------------------------------------------
// Meal presets — saved combinations for quick re-logging (FOOD-05)
// ---------------------------------------------------------------------------
export const mealPresets = sqliteTable('meal_presets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  mealType: text('meal_type', {
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  }).notNull(),
  // JSON array of food items: [{foodName, calories, proteinG, carbsG, fatG, servingQty, servingUnit}]
  items: text('items').notNull(),
  totalCalories: real('total_calories').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
export type MealPreset = typeof mealPresets.$inferSelect;
export type NewMealPreset = typeof mealPresets.$inferInsert;

// ---------------------------------------------------------------------------
// Nutritionix search cache — avoid burning free-tier quota (FOOD-01)
// ---------------------------------------------------------------------------
export const nixCache = sqliteTable('nix_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  query: text('query').notNull(),                  // lowercased search term / barcode
  resultJson: text('result_json').notNull(),        // JSON of result array
  cachedAt: text('cached_at').notNull().$defaultFn(() => new Date().toISOString()),
});
export type NixCache = typeof nixCache.$inferSelect;

// ---------------------------------------------------------------------------
// Streaks — one row per type, upserted on each log
// ---------------------------------------------------------------------------
export const streaks = sqliteTable('streaks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['food', 'water', 'weight'] }).notNull().unique(),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastLogDate: text('last_log_date'),
});
export type Streak = typeof streaks.$inferSelect;

// ---------------------------------------------------------------------------
// Badges / achievements
// ---------------------------------------------------------------------------
export const badges = sqliteTable('badges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  badgeId: text('badge_id').notNull().unique(),
  unlockedAt: text('unlocked_at').notNull(),
});
export type Badge = typeof badges.$inferSelect;

// ---------------------------------------------------------------------------
// Notification preferences — one row per notification type
// ---------------------------------------------------------------------------
export const notificationSettings = sqliteTable('notification_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull().unique(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  hour: integer('hour').notNull().default(8),
  minute: integer('minute').notNull().default(0),
});
export type NotificationSetting = typeof notificationSettings.$inferSelect;

// ---------------------------------------------------------------------------
// Workouts
// ---------------------------------------------------------------------------
export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dateStr: text('date_str').notNull(),
  activityType: text('activity_type').notNull(),
  durationMin: integer('duration_min').notNull(),
  caloriesBurned: integer('calories_burned').notNull(),
  notes: text('notes'),
  loggedAt: text('logged_at').notNull(),
});
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

// ---------------------------------------------------------------------------
// Fasting logs
// ---------------------------------------------------------------------------
export const fastingLogs = sqliteTable('fasting_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dateStr: text('date_str').notNull(),
  startHour: integer('start_hour').notNull(),
  startMinute: integer('start_minute').notNull(),
  durationHours: integer('duration_hours').notNull().default(16),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at'),
});
export type FastingLog = typeof fastingLogs.$inferSelect;
export type NewFastingLog = typeof fastingLogs.$inferInsert;
