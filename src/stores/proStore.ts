import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  type Product,
  type Purchase,
  PurchaseError,
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
  // Dev only — unlock without payment
  devUnlock: () => void;
}

export const useProStore = create<ProState>((set, get) => ({
  isPro: false,
  loading: false,
  error: null,
  product: null,

  init: async () => {
    try {
      const stored = await AsyncStorage.getItem(PRO_STORAGE_KEY);
      if (stored === 'true') {
        set({ isPro: true });
        return;
      }
      await initConnection();
      const products = await getProducts({ skus: [PRO_PRODUCT_ID] });
      if (products.length > 0) {
        set({ product: products[0] });
      }
    } catch {
      // IAP not available in simulator — silently ignore
    }
  },

  purchase: async () => {
    set({ loading: true, error: null });
    try {
      await initConnection();
      const purchase: Purchase = await requestPurchase({ skus: [PRO_PRODUCT_ID] }) as Purchase;
      if (purchase) {
        await finishTransaction({ purchase, isConsumable: false });
        await AsyncStorage.setItem(PRO_STORAGE_KEY, 'true');
        set({ isPro: true, loading: false });
        return true;
      }
    } catch (e: any) {
      if (e instanceof PurchaseError && e.code === 'E_USER_CANCELLED') {
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
      const hasPro = purchases.some((p) => p.productId === PRO_PRODUCT_ID);
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

  devUnlock: () => {
    AsyncStorage.setItem(PRO_STORAGE_KEY, 'true');
    set({ isPro: true });
  },
}));
