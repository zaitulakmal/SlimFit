/**
 * Prompt construction for both AI endpoints.
 *
 * These used to live in the app bundle (src/services/assistant.ts and
 * visionAI.ts). Server-side means prompt and model-catalogue changes ship with
 * a `wrangler deploy`, not with a Play Store release.
 */

/** Mirrors AssistantContext in the app. Every field is optional. */
export interface AssistantContext {
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  startWeightKg?: number | null;
  targetWeightKg?: number | null;
  bmi?: number | null;
  goalType?: string | null;
  deadline?: string | null;
  calorieTarget?: number | null;
  caloriesEaten?: number | null;
  caloriesBurned?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  waterMl?: number | null;
  waterGoalMl?: number | null;
  foodStreak?: number | null;
  todayFoods?: string[];
  /** 'ms' → reply in Malay, anything else → English */
  language?: string | null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const BASE_PROMPT = `You are "Slimora assistant", a friendly, concise nutrition & wellness coach inside the Slimora health app.
Scope: food, nutrition, healthy eating, hydration, exercise, sleep, and sustainable weight loss.
Guidelines:
- Keep replies short (2-4 sentences) and practical.
- Use Malaysian / Southeast Asian context when relevant (nasi lemak, teh tarik, kuih, etc.).
- Give gentle, evidence-based advice. Never diagnose or prescribe medicine.
- If asked something off-topic, politely steer back to health/food/weight-loss.
- Use simple markdown (bullet points, **bold**) when helpful.`;

const DATA_RULES = `Using the user's data below:
- Refer to their real numbers when they ask about themselves; do the arithmetic for them (e.g. calories left = target - eaten + burned).
- If a number they ask about is missing, say so plainly and tell them where to log it instead of guessing.
- Never invent weights, calories, or foods that are not listed.`;

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Renders the known context fields as a compact block for the system prompt. */
export function formatContext(ctx: AssistantContext): string {
  const L: string[] = [];

  if (ctx.name) L.push(`Name: ${ctx.name}`);
  if (isNum(ctx.age)) L.push(`Age: ${ctx.age}`);
  if (ctx.gender) L.push(`Gender: ${ctx.gender}`);
  if (isNum(ctx.heightCm)) L.push(`Height: ${round(ctx.heightCm)} cm`);
  if (isNum(ctx.weightKg)) L.push(`Current weight: ${round(ctx.weightKg)} kg`);
  if (isNum(ctx.startWeightKg)) L.push(`Starting weight: ${round(ctx.startWeightKg)} kg`);
  if (isNum(ctx.targetWeightKg)) L.push(`Target weight: ${round(ctx.targetWeightKg)} kg`);
  if (isNum(ctx.bmi)) L.push(`BMI: ${round(ctx.bmi)}`);
  if (ctx.goalType) L.push(`Goal: ${String(ctx.goalType).replace(/_/g, ' ')}`);
  if (ctx.deadline) L.push(`Target date: ${ctx.deadline}`);

  if (isNum(ctx.calorieTarget)) L.push(`Daily calorie target: ${Math.round(ctx.calorieTarget)} kcal`);
  if (isNum(ctx.caloriesEaten)) L.push(`Eaten today: ${Math.round(ctx.caloriesEaten)} kcal`);
  if (isNum(ctx.caloriesBurned) && ctx.caloriesBurned > 0) {
    L.push(`Burned today from exercise: ${Math.round(ctx.caloriesBurned)} kcal`);
  }

  const macros: string[] = [];
  if (isNum(ctx.proteinG)) macros.push(`protein ${Math.round(ctx.proteinG)}g`);
  if (isNum(ctx.carbsG)) macros.push(`carbs ${Math.round(ctx.carbsG)}g`);
  if (isNum(ctx.fatG)) macros.push(`fat ${Math.round(ctx.fatG)}g`);
  if (macros.length) L.push(`Macros today: ${macros.join(', ')}`);

  if (isNum(ctx.waterMl)) {
    const goal = isNum(ctx.waterGoalMl) ? ` of ${Math.round(ctx.waterGoalMl)} ml goal` : '';
    L.push(`Water today: ${Math.round(ctx.waterMl)} ml${goal}`);
  }
  if (isNum(ctx.foodStreak) && ctx.foodStreak > 0) {
    L.push(`Food logging streak: ${ctx.foodStreak} day(s)`);
  }
  if (ctx.todayFoods?.length) {
    L.push(`Foods logged today: ${ctx.todayFoods.slice(0, 12).join(', ')}`);
  }

  return L.join('\n');
}

export function buildSystemPrompt(ctx?: AssistantContext): string {
  const parts = [BASE_PROMPT];

  if (ctx?.language === 'ms') {
    parts.push(
      '- Reply in Malay (Bahasa Melayu), casual and friendly, unless the user writes in English.'
    );
  }

  const block = ctx ? formatContext(ctx) : '';
  if (block) {
    parts.push(`${DATA_RULES}\n\n--- USER DATA (today) ---\n${block}\n--- END USER DATA ---`);
  } else {
    parts.push(
      'The user has not set up their profile yet, so you have no personal data. If they ask about their own weight or calories, tell them to complete their profile and log a meal first.'
    );
  }

  return parts.join('\n');
}

export const VISION_PROMPT = `You are an expert nutritionist specialising in Malaysian and Southeast Asian cuisine.
Look at this food photo. Identify every food item, dish, drink, or ingredient visible.

CRITICAL — do not fabricate:
- Report ONLY what you can actually see in this specific photo.
- The schema and the reference table below are lookup aids, NOT sample output.
  Never copy a dish from them unless you genuinely see that dish in the image.
- If the image is blank, too dark, too blurry, not food, or you cannot tell what
  the food is, return [] — an empty array is always the correct answer when in
  doubt. A wrong entry is worse than no entry, because it is written straight
  into the user's food diary.

Return ONLY a raw JSON array (no markdown, no explanation), each element shaped:
[
  {
    "foodName": string,          // what you see, e.g. the dish or ingredient name
    "calories": number,          // for the portion visible, > 0
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "servingQty": number,
    "servingUnit": string,       // "plate", "bowl", "piece", "glass", "g", ...
    "confidence": "high" | "medium" | "low",
    "notes": string              // optional, short
  }
]

Reference values, for estimating portions of dishes you have ALREADY identified
in the photo. This is not a menu to choose from:
- Nasi Goreng (1 plate): 550 kcal, P18g, C72g, F18g
- Nasi Lemak full set (1 plate): 644 kcal, P18g, C76g, F30g
- Mee Goreng (1 plate): 520 kcal, P16g, C74g, F17g
- Roti Canai plain (1 piece): 300 kcal, P7g, C42g, F12g
- Char Kway Teow (1 plate): 742 kcal, P28g, C80g, F34g
- Laksa (1 bowl): 590 kcal, P23g, C66g, F24g
- Bihun Goreng (1 plate): 450 kcal, P13g, C65g, F15g
- Nasi Putih (1 cup): 206 kcal, P4g, C45g, F0g
- Ayam Goreng (1 piece): 250 kcal, P22g, C8g, F15g
- Teh Tarik (1 glass): 130 kcal, P4g, C21g, F3g
- Kobis / Cabbage (100g): 25 kcal, P1g, C6g, F0g
- Telur goreng (1 egg): 90 kcal, P6g, C0g, F7g
- Daging lembu (100g): 250 kcal, P26g, C0g, F16g
- Ayam tanpa kulit (100g): 165 kcal, P31g, C0g, F4g
- Ikan (100g): 140 kcal, P24g, C0g, F4g

Rules:
- List EACH dish/ingredient you can see as its own entry
- Detect individual ingredients too (kobis, telur, daging) when visible
- Use realistic portion sizes for what is actually on the plate
- confidence: "high" clearly identifiable, "medium" uncertain, "low" barely legible
- Calories must be realistic (never 0)
- If you cannot see food clearly, return [] rather than guessing`;
