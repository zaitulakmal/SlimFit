import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, X, Warning, Image as ImageIcon, Sparkle, PlusCircle, ArrowRight } from 'phosphor-react-native';

import { colors, spacing, typography } from '../../../constants/theme';
import { useFoodStore } from '../../../stores/foodStore';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodFromPhoto {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
  imageUri?: string;
}

// Common foods with nutrition for quick selection
const COMMON_FOODS = [
  { name: 'Nasi Lemak', calories: 400, protein: 8, carbs: 45, fat: 18, unit: 'serving' },
  { name: 'Nasi Goreng', calories: 350, protein: 9, carbs: 50, fat: 12, unit: 'serving' },
  { name: 'Mee Goreng', calories: 380, protein: 10, carbs: 48, fat: 14, unit: 'serving' },
  { name: 'Roti Canai', calories: 250, protein: 6, carbs: 35, fat: 10, unit: 'piece' },
  { name: 'Nasi Putih', calories: 200, protein: 4, carbs: 45, fat: 1, unit: 'cup' },
  { name: 'Ayam Goreng', calories: 300, protein: 25, carbs: 15, fat: 18, unit: 'piece' },
  { name: 'Satay', calories: 150, protein: 12, carbs: 8, fat: 8, unit: 'stick' },
  { name: 'Laksa', calories: 450, protein: 15, carbs: 55, fat: 18, unit: 'bowl' },
  { name: 'Maggie Goreng', calories: 400, protein: 10, carbs: 52, fat: 16, unit: 'pack' },
  { name: 'Teh Tarik', calories: 120, protein: 3, carbs: 20, fat: 4, unit: 'cup' },
  { name: 'Kopi O', calories: 80, protein: 1, carbs: 15, fat: 2, unit: 'cup' },
  { name: 'Milo', calories: 150, protein: 4, carbs: 25, fat: 4, unit: 'cup' },
  { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, unit: 'medium' },
  { name: 'Apple', calories: 95, protein: 0, carbs: 25, fat: 0, unit: 'medium' },
  { name: 'Egg', calories: 70, protein: 6, carbs: 0, fat: 5, unit: 'piece' },
  { name: 'Rice Bowl', calories: 200, protein: 4, carbs: 45, fat: 1, unit: 'bowl' },
  { name: 'Chicken Rice', calories: 350, protein: 25, carbs: 40, fat: 10, unit: 'serving' },
  { name: 'Porridge', calories: 150, protein: 5, carbs: 25, fat: 3, unit: 'bowl' },
];

