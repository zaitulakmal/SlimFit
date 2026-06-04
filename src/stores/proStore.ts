import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  type Product,
  type Purchase,
} from 'react-native-iap';

const PRO_STORAGE_KEY = 'slimora_pro_v1';
export const PRO_PRODUCT_ID = 'slimora_pro';

interface ProState {
  isPro: boolean;
  loading: boolean;
  error: string | null;
  product: Product | null;
  init: () => Promise<void>;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  clearError: () => void;
}

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  loading: false,
  error: null,
  product: null,

  init: async () => {
    try {
      const stored = await AsyncStorage.getItem(PRO_STORAGE_KEY);
      if (stored === 'true') { set({ isPro: true }); return; }
      await initConnection();
      const products = await fetchProducts({ skus: [PRO_PRODUCT_ID] });
      if (products && products.length > 0) {
        set({ product: products[0] as Product });
      }
    } catch {
      // IAP not available in simulator — ignore silently
    }
  },

  purchase: async () => {
    set({ loading: true, error: null });
    try {
      await initConnection();
      const result = await requestPurchase({
        type: 'in-app',
        request: {
          android: { skus: [PRO_PRODUCT_ID] },
          apple:   { sku: PRO_PRODUCT_ID },
        },
      });
      const purchase = Array.isArray(result) ? result[0] : result;
      if (purchase) {
        await finishTransaction({ purchase: purchase as Purchase, isConsumable: false });
        await AsyncStorage.setItem(PRO_STORAGE_KEY, 'true');
        set({ isPro: true, loading: false });
        return true;
      }
    } catch (e: any) {
      if (e?.code === 'E_USER_CANCELLED') {
        set({ loading: false });
      } else {
        set({ error: 'Purchase failed. Please try again.', loading: false });
      }
    }
    set({ loading: false });
    return false;
  },

  restore: async () => {
    set({ loading: true, error: null });
    try {
      await initConnection();
      const purchases = await getAvailablePurchases();
      const hasPro = purchases?.some((p) => p.productId === PRO_PRODUCT_ID);
      if (hasPro) {
        await AsyncStorage.setItem(PRO_STORAGE_KEY, 'true');
        set({ isPro: true, loading: false });
        return true;
      }
      set({ error: 'No previous purchase found.', loading: false });
    } catch {
      set({ error: 'Restore failed. Check your connection.', loading: false });
    }
    return false;
  },

  clearError: () => set({ error: null }),
}));
