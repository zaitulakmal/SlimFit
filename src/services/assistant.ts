/**
 * assistant.ts — Slimora's conversational AI helper.
 *
 * Text-only chat that answers questions about food, nutrition, healthy habits
 * and weight-loss strategy.
 *
 * The provider keys, model catalogue and system prompt all live in the
 * Cloudflare Worker now (worker/src/). This file previously read
 * EXPO_PUBLIC_GROQ_KEY and EXPO_PUBLIC_OPENROUTER_KEY and called the providers
 * directly, which meant both keys were inlined into the shipped bundle.
 *
 * A side benefit: prompt and model changes ship with `wrangler deploy` instead
 * of a Play Store release.
 */
import { callProxy, ProxyError } from './aiProxy';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * A snapshot of the user's real numbers, sent along so the assistant can answer
 * "how am I doing?" / "how much can I still eat?" instead of giving generic
 * advice. Every field is optional — the server prompt only lists what we know.
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

export async function chatWithAssistant(
  history: ChatMessage[],
  ctx?: AssistantContext
): Promise<string> {
  try {
    const data = await callProxy<{ text: string }>('/chat', { history, ctx });
    const text = data?.text?.trim();
    if (text) return text;
    return "Sorry, I couldn't come up with an answer just now. Try rephrasing?";
  } catch (e) {
    const code = e instanceof ProxyError ? e.code : 'unknown';

    switch (code) {
      case 'quota_exceeded':
        return "You've reached today's AI limit. It resets tomorrow — see you then!";
      case 'unauthenticated':
        return 'Please sign in again to chat with the assistant.';
      case 'network':
        return "I can't reach the network right now. Check your connection and try again.";
      default:
        return 'Sorry, my brain is offline right now. Please try again in a moment.';
    }
  }
}
