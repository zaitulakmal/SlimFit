export interface DetectedFood {
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

export type DetectionError = 'no_food' | 'api_error' | 'network_error' | 'parse_error';

export interface DetectionResult {
  foods: DetectedFood[] | null;
  error?: DetectionError;
  errorDetail?: string;
}

// Groq — this account's model catalogue (GET /v1/models) no longer lists any
// image-capable model; llama-4-scout was retired and returns model_not_found.
// Leaving a model id here just buys a guaranteed 404 before the fallback runs,
// so vision goes straight to OpenRouter. Put an id back here if Groq ships a
// vision model again.
const GROQ_VISION_MODEL = '';
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// OpenRouter — the vision path. Both ids verified present and image-capable.
const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
];

const PROMPT = `You are an expert nutritionist specialising in Malaysian and Southeast Asian cuisine.
Look at this food photo. Identify every food item, dish, drink, or ingredient visible.

Return ONLY a raw JSON array (no markdown, no explanation):
[
  {
    "foodName": "Nasi Goreng",
    "calories": 550,
    "proteinG": 18,
    "carbsG": 72,
    "fatG": 18,
    "servingQty": 1,
    "servingUnit": "plate",
    "confidence": "high",
    "notes": "Fried rice with egg and vegetables"
  }
]

Malaysian reference values:
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
- List EACH dish/ingredient as its own entry
- Detect individual ingredients too (kobis, telur, daging)
- Use realistic portion sizes
- confidence: "high" clearly identifiable, "medium" uncertain, "low" guessing
- Calories must be realistic (never 0)
- If truly no food visible, return []`;

function extractJsonArray(text: string): DetectedFood[] | null {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return null;
}

function buildMessages(base64: string) {
  return [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: PROMPT },
      ],
    },
  ];
}

function mapFoods(raw: any[]): DetectedFood[] {
  return raw.map(f => ({
    foodName: String(f.foodName ?? 'Unknown Food'),
    calories: Math.max(1, Number(f.calories) || 1),
    proteinG: Math.max(0, Number(f.proteinG) || 0),
    carbsG: Math.max(0, Number(f.carbsG) || 0),
    fatG: Math.max(0, Number(f.fatG) || 0),
    servingQty: Math.max(0.1, Number(f.servingQty) || 1),
    servingUnit: String(f.servingUnit ?? 'serving'),
    confidence: (['high', 'medium', 'low'].includes(f.confidence) ? f.confidence : 'medium') as DetectedFood['confidence'],
    notes: f.notes,
  }));
}

async function tryProvider(url: string, key: string, model: string, base64: string, extraHeaders?: Record<string, string>): Promise<DetectionResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(base64),
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });
  } catch (netErr) {
    return { foods: null, error: 'network_error', errorDetail: String(netErr) };
  }

  if (!response.ok) {
    const errText = await response.text();
    return { foods: null, error: 'api_error', errorDetail: `HTTP ${response.status}: ${errText.slice(0, 200)}` };
  }

  const json = await response.json();
  const text: string = json.choices?.[0]?.message?.content ?? '';
  if (!text) return { foods: null, error: 'parse_error', errorDetail: 'Empty response' };

  const raw = extractJsonArray(text);
  if (!raw) return { foods: null, error: 'parse_error', errorDetail: `Response: ${text.slice(0, 200)}` };
  if (raw.length === 0) return { foods: null, error: 'no_food' };

  return { foods: mapFoods(raw) };
}

export async function detectFoodFromBase64(base64: string): Promise<DetectionResult> {
  // 1. Groq, only if a vision-capable model is configured (see GROQ_VISION_MODEL).
  if (GROQ_KEY && GROQ_VISION_MODEL) {
    const result = await tryProvider(GROQ_URL, GROQ_KEY, GROQ_VISION_MODEL, base64);
    if (result.foods !== null || result.error === 'no_food' || result.error === 'network_error') {
      return result;
    }
  }

  // 2. Fall back through OpenRouter free models
  if (!OPENROUTER_KEY) {
    return { foods: null, error: 'api_error', errorDetail: 'No API key configured' };
  }

  let lastResult: DetectionResult = { foods: null, error: 'api_error' };
  for (const model of OPENROUTER_MODELS) {
    const result = await tryProvider(OPENROUTER_URL, OPENROUTER_KEY, model, base64, {
      'HTTP-Referer': 'https://slimora.app',
    });
    if (result.foods !== null || result.error === 'no_food' || result.error === 'network_error') {
      return result;
    }
    lastResult = result;
  }

  return lastResult;
}
