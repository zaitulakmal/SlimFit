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
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Barcode, MagnifyingGlass, X, Camera, Plus, PlusCircle } from 'phosphor-react-native';

import { pastelColors as colors, pastelSpacing as spacing, pastelTypography as typography } from '../../../constants/pastel-theme';
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

  const addScale = useSharedValue(1);

  const addBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

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

  const handleDismissSheet = () => {
    setSelected(null);
  };

  const handleAdd = async () => {
    if (!selected || !mealType) return;
    addScale.value = withSequence(
      withSpring(0.92, { damping: 12, stiffness: 300 }),
      withSpring(1.06, { damping: 10, stiffness: 250 }),
      withTiming(1, { duration: 150 }),
    );
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

  const handleManualAdd = async () => {
    if (!manualName.trim()) {
      Alert.alert('Error', 'Sila masukkan nama makanan');
      return;
    }
    if (!mealType) return;
    await logFood({
      mealType,
      foodName: manualName.trim(),
      calories: parseFloat(manualCalories) || 0,
      proteinG: parseFloat(manualProtein) || 0,
      carbsG: parseFloat(manualCarbs) || 0,
      fatG: parseFloat(manualFat) || 0,
      servingQty: 1,
      servingUnit: 'serving',
      source: 'manual',
      dateStr: currentDateStr,
    });
    setShowManualModal(false);
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
      {/* Navy header + search section */}
      <View style={[s.navySection, { paddingTop: insets.top + 12 }]}>
        {/* Icon row */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} accessibilityLabel={t('common.back')}>
            <ArrowLeft size={24} weight="regular" color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t(`food.meal_${mealType ?? 'breakfast'}`)}</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/(tabs)/food-log/scan', params: { mealType } })
            }
            style={s.scanBtn}
            accessibilityLabel="Scan barcode"
          >
            <Barcode size={24} weight="regular" color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/(tabs)/food-log/capture', params: { mealType } })
            }
            style={s.scanBtn}
            accessibilityLabel="Capture food"
          >
            <Camera size={24} weight="regular" color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowManualModal(true)}
            style={s.scanBtn}
            accessibilityLabel="Add manually"
          >
            <Plus size={24} weight="bold" color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        {/* Search bar — inside navy section */}
        <View style={s.searchContainer}>
          <MagnifyingGlass size={18} weight="regular" color="rgba(255,255,255,0.6)" />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('food.search_placeholder')}
            placeholderTextColor="rgba(255,255,255,0.45)"
            autoFocus
            returnKeyType="search"
          />
          {loading && <ActivityIndicator size="small" color="#F0C808" />}
        </View>
      </View>

      {/* Results list */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: selected ? 320 : 40 }}
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
              <TouchableOpacity style={s.manualEntryBtn} onPress={() => setShowManualModal(true)}>
                <Plus size={18} weight="bold" color={colors.white} />
                <Text style={s.manualEntryBtnText}>Add Manually</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={null}
      />

      {/* Manual Entry Modal */}
      <Modal visible={showManualModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[s.modalHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => setShowManualModal(false)} style={s.backBtn}>
              <X size={24} weight="bold" color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Add Food</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={s.modalBody} contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Food Name *</Text>
              <TextInput
                style={s.input}
                value={manualName}
                onChangeText={setManualName}
                placeholder="e.g. Chicken breast, Rice..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            </View>
            <View style={s.inputRow}>
              <View style={s.inputHalf}>
                <Text style={s.inputLabel}>Calories (kcal)</Text>
                <TextInput style={s.input} value={manualCalories} onChangeText={setManualCalories} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={s.inputHalf}>
                <Text style={s.inputLabel}>Protein (g)</Text>
                <TextInput style={s.input} value={manualProtein} onChangeText={setManualProtein} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            <View style={s.inputRow}>
              <View style={s.inputHalf}>
                <Text style={s.inputLabel}>Carbs (g)</Text>
                <TextInput style={s.input} value={manualCarbs} onChangeText={setManualCarbs} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={s.inputHalf}>
                <Text style={s.inputLabel}>Fat (g)</Text>
                <TextInput style={s.input} value={manualFat} onChangeText={setManualFat} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            <TouchableOpacity style={s.addManualBtn} onPress={handleManualAdd}>
              <PlusCircle size={20} weight="fill" color={colors.white} />
              <Text style={s.addManualBtnText}>Add to Log</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom sheet as transparent Modal — guaranteed above everything */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={handleDismissSheet}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={s.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleDismissSheet}
            activeOpacity={1}
          />
          <View style={s.bottomSheet}>
            <View style={s.sheetHandle} />

            {/* Header: name + close */}
            <View style={s.sheetTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetTitle} numberOfLines={2}>{selected?.foodName}</Text>
                {selected?.brandName ? (
                  <Text style={s.sheetBrand}>{selected.brandName}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={handleDismissSheet} style={s.sheetClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <X size={22} weight="bold" color="rgba(26,43,92,0.7)" />
              </TouchableOpacity>
            </View>

            {/* Nutrition grid */}
            <View style={s.nutritionGrid}>
              {[
                { label: 'Calories', value: String(scaledCalories), unit: 'kcal' },
                { label: 'Protein',  value: String(Math.round((selected?.proteinG ?? 0) * ((parseFloat(qty)||1) / (selected?.servingQty ?? 1)))), unit: 'g' },
                { label: 'Carbs',    value: String(Math.round((selected?.carbsG   ?? 0) * ((parseFloat(qty)||1) / (selected?.servingQty ?? 1)))), unit: 'g' },
                { label: 'Fat',      value: String(Math.round((selected?.fatG     ?? 0) * ((parseFloat(qty)||1) / (selected?.servingQty ?? 1)))), unit: 'g' },
              ].map((item) => (
                <View key={item.label} style={s.nutritionItem}>
                  <Text style={s.nutritionValue}>{item.value}<Text style={s.nutritionUnit}>{item.unit}</Text></Text>
                  <Text style={s.nutritionLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Serving size row */}
            <View style={s.servingRow}>
              <Text style={s.servingLabel}>Serving size</Text>
              <View style={s.qtyRow}>
                <TextInput
                  style={s.qtyInput}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={s.qtyUnit} numberOfLines={1}>{selected?.servingUnit}</Text>
              </View>
            </View>

            {/* Add button — full width, always visible */}
            <Animated.View style={addBtnStyle}>
              <TouchableOpacity style={s.addConfirmBtn} onPress={handleAdd} activeOpacity={0.85}>
                <PlusCircle size={20} weight="fill" color="#FFFFFF" />
                <Text style={s.addConfirmText}>Add to Log</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  navySection: {
    backgroundColor: '#1A2B5C',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.heading, color: '#FFFFFF', flex: 1 },
  scanBtn: { padding: spacing.xs },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: '#FFFFFF',
    padding: 0,
  },
  // Amber bottom sheet (inside transparent Modal)
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottomSheet: {
    backgroundColor: '#F0C808',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    shadowColor: '#1A2B5C',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: 'rgba(26,43,92,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  sheetTitle: { fontSize: 22, fontWeight: '900', color: '#1A2B5C', letterSpacing: -0.5 },
  sheetBrand: { fontSize: 12, fontWeight: '500', color: 'rgba(26,43,92,0.6)', marginTop: 2 },
  sheetClose: { padding: 4, marginTop: 2 },
  nutritionGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  nutritionItem: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 16, padding: 12,
  },
  nutritionValue: { fontSize: 18, fontWeight: '900', color: '#1A2B5C' },
  nutritionUnit: { fontSize: 11, fontWeight: '600' },
  nutritionLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(26,43,92,0.65)', marginTop: 2 },
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  servingLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(26,43,92,0.7)' },
  sheetActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(26,43,92,0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    gap: 6,
  },
  qtyInput: {
    ...typography.body,
    color: '#1A2B5C',
    minWidth: 36,
    textAlign: 'center',
    padding: 0,
    fontWeight: '800',
    fontSize: 16,
  },
  qtyUnit: {
    ...typography.label,
    color: 'rgba(26,43,92,0.65)',
    maxWidth: 80,
    fontWeight: '600',
  },
  addConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A2B5C',
    borderRadius: 18,
    paddingVertical: 16,
    width: '100%',
  },
  addConfirmText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  listHeader: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: '#1A2B5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.sm,
  },
  resultRowSelected: {
    borderWidth: 2,
    borderColor: '#F0C808',
    backgroundColor: '#FFFBF0',
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: '#1A2B5C' },
  resultBrand: { ...typography.label, color: colors.textSecondary },
  resultSub: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 2 },
  macroPills: { gap: 2, alignItems: 'flex-end' },
  macroPill: { fontSize: 11, fontWeight: '600', color: '#9AA3C0' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  manualEntryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#F1C045', paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderRadius: 12, marginTop: spacing.sm,
  },
  manualEntryBtnText: { ...typography.body, fontWeight: '700', color: '#4A4A4A' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  modalBody: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.lg, gap: spacing.md },
  inputGroup: { marginBottom: spacing.sm },
  inputLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...typography.body, color: colors.textPrimary, backgroundColor: colors.white,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  inputHalf: { flex: 1 },
  addManualBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: '#F1C045', borderRadius: 12, paddingVertical: spacing.md, marginTop: spacing.md,
  },
  addManualBtnText: { ...typography.body, fontWeight: '700', color: '#4A4A4A' },
});
