import { collection, query, where, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CommunityFood {
  id: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
}

interface NewCommunityFood {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
}

const FOODS_COLLECTION = 'foods';

// Crowd-sourced food cache in Firestore — grows from user manual entries and
// high-confidence AI detections so repeat foods resolve instantly without
// hitting Nutritionix/Open Food Facts or the vision API again.
export async function searchCommunityFoods(queryText: string): Promise<CommunityFood[]> {
  const nameLower = queryText.trim().toLowerCase();
  if (!nameLower) return [];
  try {
    const ref = collection(db, FOODS_COLLECTION);
    const snap = await getDocs(
      query(ref, where('nameLower', '>=', nameLower), where('nameLower', '<=', nameLower + ''), limit(20))
    );
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        foodName: data.foodName,
        calories: data.calories,
        proteinG: data.proteinG,
        carbsG: data.carbsG,
        fatG: data.fatG,
        servingQty: data.servingQty,
        servingUnit: data.servingUnit,
      };
    });
  } catch {
    // offline / rules not deployed yet — degrade silently, other sources still work
    return [];
  }
}

export async function addCommunityFood(food: NewCommunityFood): Promise<void> {
  const nameLower = food.foodName.trim().toLowerCase();
  if (!nameLower || !Number.isFinite(food.calories) || food.calories <= 0) return;
  try {
    const ref = collection(db, FOODS_COLLECTION);
    const existing = await getDocs(query(ref, where('nameLower', '==', nameLower), limit(1)));
    if (!existing.empty) return;
    await addDoc(ref, {
      foodName: food.foodName.trim(),
      nameLower,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      servingQty: food.servingQty,
      servingUnit: food.servingUnit,
      createdAt: serverTimestamp(),
    });
  } catch {
    // local log already succeeded — community cache write is best-effort
  }
}
