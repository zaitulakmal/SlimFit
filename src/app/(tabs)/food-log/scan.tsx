import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, X, Warning, Barcode, PlusCircle } from 'phosphor-react-native';

import { colors, spacing, typography } from '../../../constants/theme';
import { lookupBarcodeNix } from '../../../services/nutritionix';
import { lookupBarcodeOFF, type OFFFood } from '../../../services/openFoodFacts';
import { lookupBarcodeLocal } from '../../../services/localFoods';
import { useFoodStore } from '../../../stores/foodStore';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface ScannedFood {
  foodName: string;
  brandName?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
  source: string;
  barcode: string;
}

export default function BarcodeScanScreen() {
  const { t } = useTranslation();
  const { mealType } = useLocalSearchParams<{ mealType: MealType }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ScannedFood | null>(null);
  const [manualFoodName, setManualFoodName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const { logFood, currentDateStr } = useFoodStore();
  const insets = useSafeAreaInsets();

  const isManualEntry = preview?.source === 'manual';
  
  useEffect(() => {
    if (preview?.source === 'manual') {
      setManualFoodName(preview.foodName || '');
      setManualCalories('');
      setManualProtein('');
      setManualCarbs('');
      setManualFat('');
    }
  }, [preview]);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError('');
    setPreview(null);

    try {
      // Try local Malaysian foods first, then Nutritionix, then Open Food Facts
      let food: any = lookupBarcodeLocal(data);
      if (!food) food = await lookupBarcodeNix(data);
      if (!food) food = await lookupBarcodeOFF(data);

      if (food) {
        setError('');
        
        if (food.calories === 0 && food.proteinG === 0 && food.carbsG === 0 && food.fatG === 0 && food.source !== 'local') {
          // API found product but no nutrition data - allow manual entry
          setPreview({
            foodName: food.foodName || 'Unknown Food',
            brandName: food.brandName,
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            servingQty: 100,
            servingUnit: 'g',
            source: 'manual',
            barcode: data,
          });
        } else {
          setPreview({ ...food, barcode: data });
        }
      } else {
        // Barcode not found - allow manual entry
        setPreview({
          foodName: '',
          brandName: undefined,
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          servingQty: 100,
          servingUnit: 'g',
          source: 'manual',
          barcode: data,
        });
      }
    } catch {
      // Error - allow manual entry
      setPreview({
        foodName: '',
        brandName: undefined,
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        servingQty: 100,
        servingUnit: 'g',
        source: 'manual',
        barcode: data,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    
    const finalName = isManualEntry ? manualFoodName : preview.foodName;
    const finalCalories = isManualEntry ? parseFloat(manualCalories) || 0 : preview.calories;
    const finalProtein = isManualEntry ? parseFloat(manualProtein) || 0 : preview.proteinG;
    const finalCarbs = isManualEntry ? parseFloat(manualCarbs) || 0 : preview.carbsG;
    const finalFat = isManualEntry ? parseFloat(manualFat) || 0 : preview.fatG;
    
    if (!finalName.trim()) {
      Alert.alert('Error', 'Please enter food name');
      return;
    }
    
    try {
      await logFood({
        mealType: (mealType as MealType) ?? 'snack',
        foodName: finalName,
        brandName: preview.brandName ?? undefined,
        calories: finalCalories,
        proteinG: finalProtein,
        carbsG: finalCarbs,
        fatG: finalFat,
        servingQty: preview.servingQty,
        servingUnit: preview.servingUnit,
        source: 'manual',
        barcode: preview.barcode,
        dateStr: currentDateStr,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save food. Please try again.');
    }
  };

  const handleRetry = () => {
    setScanned(false);
    setError('');
    setPreview(null);
  };

  if (!permission) {
    return <View style={s.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={s.permissionContainer}>
        <Camera size={64} weight="regular" color={colors.border} />
        <Text style={s.permissionText}>{t('food.camera_permission')}</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>{t('food.grant_permission')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13', 'ean8', 'upc_a', 'upc_e',
            'code128', 'code39', 'code93',
            'itf14', 'codabar', 'qr', 'datamatrix',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
      />

      {/* Overlay */}
      <View style={s.overlay}>
        {/* Top bar */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <X size={28} weight="bold" color={colors.white} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>{t(`food.meal_${mealType ?? 'snack'}`)}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Scan frame — only show when not yet scanned */}
        {!preview && !loading && !error && (
          <View style={s.scanArea}>
            <View style={s.scanFrame}>
              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />
            </View>
            <Text style={s.scanHint}>{t('food.scan_hint')}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={s.centered}>
            <View style={s.statusBadge}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={s.statusText}>{t('food.looking_up')}</Text>
            </View>
          </View>
        )}

        {/* Error */}
        {error && !loading && !preview && (
          <View style={s.centered}>
            <View style={s.errorBadge}>
              <Warning size={24} weight="regular" color={colors.white} />
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleRetry} style={s.retryBtn}>
                <Text style={s.retryText}>{t('food.scan_again')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preview card — confirm before logging */}
        {preview && !loading && (
          <View style={s.previewContainer}>
            <ScrollView contentContainerStyle={s.previewCard} showsVerticalScrollIndicator={false}>
              {isManualEntry ? (
                <>
                  <Text style={s.manualTitle}>Enter Food Details</Text>
                  <Text style={s.manualBarcode}>Barcode: {preview.barcode}</Text>
                  
                  <View style={s.inputGroup}>
                    <Text style={s.inputLabel}>Food Name</Text>
                    <TextInput
                      style={s.input}
                      value={manualFoodName}
                      onChangeText={setManualFoodName}
                      placeholder="Enter food name"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  
                  <View style={s.inputRow}>
                    <View style={s.inputHalf}>
                      <Text style={s.inputLabel}>Calories</Text>
                      <TextInput
                        style={s.input}
                        value={manualCalories}
                        onChangeText={setManualCalories}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={s.inputHalf}>
                      <Text style={s.inputLabel}>Protein (g)</Text>
                      <TextInput
                        style={s.input}
                        value={manualProtein}
                        onChangeText={setManualProtein}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                  
                  <View style={s.inputRow}>
                    <View style={s.inputHalf}>
                      <Text style={s.inputLabel}>Carbs (g)</Text>
                      <TextInput
                        style={s.input}
                        value={manualCarbs}
                        onChangeText={setManualCarbs}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={s.inputHalf}>
                      <Text style={s.inputLabel}>Fat (g)</Text>
                      <TextInput
                        style={s.input}
                        value={manualFat}
                        onChangeText={setManualFat}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {preview.brandName ? (
                    <Text style={s.previewBrand}>{preview.brandName}</Text>
                  ) : null}
                  <Text style={s.previewName}>{preview.foodName}</Text>
                  <Text style={s.previewServing}>
                    Per {preview.servingQty}{preview.servingUnit}
                  </Text>

                  {/* Macro grid */}
                  <View style={s.macroGrid}>
                    <View style={s.macroBox}>
                      <Text style={[s.macroValue, { color: colors.amber }]}>{preview.calories}</Text>
                      <Text style={s.macroLabel}>kcal</Text>
                    </View>
                    <View style={s.macroBox}>
                      <Text style={s.macroValue}>{preview.proteinG}g</Text>
                      <Text style={s.macroLabel}>Protein</Text>
                    </View>
                    <View style={s.macroBox}>
                      <Text style={s.macroValue}>{preview.carbsG}g</Text>
                      <Text style={s.macroLabel}>Carbs</Text>
                    </View>
                    <View style={s.macroBox}>
                      <Text style={s.macroValue}>{preview.fatG}g</Text>
                      <Text style={s.macroLabel}>Fat</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Action buttons */}
              <View style={s.actionRow}>
                <TouchableOpacity style={s.retryBtnDark} onPress={handleRetry}>
                  <Barcode size={18} weight="regular" color={colors.textPrimary} />
                  <Text style={s.retryBtnText}>{t('food.scan_again')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
                  <PlusCircle size={18} weight="fill" color={colors.white} />
                  <Text style={s.confirmBtnText}>{t('food.add')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, padding: spacing.xl, gap: spacing.lg,
  },
  permissionText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  permBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderRadius: 12,
  },
  permBtnText: { ...typography.body, color: colors.textOnAccent },
  backLink: { padding: spacing.md },
  backLinkText: { ...typography.body, color: colors.textSecondary },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: spacing.md,
    paddingBottom: spacing.md, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  closeBtn: { padding: spacing.xs },
  topBarTitle: { ...typography.body, color: colors.white },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  scanFrame: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: colors.white },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  scanHint: { ...typography.body, color: colors.white, textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, borderRadius: 24,
  },
  statusText: { ...typography.body, color: colors.white },
  errorBadge: {
    alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(0,0,0,0.85)',
    marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: 16,
  },
  errorText: { ...typography.body, color: colors.white, textAlign: 'center' },
  retryBtn: {
    borderWidth: 1, borderColor: colors.white, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: 8, marginTop: spacing.xs,
  },
  retryText: { ...typography.body, color: colors.white },
  previewContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '55%',
  },
  previewCard: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, gap: spacing.sm,
  },
  previewBrand: { ...typography.label, color: colors.textSecondary },
  previewName: { ...typography.heading, color: colors.textPrimary },
  previewServing: { ...typography.label, color: colors.textSecondary },
  macroGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  macroBox: {
    flex: 1, alignItems: 'center', backgroundColor: colors.background,
    borderRadius: 10, paddingVertical: spacing.sm,
  },
  macroValue: { ...typography.body, color: colors.textPrimary },
  macroLabel: { ...typography.label, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  retryBtnDark: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingVertical: spacing.md, backgroundColor: colors.white,
  },
  retryBtnText: { ...typography.body, color: colors.textPrimary },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: spacing.md,
  },
  confirmBtnText: { ...typography.body, color: colors.textOnAccent },
  
  // Manual entry styles
  manualTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.xs },
  manualBarcode: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...typography.body, color: colors.textPrimary,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  inputHalf: { flex: 1 },
});
