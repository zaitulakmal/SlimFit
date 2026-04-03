import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Barcode, MagnifyingGlass, X } from 'phosphor-react-native';

import { colors, spacing, typography } from '../../../constants/theme';
import { useFoodStore } from '../../../stores/foodStore';
import { searchLocalFoods, type LocalFood } from '../../../data/malaysian-foods';
import { searchFoodsNix, type NixFood } from '../../../services/nutritionix';
import { searchFoodsOFF, type OFFFood } from '../../../services/openFoodFacts';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodItem {
  id: string;
  foodName: string;
  brandName?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
  source: string;
  nixItemId?: string;
}

function localToItem(f: LocalFood): FoodItem {
  return {
    id: f.id,
    foodName: f.name,
    calories: f.calories,
    proteinG: f.proteinG,
    carbsG: f.carbsG,
    fatG: f.fatG,
    servingQty: f.servingQty,
    servingUnit: f.servingUnit,
    source: 'local',
  };
}

function nixToItem(f: NixFood, idx: number): FoodItem {
  return {
    id: `nix-${idx}-${f.foodName}`,
    foodName: f.foodName,
    brandName: f.brandName,
    calories: f.calories,
    proteinG: f.proteinG,
    carbsG: f.carbsG,
    fatG: f.fatG,
    servingQty: f.servingQty,
    servingUnit: f.servingUnit,
    source: 'nutritionix',
    nixItemId: f.nixItemId,
  };
}

function offToItem(f: OFFFood, idx: number): FoodItem {
  return {
    id: `off-${idx}-${f.foodName}`,
    foodName: f.foodName,
    brandName: f.brandName,
    calories: f.calories,
    proteinG: f.proteinG,
    carbsG: f.carbsG,
    fatG: f.fatG,
    servingQty: f.servingQty,
    servingUnit: f.servingUnit,
    source: 'openfoodfacts',
  };
}

