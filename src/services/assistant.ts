/**
 * assistant.ts — Slimora's conversational AI helper.
 *
 * Text-only chat (no vision) that answers questions about food, nutrition,
 * healthy habits, and weight-loss strategy. Follows the same provider pattern
 * as visionAI.ts: Groq (primary) → OpenRouter free models (fallback).
 *
 * The model is instructed to stay in scope (food / health / weight loss) and to
 * keep replies short and practical, with Malaysian/SEA context.
 */

const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Verified against GET /v1/models on this account. The previous value
// (meta-llama/llama-4-scout-17b-16e-instruct) 404s as model_not_found, which
// silently pushed every chat onto the OpenRouter fallback.
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Checked against GET https://openrouter.ai/api/v1/models — gemma-3-27b-it:free
// has been retired and 404s, so it only cost a wasted round-trip before the
// next fallback.
const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * A snapshot of the user's real numbers, injected into the system prompt so the
 * assistant can answer "how am I doing?" / "how much can I still eat?" instead
 * of giving generic advice. Every field is optional — the prompt only lists
 * what we actually know.
 */
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

/** Renders the known context fields as a compact block for the system prompt. */
export function formatContext(ctx: AssistantContext): string {
  const L: string[] = [];
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

  if (ctx.name) L.push(`Name: ${ctx.name}`);
  if (num(ctx.age)) L.push(`Age: ${ctx.age}`);
  if (ctx.gender) L.push(`Gender: ${ctx.gender}`);
  if (num(ctx.heightCm)) L.push(`Height: ${round(ctx.heightCm)} cm`);
  if (num(ctx.weightKg)) L.push(`Current weight: ${round(ctx.weightKg)} kg`);
  if (num(ctx.startWeightKg)) L.push(`Starting weight: ${round(ctx.startWeightKg)} kg`);
  if (num(ctx.targetWeightKg)) L.push(`Target weight: ${round(ctx.targetWeightKg)} kg`);
  if (num(ctx.bmi)) L.push(`BMI: ${round(ctx.bmi)}`);
  if (ctx.goalType) L.push(`Goal: ${String(ctx.goalType).replace(/_/g, ' ')}`);
  if (ctx.deadline) L.push(`Target date: ${ctx.deadline}`);

  if (num(ctx.calorieTarget)) L.push(`Daily calorie target: ${Math.round(ctx.calorieTarget)} kcal`);
  if (num(ctx.caloriesEaten)) L.push(`Eaten today: ${Math.round(ctx.caloriesEaten)} kcal`);
  if (num(ctx.caloriesBurned) && ctx.caloriesBurned > 0)
    L.push(`Burned today from exercise: ${Math.round(ctx.caloriesBurned)} kcal`);

  const macros: string[] = [];
  if (num(ctx.proteinG)) macros.push(`protein ${Math.round(ctx.proteinG)}g`);
  if (num(ctx.carbsG)) macros.push(`carbs ${Math.round(ctx.carbsG)}g`);
  if (num(ctx.fatG)) macros.push(`fat ${Math.round(ctx.fatG)}g`);
  if (macros.length) L.push(`Macros today: ${macros.join(', ')}`);

  if (num(ctx.waterMl))
    L.push(`Water today: ${Math.round(ctx.waterMl)} ml${num(ctx.waterGoalMl) ? ` of ${Math.round(ctx.waterGoalMl)} ml goal` : ''}`);
  if (num(ctx.foodStreak) && ctx.foodStreak > 0) L.push(`Food logging streak: ${ctx.foodStreak} day(s)`);
  if (ctx.todayFoods?.length) L.push(`Foods logged today: ${ctx.todayFoods.slice(0, 12).join(', ')}`);

  return L.join('\n');
}

function buildSystemPrompt(ctx?: AssistantContext): string {
  const parts = [BASE_PROMPT];

  if (ctx?.language === 'ms') {
    parts.push('- Reply in Malay (Bahasa Melayu), casual and friendly, unless the user writes in English.');
  }

  const block = ctx ? formatContext(ctx) : '';
  if (block) {
    parts.push(`${DATA_RULES}\n\n--- USER DATA (today) ---\n${block}\n--- END USER DATA ---`);
  } else {
    parts.push(
      "The user has not set up their profile yet, so you have no personal data. If they ask about their own weight or calories, tell them to complete their profile and log a meal first."
    );
  }

  return parts.join('\n');
}

function buildMessages(history: ChatMessage[], ctx?: AssistantContext) {
  return [{ role: 'system', content: buildSystemPrompt(ctx) }, ...history];
}

async function tryProvider(
  url: string,
  key: string,
  model: string,
  history: ChatMessage[],
  ctx?: AssistantContext,
  extraHeaders?: Record<string, string>
): Promise<string | null> {
  if (!key) return null;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(history, ctx),
        max_tokens: 512,
        temperature: 0.6,
      }),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const json = await response.json();
  const text: string = json.choices?.[0]?.message?.content ?? '';
  return text.trim() || null;
}

export async function chatWithAssistant(
  history: ChatMessage[],
  ctx?: AssistantContext
): Promise<string> {
  if (GROQ_KEY) {
    for (const model of GROQ_MODELS) {
      const r = await tryProvider(GROQ_URL, GROQ_KEY, model, history, ctx);
      if (r) return r;
    }
  }
  if (OPENROUTER_KEY) {
    for (const model of OPENROUTER_MODELS) {
      const r = await tryProvider(OPENROUTER_URL, OPENROUTER_KEY, model, history, ctx, {
        'HTTP-Referer': 'https://slimora.app',
      });
      if (r) return r;
    }
  }
  return 'Sorry, my brain is offline right now (no AI key configured). Try again later or check your connection.';
}
