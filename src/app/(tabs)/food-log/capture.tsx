import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Image, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, X, Warning, Image as ImageIcon, Sparkle, PlusCircle, ArrowRight, Pencil } from 'phosphor-react-native';

import { colors, spacing, typography } from '../../../constants/theme';
import { useFoodStore } from '../../../stores/foodStore';
import { MALAYSIAN_FOODS } from '../../../data/malaysian-foods';

const RAW_FOOD_CATEGORIES = ['raw', 'dairy', 'fruit'];
const rawFoods = MALAYSIAN_FOODS.filter(f => RAW_FOOD_CATEGORIES.includes(f.category));

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

export default function FoodCaptureScreen() {
  const { t } = useTranslation();
  const { mealType } = useLocalSearchParams<{ mealType: MealType }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [foodSearch, setFoodSearch] = useState('');
  const [showRawOnly, setShowRawOnly] = useState(false);
  const [manualFoodName, setManualFoodName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const { logFood, currentDateStr } = useFoodStore();
  const insets = useSafeAreaInsets();

  const sourceList = showRawOnly ? rawFoods : MALAYSIAN_FOODS;
  const filteredFoods = foodSearch.trim()
    ? sourceList.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 50)
    : sourceList.slice(0, 50);

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

  const handleSelectFood = async (food: typeof MALAYSIAN_FOODS[0]) => {
    try {
      await logFood({
        mealType: (mealType as MealType) ?? 'snack',
        foodName: food.name,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        servingQty: food.servingQty,
        servingUnit: food.servingUnit,
        source: 'local',
        dateStr: currentDateStr,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save food');
    }
  };

  const handleManualEntry = async () => {
    if (!manualFoodName.trim()) {
      Alert.alert('Error', 'Please enter food name');
      return;
    }
    try {
      await logFood({
        mealType: (mealType as MealType) ?? 'snack',
        foodName: manualFoodName,
        calories: parseFloat(manualCalories) || 0,
        proteinG: parseFloat(manualProtein) || 0,
        carbsG: parseFloat(manualCarbs) || 0,
        fatG: parseFloat(manualFat) || 0,
        servingQty: 1,
        servingUnit: 'serving',
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
            <View style={{ flex: 1 }}>
              <Text style={s.aiTitle}>Senarai Makanan</Text>
              <Text style={s.aiSubtitle}>Pilih atau cari makanan yang kau makan</Text>
            </View>
          </View>

          {/* Category toggle */}
          <View style={s.categoryToggle}>
            <TouchableOpacity
              style={[s.categoryBtn, !showRawOnly && s.categoryBtnActive]}
              onPress={() => setShowRawOnly(false)}
            >
              <Text style={[s.categoryBtnText, !showRawOnly && s.categoryBtnTextActive]}>Semua</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.categoryBtn, showRawOnly && s.categoryBtnActive]}
              onPress={() => setShowRawOnly(true)}
            >
              <Text style={[s.categoryBtnText, showRawOnly && s.categoryBtnTextActive]}>Bahan Mentah</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={s.searchContainer}>
            <TextInput
              style={s.searchInput}
              value={foodSearch}
              onChangeText={setFoodSearch}
              placeholder="Search foods..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Food list */}
          <ScrollView style={s.foodList} contentContainerStyle={s.foodListContent}>
            {filteredFoods.map((food, index) => (
              <TouchableOpacity
                key={index}
                style={s.foodItem}
                onPress={() => handleSelectFood(food)}
              >
                <View style={s.foodInfo}>
                  <Text style={s.foodName}>{food.name}</Text>
                  <Text style={s.foodServing}>{food.servingQty} {food.servingUnit}</Text>
                </View>
                <View style={s.foodNutrition}>
                  <Text style={s.foodCalories}>{food.calories} kcal</Text>
                  <Text style={s.foodMacros}>
                    P: {food.proteinG}g • C: {food.carbsG}g • F: {food.fatG}g
                  </Text>
                </View>
                <ArrowRight size={20} color={colors.textSecondary} weight="bold" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Manual buttons */}
          <View style={s.manualButtonsRow}>
            <TouchableOpacity 
              onPress={() => setShowManualEntry(true)} 
              style={s.manualBtnHalf}
            >
              <Pencil size={18} color={colors.primary} weight="bold" />
              <Text style={s.manualBtnText}>Enter Manually</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSearchInstead} style={s.manualBtnHalf}>
              <ArrowRight size={18} color={colors.primary} weight="bold" />
              <Text style={s.manualBtnText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : showManualEntry ? (
        <View style={s.suggestionsContainer}>
          <View style={[s.topBar, { paddingTop: insets.top + 8, backgroundColor: colors.white }]}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowManualEntry(false)}>
              <X size={28} weight="bold" color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.suggestionsTitle}>Enter Food Details</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={s.manualForm} contentContainerStyle={s.manualFormContent}>
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

            <TouchableOpacity onPress={handleManualEntry} style={s.confirmBtn}>
              <PlusCircle size={20} weight="fill" color={colors.white} />
              <Text style={s.confirmBtnText}>Add Food</Text>
            </TouchableOpacity>
          </ScrollView>
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
  
  // New styles for manual entry and buttons row
  manualButtonsRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  manualBtnHalf: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    padding: spacing.md, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  manualForm: { flex: 1, backgroundColor: colors.background },
  manualFormContent: { padding: spacing.lg, gap: spacing.md },
  inputGroup: { marginBottom: spacing.sm },
  inputLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...typography.body, color: colors.textPrimary, backgroundColor: colors.white,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  inputHalf: { flex: 1 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.md, marginTop: spacing.md,
  },
  confirmBtnText: { ...typography.body, fontWeight: '600', color: colors.textOnAccent },
  categoryToggle: {
    flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  categoryBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryBtnActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  categoryBtnText: { ...typography.label, color: colors.textSecondary, fontWeight: '500' },
  categoryBtnTextActive: { color: colors.white },
  searchContainer: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...typography.body, color: colors.textPrimary, backgroundColor: colors.background,
  },
});
