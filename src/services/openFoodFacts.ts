/**
 * Open Food Facts API — free, no API key needed.
 * - Barcode lookup: https://world.openfoodfacts.org/api/v0/product/{barcode}.json
 * - Text search:    https://world.openfoodfacts.org/cgi/search.pl?...
 * Coverage: 3M+ products globally including Malaysia brands.
 */

export interface OFFFood {
  foodName: string;
  brandName?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
  source: 'openfoodfacts';
}

const HEADERS = { 'User-Agent': 'SlimTrack/1.0 (health app; contact@slimtrack.app)' };

function parseOFFProduct(p: any): OFFFood | null {
  if (!p) return null;

  const n = p.nutriments ?? {};
  const name =
    p.product_name_ms ||
    p.product_name_en ||
    p.product_name ||
    '';
  if (!name.trim()) return null;

  // Prefer per-serving values; fall back to per-100g × scale
  const servingG = parseFloat(p.serving_size) || 100;
  const scale = servingG / 100;

  // Calories: try kcal_serving first, then energy-kcal_100g, then kJ/100g → kcal
  let calories = 0;
  if (n['energy-kcal_serving'] != null) {
    calories = Number(n['energy-kcal_serving']);
  } else if (n['energy-kcal_100g'] != null) {
    calories = Number(n['energy-kcal_100g']) * scale;
  } else if (n['energy_100g'] != null) {
    calories = (Number(n['energy_100g']) / 4.184) * scale;
  }

  const proteinG =
    n['proteins_serving'] != null
      ? Number(n['proteins_serving'])
      : (Number(n['proteins_100g']) || 0) * scale;
  const carbsG =
    n['carbohydrates_serving'] != null
      ? Number(n['carbohydrates_serving'])
      : (Number(n['carbohydrates_100g']) || 0) * scale;
  const fatG =
    n['fat_serving'] != null
      ? Number(n['fat_serving'])
      : (Number(n['fat_100g']) || 0) * scale;

  return {
    foodName: name.trim(),
    brandName: p.brands?.split(',')[0]?.trim() || undefined,
    calories: Math.round(calories),
    proteinG: Math.round(proteinG * 10) / 10,
    carbsG: Math.round(carbsG * 10) / 10,
    fatG: Math.round(fatG * 10) / 10,
    servingQty: Math.round(servingG),
    servingUnit: 'g',
    source: 'openfoodfacts',
  };
}

/** Lookup a single product by barcode (EAN-13, UPC, QR, etc.) */
export async function lookupBarcodeOFF(barcode: string): Promise<OFFFood | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
      { headers: HEADERS }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1) return null;
    return parseOFFProduct(json.product);
  } catch {
    return null;
  }
}

/** Text search — returns up to 20 matching food items */
export async function searchFoodsOFF(query: string): Promise<OFFFood[]> {
  if (!query.trim()) return [];
  try {
    const url =
      `https://world.openfoodfacts.org/cgi/search.pl` +
      `?search_terms=${encodeURIComponent(query)}` +
      `&search_simple=1&action=process&json=1&page_size=20` +
      `&fields=product_name,product_name_en,product_name_ms,brands,nutriments,serving_size`;

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const json = await res.json();
    const products: any[] = json.products ?? [];

    const results: OFFFood[] = [];
    for (const p of products) {
      const food = parseOFFProduct(p);
      if (food && food.calories > 0) results.push(food);
    }
    return results;
  } catch {
    return [];
  }
}
