/**
 * Slimora AI proxy — Cloudflare Worker.
 *
 * The app used to call Groq and OpenRouter directly with keys read from
 * EXPO_PUBLIC_* env vars. Anything with that prefix is inlined into the JS
 * bundle at build time, so both keys shipped inside every APK and could be
 * pulled back out with `strings` on the bundle. Routing through here means the
 * keys live only in Worker secrets.
 *
 * Every request must carry a Firebase ID token; see auth.ts. That is what
 * stops this URL from being an open gateway to our paid providers.
 */
import { verifyIdToken } from './auth';
import {
  buildSystemPrompt,
  VISION_PROMPT,
  type AssistantContext,
  type ChatMessage,
} from './prompts';

export interface Env {
  GROQ_KEY: string;
  OPENROUTER_KEY: string;
  FIREBASE_PROJECT_ID: string;
  /** Optional: bind a KV namespace named RATE_LIMIT to enable daily quotas. */
  RATE_LIMIT?: KVNamespace;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Verified against GET /v1/models on this account.
const GROQ_CHAT_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

// Groq has no image-capable model on this account (llama-4-scout was retired
// and returns model_not_found), so vision goes straight to OpenRouter. Put an
// id here if Groq ships one again.
const GROQ_VISION_MODEL = '';

const OPENROUTER_CHAT_MODELS = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
];

// Order matters: each failed model costs a full round-trip. gemma-4-31b is
// rate-limited upstream (HTTP 429 from Google AI Studio) while nemotron answers
// reliably, so nemotron leads and gemma is the backup.
const OPENROUTER_VISION_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-4-31b-it:free',
];

const OPENROUTER_HEADERS = { 'HTTP-Referer': 'https://slimora.app' };

// Daily per-user caps. These exist to stop one account draining the shared
// provider quota; they are deliberately well above normal use.
const CHAT_LIMIT_PER_DAY = 100;
const VISION_LIMIT_PER_DAY = 50;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function errorResponse(code: string, message: string, status: number): Response {
  return json({ error: code, message }, status);
}

/**
 * Counts one call against the caller's daily allowance.
 *
 * Best-effort: if no KV namespace is bound the Worker still serves traffic
 * rather than locking everyone out. Auth is the real gate; this is the spend
 * cap on top of it.
 */
async function overQuota(
  env: Env,
  uid: string,
  kind: 'chat' | 'vision',
  max: number
): Promise<boolean> {
  if (!env.RATE_LIMIT) return false;

  const day = new Date().toISOString().slice(0, 10);
  const key = `${uid}:${kind}:${day}`;

  const current = parseInt((await env.RATE_LIMIT.get(key)) ?? '0', 10) || 0;
  if (current >= max) return true;

  // Not atomic — two simultaneous requests can both read the same value. That
  // is acceptable for a spend cap (worst case a user gets one extra call);
  // making it exact would need Durable Objects, which are not on the free plan.
  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 172800 });
  return false;
}

interface ProviderCall {
  url: string;
  key: string;
  model: string;
  messages: unknown[];
  maxTokens: number;
  temperature: number;
  extraHeaders?: Record<string, string>;
}

