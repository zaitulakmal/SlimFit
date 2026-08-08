/**
 * visionAI.ts — food photo → nutrition breakdown.
 *
 * Like assistant.ts, the provider keys, model chain and prompt moved into the
 * Cloudflare Worker (worker/src/). They used to be read from EXPO_PUBLIC_* env
 * vars here, which meant they were inlined into the shipped JS bundle and
 * extractable from the APK.
 */
import { callProxy, ProxyError } from './aiProxy';

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

export async function detectFoodFromBase64(base64: string): Promise<DetectionResult> {
  try {
    const data = await callProxy<{ foods: DetectedFood[] | null; error?: string }>('/vision', {
      base64,
    });

    if (data?.foods?.length) return { foods: data.foods };
    if (data?.error === 'no_food') return { foods: null, error: 'no_food' };
    return { foods: null, error: 'api_error', errorDetail: data?.error };
  } catch (e) {
    if (!(e instanceof ProxyError)) {
      return { foods: null, error: 'api_error', errorDetail: String(e) };
    }

    switch (e.code) {
      case 'network':
      case 'unavailable':
        return { foods: null, error: 'network_error', errorDetail: e.message };
      case 'quota_exceeded':
        return {
          foods: null,
          error: 'api_error',
          errorDetail: "You've reached today's photo scan limit. It resets tomorrow.",
        };
      case 'unauthenticated':
        return { foods: null, error: 'api_error', errorDetail: 'Please sign in again.' };
      default:
        return { foods: null, error: 'api_error', errorDetail: e.message };
    }
  }
}
