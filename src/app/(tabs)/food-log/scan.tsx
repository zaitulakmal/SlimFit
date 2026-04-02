import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, spacing, typography } from '../../../constants/theme';
import { lookupBarcodeNix } from '../../../services/nutritionix';
import { lookupBarcodeOFF } from '../../../services/openFoodFacts';
import { useFoodStore } from '../../../stores/foodStore';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function BarcodeScanScreen() {
  const { t } = useTranslation();
  const { mealType } = useLocalSearchParams<{ mealType: MealType }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { logFood, currentDateStr } = useFoodStore();

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError('');

    // Try Nutritionix first, then Open Food Facts as free fallback
    let food = await lookupBarcodeNix(data);
    if (!food) food = await lookupBarcodeOFF(data) as any;
    setLoading(false);

    if (food) {
      await logFood({
        mealType: (mealType as MealType) ?? 'snack',
        foodName: food.foodName,
        brandName: food.brandName ?? undefined,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        servingQty: food.servingQty,
        servingUnit: food.servingUnit,
        source: food.source ?? 'nutritionix',
        nixItemId: (food as any).nixItemId ?? undefined,
        barcode: data,
        dateStr: currentDateStr,
      });
      router.back();
    } else {
      setError(t('food.barcode_not_found'));
    }
  };

  if (!permission) {
    return <View style={s.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={s.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.border} />
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
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
      />

      {/* Dark overlay with scan frame cutout */}
      <View style={s.overlay}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>{t(`food.meal_${mealType ?? 'snack'}`)}</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={s.scanArea}>
          <View style={s.scanFrame}>
            {/* Corner markers */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </View>
          <Text style={s.scanHint}>{t('food.scan_hint')}</Text>
        </View>

        {loading && (
          <View style={s.statusBadge}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={s.statusText}>{t('food.looking_up')}</Text>
          </View>
        )}

        {error && !loading && (
          <View style={s.errorBadge}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.white} />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setScanned(false);
                setError('');
              }}
              style={s.retryBtn}
            >
              <Text style={s.retryText}>{t('food.scan_again')}</Text>
            </TouchableOpacity>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  permBtnText: { ...typography.body, color: colors.textOnAccent },
  backLink: { padding: spacing.md },
  backLinkText: { ...typography.body, color: colors.textSecondary },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: { padding: spacing.xs },
  topBarTitle: { ...typography.body, color: colors.white },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.white,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  scanHint: { ...typography.body, color: colors.white, textAlign: 'center' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
    marginBottom: spacing.xl,
  },
  statusText: { ...typography.body, color: colors.white },
  errorBadge: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.8)',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  errorText: { ...typography.body, color: colors.white, textAlign: 'center' },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  retryText: { ...typography.body, color: colors.white },
});
