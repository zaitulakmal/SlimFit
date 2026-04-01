/**
 * Nutritionix API service with SQLite caching.
 *
 * API keys: set EXPO_PUBLIC_NIX_APP_ID and EXPO_PUBLIC_NIX_APP_KEY in .env.local
 * Free tier: 500 req/day. Without keys the service returns [] gracefully.
 * Cache TTL: 7 days (nixCache table).
 */

import { eq } from 'drizzle-orm';
import { db } from '../db';
import { nixCache } from '../db/schema';

export interface NixFood {
  foodName: string;
  brandName?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
  nixItemId?: string;
  source: 'nutritionix';
}

const APP_ID = process.env.EXPO_PUBLIC_NIX_APP_ID ?? '';
const APP_KEY = process.env.EXPO_PUBLIC_NIX_APP_KEY ?? '';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isExpired(cachedAt: string): boolean {
  return Date.now() - new Date(cachedAt).getTime() > CACHE_TTL_MS;
}

async function getCache(key: string): Promise<NixFood[] | null> {
  try {
    const rows = await db.select().from(nixCache).where(eq(nixCache.query, key));
    if (rows.length === 0) return null;
    const row = rows[0];
    if (isExpired(row.cachedAt)) {
      await db.delete(nixCache).where(eq(nixCache.query, key));
      return null;
    }
    return JSON.parse(row.resultJson) as NixFood[];
  } catch {
    return null;
  }
}

async function setCache(key: string, results: NixFood[]): Promise<void> {
  try {
    await db.delete(nixCache).where(eq(nixCache.query, key));
    await db.insert(nixCache).values({
      query: key,
      resultJson: JSON.stringify(results),
      cachedAt: new Date().toISOString(),
    });
  } catch {
    // non-fatal
  }
}

export async function searchFoodsNix(query: string): Promise<NixFood[]> {
  if (!APP_ID || !APP_KEY) return [];
  const key = `search:${query.toLowerCase().trim()}`;
  const cached = await getCache(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}&detailed=true&self=false`,
      { headers: { 'x-app-id': APP_ID, 'x-app-key': APP_KEY } }
    );
    if (!res.ok) return [];
    const json = await res.json();

    const items: NixFood[] = [];
    for (const item of (json.branded ?? []).slice(0, 15)) {
      items.push({
        foodName: item.food_name,
        brandName: item.brand_name,
        calories: item.nf_calories ?? 0,
        proteinG: item.nf_protein ?? 0,
        carbsG: item.nf_total_carbohydrate ?? 0,
        fatG: item.nf_total_fat ?? 0,
        servingQty: item.serving_qty ?? 1,
        servingUnit: item.serving_unit ?? 'serving',
        nixItemId: item.nix_item_id,
        source: 'nutritionix',
      });
    }
    for (const item of (json.common ?? []).slice(0, 8)) {
      items.push({
        foodName: item.food_name,
        calories: item.nf_calories ?? 0,
        proteinG: item.nf_protein ?? 0,
        carbsG: item.nf_total_carbohydrate ?? 0,
        fatG: item.nf_total_fat ?? 0,
        servingQty: item.serving_qty ?? 1,
        servingUnit: item.serving_unit ?? 'serving',
        source: 'nutritionix',
      });
    }

    await setCache(key, items);
    return items;
  } catch {
    return [];
  }
}

export async function lookupBarcodeNix(barcode: string): Promise<NixFood | null> {
  if (!APP_ID || !APP_KEY) return null;
  const key = `barcode:${barcode}`;
  const cached = await getCache(key);
  if (cached && cached.length > 0) return cached[0];

  try {
    const res = await fetch(
      `https://trackapi.nutritionix.com/v2/search/item?upc=${encodeURIComponent(barcode)}`,
      { headers: { 'x-app-id': APP_ID, 'x-app-key': APP_KEY } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const item = json.foods?.[0];
    if (!item) return null;

    const food: NixFood = {
      foodName: item.food_name,
      brandName: item.brand_name,
      calories: item.nf_calories ?? 0,
      proteinG: item.nf_protein ?? 0,
      carbsG: item.nf_total_carbohydrate ?? 0,
      fatG: item.nf_total_fat ?? 0,
      servingQty: item.serving_weight_grams ?? 1,
      servingUnit: item.serving_unit ?? 'g',
      nixItemId: item.nix_item_id,
      source: 'nutritionix',
    };
    await setCache(key, [food]);
    return food;
  } catch {
    return null;
  }
}
