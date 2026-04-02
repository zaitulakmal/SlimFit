/**
 * Open Food Facts API — free barcode lookup, no API key needed.
 * Endpoint: https://world.openfoodfacts.org/api/v0/product/{barcode}.json
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

export async function lookupBarcodeOFF(barcode: string): Promise<OFFFood | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
      { headers: { 'User-Agent': 'SlimTrack/1.0 (health app)' } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const n = p.nutriments ?? {};

    // Per 100g values → scale to serving size
    const servingG = parseFloat(p.serving_size) || 100;
    const scale = servingG / 100;

    const cal100 = n['energy-kcal_100g'] ?? n['energy_100g'] ? (n['energy_100g'] / 4.184) : 0;
    const calories = Math.round((n['energy-kcal_serving'] ?? cal100 * scale) || 0);

    return {
      foodName: p.product_name || p.product_name_en || 'Unknown Product',
      brandName: p.brands?.split(',')[0]?.trim(),
      calories,
      proteinG: parseFloat((n['proteins_serving'] ?? n['proteins_100g'] * scale) || 0),
      carbsG: parseFloat((n['carbohydrates_serving'] ?? n['carbohydrates_100g'] * scale) || 0),
      fatG: parseFloat((n['fat_serving'] ?? n['fat_100g'] * scale) || 0),
      servingQty: servingG,
      servingUnit: 'g',
      source: 'openfoodfacts',
    };
  } catch {
    return null;
  }
}