/** One provider round-trip. Returns the assistant text, or null to fall through. */
async function callProvider(c: ProviderCall): Promise<string | null> {
  if (!c.key || !c.model) return null;

  let response: Response;
  try {
    response = await fetch(c.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.key}`,
        'Content-Type': 'application/json',
        ...c.extraHeaders,
      },
      body: JSON.stringify({
        model: c.model,
        messages: c.messages,
        max_tokens: c.maxTokens,
        temperature: c.temperature,
      }),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content ?? '';
  return text.trim() || null;
}

// ── Vision helpers ──────────────────────────────────────────────────────────

interface DetectedFood {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

function extractJsonArray(text: string): unknown[] | null {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through to the loose match below
  }
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

function mapFoods(raw: unknown[]): DetectedFood[] {
  return raw.map((item) => {
    const f = item as Record<string, unknown>;
    const confidence = f.confidence;
    return {
      foodName: String(f.foodName ?? 'Unknown Food'),
      calories: Math.max(1, Number(f.calories) || 1),
      proteinG: Math.max(0, Number(f.proteinG) || 0),
      carbsG: Math.max(0, Number(f.carbsG) || 0),
      fatG: Math.max(0, Number(f.fatG) || 0),
      servingQty: Math.max(0.1, Number(f.servingQty) || 1),
      servingUnit: String(f.servingUnit ?? 'serving'),
      confidence:
        confidence === 'high' || confidence === 'medium' || confidence === 'low'
          ? confidence
          : 'medium',
      notes: typeof f.notes === 'string' ? f.notes : undefined,
    };
  });
}

// ── Routes ──────────────────────────────────────────────────────────────────

async function handleChat(body: unknown, env: Env, uid: string): Promise<Response> {
  const { history, ctx } = (body ?? {}) as {
    history?: ChatMessage[];
    ctx?: AssistantContext;
  };

  if (!Array.isArray(history) || history.length === 0) {
    return errorResponse('invalid_argument', 'history must be a non-empty array.', 400);
  }

  if (await overQuota(env, uid, 'chat', CHAT_LIMIT_PER_DAY)) {
    return errorResponse('quota_exceeded', "You've reached today's AI limit.", 429);
  }

  // Bounded so a client cannot push an unbounded transcript through the
  // provider on our account.
  const trimmed = history.slice(-20).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? '').slice(0, 4000),
  }));

  const messages = [{ role: 'system', content: buildSystemPrompt(ctx) }, ...trimmed];

  for (const model of GROQ_CHAT_MODELS) {
    const text = await callProvider({
      url: GROQ_URL,
      key: env.GROQ_KEY,
      model,
      messages,
      maxTokens: 512,
      temperature: 0.6,
    });
    if (text) return json({ text });
  }

  for (const model of OPENROUTER_CHAT_MODELS) {
    const text = await callProvider({
      url: OPENROUTER_URL,
      key: env.OPENROUTER_KEY,
      model,
      messages,
      maxTokens: 512,
      temperature: 0.6,
      extraHeaders: OPENROUTER_HEADERS,
    });
    if (text) return json({ text });
  }

  return errorResponse('unavailable', 'All AI providers failed to respond.', 503);
}

async function handleVision(body: unknown, env: Env, uid: string): Promise<Response> {
  const { base64 } = (body ?? {}) as { base64?: string };

  if (typeof base64 !== 'string' || base64.length === 0) {
    return errorResponse('invalid_argument', 'base64 image data is required.', 400);
  }
  // Workers cap request bodies at 100 MB, but a payload this large is a sign
  // the photo was never downscaled — reject with something actionable.
  if (base64.length > 7_000_000) {
    return errorResponse('invalid_argument', 'Image is too large. Try a smaller photo.', 400);
  }

  if (await overQuota(env, uid, 'vision', VISION_LIMIT_PER_DAY)) {
    return errorResponse('quota_exceeded', "You've reached today's photo scan limit.", 429);
  }

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: VISION_PROMPT },
      ],
    },
  ];

  const chain: { url: string; key: string; model: string; headers?: Record<string, string> }[] = [];
  if (GROQ_VISION_MODEL) {
    chain.push({ url: GROQ_URL, key: env.GROQ_KEY, model: GROQ_VISION_MODEL });
  }
  for (const model of OPENROUTER_VISION_MODELS) {
    chain.push({
      url: OPENROUTER_URL,
      key: env.OPENROUTER_KEY,
      model,
      headers: OPENROUTER_HEADERS,
    });
  }

  // Distinguishes "every provider was unreachable" from "a provider answered,
  // just not with JSON". The prompt tells the model to return [] when it sees
  // no food, but models reliably answer that case in prose instead ("I can't
  // see any food in this image"). Reporting that as api_error made a correct
  // refusal look like an outage to the user.
  let anyProviderAnswered = false;

  for (const m of chain) {
    const text = await callProvider({
      url: m.url,
      key: m.key,
      model: m.model,
      messages,
      maxTokens: 1024,
      temperature: 0.1,
      extraHeaders: m.headers,
    });
    if (!text) continue;
    anyProviderAnswered = true;

    const raw = extractJsonArray(text);
    if (!raw) continue;
    // An empty array is a real answer — the model looked and saw no food — so
    // it ends the chain instead of falling through to the next model.
    if (raw.length === 0) return json({ foods: null, error: 'no_food' });
    return json({ foods: mapFoods(raw) });
  }

  return json({ foods: null, error: anyProviderAnswered ? 'no_food' : 'api_error' });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return errorResponse('method_not_allowed', 'Use POST.', 405);
    }

    const auth = request.headers.get('Authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) {
      return errorResponse('unauthenticated', 'Missing bearer token.', 401);
    }

    let uid: string | null;
    try {
      uid = await verifyIdToken(token, env.FIREBASE_PROJECT_ID);
    } catch {
      // JWKS fetch failed — an infrastructure problem, not a bad token.
      return errorResponse('unavailable', 'Could not verify credentials.', 503);
    }
    if (!uid) {
      return errorResponse('unauthenticated', 'Invalid or expired token.', 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('invalid_argument', 'Body must be JSON.', 400);
    }

    const path = new URL(request.url).pathname;
    switch (path) {
      case '/chat':
        return handleChat(body, env, uid);
      case '/vision':
        return handleVision(body, env, uid);
      default:
        return errorResponse('not_found', `Unknown route ${path}.`, 404);
    }
  },
};