export default function FoodCaptureScreen() {
  const { t } = useTranslation();
  const { mealType } = useLocalSearchParams<{ mealType: MealType }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { logFood, currentDateStr } = useFoodStore();
  const insets = useSafeAreaInsets();

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const handleSelectFood = async (food: typeof COMMON_FOODS[0]) => {
    try {
      await logFood({
        mealType: (mealType as MealType) ?? 'snack',
        foodName: food.name,
        calories: food.calories,
        proteinG: food.protein,
        carbsG: food.carbs,
        fatG: food.fat,
        servingQty: 1,
        servingUnit: food.unit,
        source: 'manual',
        dateStr: currentDateStr,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save food');
    }
  };

  const handleSearchInstead = () => {
    router.replace({
      pathname: '/(tabs)/food-log/search',
      params: { mealType: mealType as string },
    });
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setShowSuggestions(false);
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
      {/* Show captured image or camera */}
      {!capturedUri ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
        >
          {/* Overlay */}
          <View style={s.overlay}>
            {/* Top bar */}
            <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
                <X size={28} weight="bold" color={colors.white} />
              </TouchableOpacity>
              <Text style={s.topBarTitle}>
                {t(`food.meal_${mealType ?? 'snack'}`)}
              </Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Capture area */}
            <View style={s.captureArea}>
              <View style={s.captureFrame}>
                <View style={[s.corner, s.cornerTL]} />
                <View style={[s.corner, s.cornerTR]} />
                <View style={[s.corner, s.cornerBL]} />
                <View style={[s.corner, s.cornerBR]} />
              </View>
              <Text style={s.captureHint}>Point at your food and capture</Text>
            </View>

            {/* Capture button */}
            <View style={[s.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
              <View style={s.captureBtnOuter}>
                <TouchableOpacity
                  style={s.captureBtnInner}
                  onPress={handleCapture}
                  disabled={capturing}
                >
                  {capturing ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Camera size={28} weight="fill" color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleSearchInstead} style={s.searchLink}>
                <Text style={s.searchLinkText}>Search instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      ) : showSuggestions ? (
        <View style={s.suggestionsContainer}>
          {/* Top bar */}
          <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={s.closeBtn} onPress={handleRetake}>
              <X size={28} weight="bold" color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.suggestionsTitle}>Select your food</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Captured image preview */}
          <View style={s.imagePreview}>
            <Image source={{ uri: capturedUri }} style={s.previewImage} />
            <TouchableOpacity onPress={handleRetake} style={s.retakeBtn}>
              <Camera size={16} weight="regular" color={colors.white} />
              <Text style={s.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>

          {/* AI Suggestion header */}
          <View style={s.aiHeader}>
            <Sparkle size={18} weight="fill" color={colors.primary} />
            <Text style={s.aiTitle}>Common Malaysian Foods</Text>
            <Text style={s.aiSubtitle}>Select what you ate</Text>
          </View>

          {/* Food list */}
          <ScrollView style={s.foodList} contentContainerStyle={s.foodListContent}>
            {COMMON_FOODS.map((food, index) => (
              <TouchableOpacity
                key={index}
                style={s.foodItem}
                onPress={() => handleSelectFood(food)}
              >
                <View style={s.foodInfo}>
                  <Text style={s.foodName}>{food.name}</Text>
                  <Text style={s.foodServing}>1 {food.unit}</Text>
                </View>
                <View style={s.foodNutrition}>
                  <Text style={s.foodCalories}>{food.calories} kcal</Text>
                  <Text style={s.foodMacros}>
                    P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                  </Text>
                </View>
                <ArrowRight size={20} color={colors.textSecondary} weight="bold" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Manual search button */}
          <TouchableOpacity onPress={handleSearchInstead} style={s.manualBtn}>
            <Text style={s.manualBtnText}>Search manually</Text>
            <ArrowRight size={18} color={colors.primary} weight="bold" />
          </TouchableOpacity>
        </View>
      ) : null}
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
  permissionText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },
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
  topBarTitle: { ...typography.body, color: colors.white, fontWeight: '600' },
  captureArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  captureFrame: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: colors.white },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  captureHint: { ...typography.body, color: colors.white, textAlign: 'center' },
  bottomBar: {
    width: '100%', alignItems: 'center', paddingTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: spacing.md,
  },
  captureBtnOuter: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnInner: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  searchLink: { marginTop: spacing.md, padding: spacing.sm },
  searchLinkText: { ...typography.body, color: colors.white, textDecorationLine: 'underline' },

  // Suggestions screen
  suggestionsContainer: { flex: 1, backgroundColor: colors.background },
  suggestionsTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  imagePreview: { height: 180, position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  retakeBtn: {
    position: 'absolute', bottom: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 20,
  },
  retakeText: { ...typography.label, color: colors.white },
  aiHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  aiTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  aiSubtitle: { ...typography.label, color: colors.textSecondary },
  foodList: { flex: 1 },
  foodListContent: { padding: spacing.md, gap: spacing.sm },
  foodItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    padding: spacing.md, borderRadius: 12, gap: spacing.md,
  },
  foodInfo: { flex: 1 },
  foodName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  foodServing: { ...typography.label, color: colors.textSecondary },
  foodNutrition: { alignItems: 'flex-end' },
  foodCalories: { ...typography.body, fontWeight: '700', color: colors.primary },
  foodMacros: { ...typography.label, color: colors.textSecondary },
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.lg, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border,
  },
  manualBtnText: { ...typography.body, fontWeight: '600', color: colors.primary },
});