export default function FoodSearchScreen() {
  const { t } = useTranslation();
  const { mealType } = useLocalSearchParams<{ mealType: MealType }>();
  const insets = useSafeAreaInsets();
  const { logFood, currentDateStr } = useFoodStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>(() =>
    searchLocalFoods('').map(localToItem)
  );
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState('1');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(searchLocalFoods('').map(localToItem));
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const local = searchLocalFoods(query).map(localToItem);
      const [nixResults, offResults] = await Promise.all([
        searchFoodsNix(query),
        searchFoodsOFF(query),
      ]);
      const nix = nixResults.map(nixToItem);
      const off = offResults.map(offToItem);
      // Local first, then Nutritionix, then Open Food Facts — dedupe by name
      const seen = new Set(local.map((f) => f.foodName.toLowerCase()));
      const merged = [...local];
      for (const f of [...nix, ...off]) {
        if (!seen.has(f.foodName.toLowerCase())) {
          seen.add(f.foodName.toLowerCase());
          merged.push(f);
        }
      }
      setResults(merged);
      setLoading(false);
    }, 450);
  }, [query]);

  const handleSelect = (item: FoodItem) => {
    setSelected(item);
    setQty(String(item.servingQty));
  };

  const handleAdd = async () => {
    if (!selected || !mealType) return;
    const qtyNum = parseFloat(qty) || 1;
    const ratio = qtyNum / selected.servingQty;
    await logFood({
      mealType,
      foodName: selected.foodName,
      brandName: selected.brandName ?? undefined,
      calories: selected.calories * ratio,
      proteinG: selected.proteinG * ratio,
      carbsG: selected.carbsG * ratio,
      fatG: selected.fatG * ratio,
      servingQty: qtyNum,
      servingUnit: selected.servingUnit,
      source: selected.source,
      nixItemId: selected.nixItemId ?? undefined,
      dateStr: currentDateStr,
    });
    router.back();
  };

  const scaledCalories = selected
    ? Math.round(selected.calories * ((parseFloat(qty) || 1) / selected.servingQty))
    : 0;

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} accessibilityLabel={t('common.back')}>
          <ArrowLeft size={24} weight="regular" color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t(`food.meal_${mealType ?? 'breakfast'}`)}</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/(tabs)/food-log/scan', params: { mealType } })
          }
          style={s.scanBtn}
          accessibilityLabel="Scan barcode"
        >
          <Barcode size={24} weight="regular" color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={s.searchContainer}>
        <MagnifyingGlass size={18} weight="regular" color={colors.textSecondary} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('food.search_placeholder')}
          placeholderTextColor={colors.textSecondary}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {/* Selected item confirm panel */}
      {selected && (
        <View style={s.confirmPanel}>
          <View style={s.confirmInfo}>
            <Text style={s.confirmName} numberOfLines={1}>
              {selected.foodName}
            </Text>
            <Text style={s.confirmMacros}>
              {scaledCalories} kcal · P {Math.round(selected.proteinG * ((parseFloat(qty) || 1) / selected.servingQty))}g
              · C {Math.round(selected.carbsG * ((parseFloat(qty) || 1) / selected.servingQty))}g
              · F {Math.round(selected.fatG * ((parseFloat(qty) || 1) / selected.servingQty))}g
            </Text>
          </View>
          <View style={s.confirmActions}>
            <View style={s.qtyRow}>
              <TextInput
                style={s.qtyInput}
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={s.qtyUnit} numberOfLines={1}>
                {selected.servingUnit}
              </Text>
            </View>
            <TouchableOpacity style={s.addConfirmBtn} onPress={handleAdd}>
              <Text style={s.addConfirmText}>{t('food.add')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelected(null)} style={s.cancelBtn}>
              <X size={20} weight="bold" color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Results list */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.resultRow, selected?.id === item.id && s.resultRowSelected]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
          >
            <View style={s.resultInfo}>
              <Text style={s.resultName} numberOfLines={1}>
                {item.foodName}
              </Text>
              {item.brandName ? (
                <Text style={s.resultBrand} numberOfLines={1}>
                  {item.brandName}
                </Text>
              ) : null}
              <Text style={s.resultSub}>
                {item.servingQty} {item.servingUnit} · {Math.round(item.calories)} kcal
              </Text>
            </View>
            <View style={s.macroPills}>
              <Text style={s.macroPill}>P {Math.round(item.proteinG)}g</Text>
              <Text style={s.macroPill}>C {Math.round(item.carbsG)}g</Text>
              <Text style={s.macroPill}>F {Math.round(item.fatG)}g</Text>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          !query.trim() ? (
            <Text style={s.listHeader}>{t('food.popular_malaysian')}</Text>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyState}>
              <MagnifyingGlass size={40} weight="regular" color={colors.border} />
              <Text style={s.emptyText}>{t('food.no_results')}</Text>
            </View>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.heading, color: colors.textPrimary, flex: 1 },
  scanBtn: { padding: spacing.xs },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  confirmPanel: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.selectedTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  confirmInfo: { gap: 2 },
  confirmName: { ...typography.body, color: colors.textPrimary },
  confirmMacros: { ...typography.label, color: colors.textSecondary },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  qtyInput: {
    ...typography.body,
    color: colors.textPrimary,
    minWidth: 36,
    textAlign: 'center',
    padding: 0,
  },
  qtyUnit: {
    ...typography.label,
    color: colors.textSecondary,
    maxWidth: 80,
  },
  addConfirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addConfirmText: { ...typography.body, color: colors.textOnAccent },
  cancelBtn: { padding: spacing.xs },
  listHeader: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  resultRowSelected: {
    backgroundColor: colors.selectedTint,
  },
  resultInfo: { flex: 1 },
  resultName: { ...typography.body, color: colors.textPrimary },
  resultBrand: { ...typography.label, color: colors.textSecondary },
  resultSub: { ...typography.label, color: colors.textSecondary, marginTop: 2 },
  macroPills: { gap: 2, alignItems: 'flex-end' },
  macroPill: { ...typography.label, color: colors.textSecondary },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
