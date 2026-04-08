import { MALAYSIAN_FOODS, type LocalFood } from '../data/malaysian-foods';

export interface LocalFoodResult {
  foodName: string;
  brandName?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
  source: 'local';
}

export function lookupBarcodeLocal(barcode: string): LocalFoodResult | null {
  const food = MALAYSIAN_FOODS.find(f => f.barcode === barcode);
  if (!food) return null;

  return {
    foodName: food.name,
    brandName: food.name,
    calories: food.calories,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
    servingQty: food.servingQty,
    servingUnit: food.servingUnit,
    source: 'local',
  };
}
