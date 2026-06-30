import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Image, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, X, Image as ImageIcon, Sparkle, PlusCircle, ArrowRight, Pencil, CheckCircle, Images } from 'phosphor-react-native';

import { colors, spacing, typography } from '../../../constants/theme';
import { useFoodStore } from '../../../stores/foodStore';
import { MALAYSIAN_FOODS } from '../../../data/malaysian-foods';
import { detectFoodFromBase64, DetectedFood, DetectionError } from '../../../services/visionAI';
import { addCommunityFood } from '../../../services/communityFoods';

const RAW_FOOD_CATEGORIES = ['raw', 'dairy', 'fruit'];
const rawFoods = MALAYSIAN_FOODS.filter(f => RAW_FOOD_CATEGORIES.includes(f.category));

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type Screen = 'camera' | 'analyzing' | 'ai_results' | 'manual_list' | 'manual_entry';

export default function FoodCaptureScreen() {
  const { t } = useTranslation();
  const { mealType } = useLocalSearchParams<{ mealType: MealType }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [screen, setScreen] = useState<Screen>('camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<DetectedFood[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [showRawOnly, setShowRawOnly] = useState(false);
  const [manualFoodName, setManualFoodName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [editingFood, setEditingFood] = useState<DetectedFood | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { logFood, currentDateStr } = useFoodStore();
  const insets = useSafeAreaInsets();

  const sourceList = showRawOnly ? rawFoods : MALAYSIAN_FOODS;
  const filteredFoods = foodSearch.trim()
    ? sourceList.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 50)
    : sourceList.slice(0, 50);

  const analyzeImage = async (uri: string, base64: string) => {
    setCapturedUri(uri);
    setScreen('analyzing');
    const { foods, error, errorDetail } = await detectFoodFromBase64(base64);

    if (foods && foods.length > 0) {
      setAiResults(foods);
      setScreen('ai_results');
      return;
    }

    const errorMessages: Record<DetectionError, string> = {
      no_food: 'No food detected in this photo. Try a clearer shot with better lighting.',
      network_error: 'No internet connection. Please check your network and try again.',
      api_error: 'AI service error. Please try again in a moment.',
      parse_error: 'AI could not read this image. Try a different photo.',
    };

    const message = error ? errorMessages[error] : 'AI could not detect food. Please search manually.';
    Alert.alert('Could not detect food', message, [
      { text: 'Try again', onPress: () => setScreen('camera') },
      { text: 'Search manually', onPress: () => setScreen('manual_list') },
    ]);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: true, skipProcessing: false });
      if (!photo?.uri || !photo.base64) return;
      await analyzeImage(photo.uri, photo.base64);
    } catch (err) {
      Alert.alert('Error', `Failed to capture photo: ${err}`);
      setScreen('camera');
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.uri && result.assets[0]?.base64) {
      await analyzeImage(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const handleLogAiFood = async (food: DetectedFood) => {
    try {
      await logFood({
        mealType: (mealType as MealType) ?? 'snack',
        foodName: food.foodName,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        servingQty: food.servingQty,
        servingUnit: food.servingUnit,
        source: 'ai',
        dateStr: currentDateStr,
      });
      // High-confidence AI detections get cached into the shared community
      // database so the next photo of the same dish skips the vision API.
      if (food.confidence === 'high') {
        addCommunityFood({
          foodName: food.foodName,
          calories: food.calories,
          proteinG: food.proteinG,
          carbsG: food.carbsG,
          fatG: food.fatG,
          servingQty: food.servingQty,
          servingUnit: food.servingUnit,
        });
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save food');
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
    } catch {
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
    } catch {
      Alert.alert('Error', 'Failed to save food');
    }
  };

  const openEditFood = (food: DetectedFood) => {
    setEditingFood(food);
    setManualFoodName(food.foodName);
    setManualCalories(String(food.calories));
    setManualProtein(String(food.proteinG));
    setManualCarbs(String(food.carbsG));
    setManualFat(String(food.fatG));
    setScreen('manual_entry');
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setAiResults([]);
    setEditingFood(null);
    setScreen('camera');
  };

  const handleSearchInstead = () => {
    router.replace({ pathname: '/(tabs)/food-log/search', params: { mealType: mealType as string } });
  };

  const confidenceColor = (c: DetectedFood['confidence']) => {
    if (c === 'high') return colors.vividGreen;
    if (c === 'medium') return colors.amber;
    return colors.coral;
  };

  if (!permission) return <View style={s.root} />;

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

  // ── Camera screen ──────────────────────────────────────────────────────────
  if (screen === 'camera') {
    return (
      <View style={s.root}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back">
          <View style={s.overlay}>
            <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
                <X size={28} weight="bold" color={colors.white} />
              </TouchableOpacity>
              <Text style={s.topBarTitle}>{t(`food.meal_${mealType ?? 'snack'}`)}</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={s.captureArea}>
              <View style={s.captureFrame}>
                <View style={[s.corner, s.cornerTL]} />
                <View style={[s.corner, s.cornerTR]} />
                <View style={[s.corner, s.cornerBL]} />
                <View style={[s.corner, s.cornerBR]} />
              </View>
              <View style={s.aiLabel}>
                <Sparkle size={14} weight="fill" color={colors.white} />
                <Text style={s.aiLabelText}>AI will detect your food automatically</Text>
              </View>
            </View>

            <View style={[s.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
              <View style={s.captureRow}>
                {/* Gallery button (left) */}
                <TouchableOpacity style={s.sideBtn} onPress={handlePickFromGallery}>
                  <Images size={26} weight="regular" color={colors.white} />
                  <Text style={s.sideBtnText}>Gallery</Text>
                </TouchableOpacity>

                {/* Shutter (centre) */}
                <View style={s.captureBtnOuter}>
                  <TouchableOpacity style={s.captureBtnInner} onPress={handleCapture}>
                    <Camera size={28} weight="fill" color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Search (right) */}
                <TouchableOpacity style={s.sideBtn} onPress={handleSearchInstead}>
                  <ArrowRight size={26} weight="regular" color={colors.white} />
                  <Text style={s.sideBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // ── Analyzing screen ───────────────────────────────────────────────────────
  if (screen === 'analyzing') {
    return (
      <View style={[s.root, s.analyzingContainer]}>
        {capturedUri && (
          <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFillObject} blurRadius={4} />
        )}
        <View style={s.analyzingOverlay}>
          <View style={s.analyzingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.analyzingTitle}>Analyzing your food...</Text>
            <Text style={s.analyzingSubtitle}>AI is identifying calories & macros</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── AI Results screen ──────────────────────────────────────────────────────
  if (screen === 'ai_results') {
    return (
      <View style={s.root}>
        <View style={[s.topBar, s.topBarLight, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={s.closeBtn} onPress={handleRetake}>
            <X size={28} weight="bold" color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.suggestionsTitle}>AI Detected</Text>
          <View style={{ width: 44 }} />
        </View>

        {capturedUri && (
          <View style={s.imagePreview}>
            <Image source={{ uri: capturedUri }} style={s.previewImage} />
            <TouchableOpacity onPress={handleRetake} style={s.retakeBtn}>
              <Camera size={16} weight="regular" color={colors.white} />
              <Text style={s.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.aiResultsHeader}>
          <Sparkle size={18} weight="fill" color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.aiTitle}>{aiResults.length} item{aiResults.length !== 1 ? 's' : ''} detected</Text>
            <Text style={s.aiSubtitle}>Tap to log, or edit before saving</Text>
          </View>
        </View>

        <ScrollView style={s.foodList} contentContainerStyle={s.foodListContent}>
          {aiResults.map((food, i) => (
            <View key={i} style={s.aiResultCard}>
              <View style={s.aiResultTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.foodName}>{food.foodName}</Text>
                  <Text style={s.foodServing}>{food.servingQty} {food.servingUnit}</Text>
                  {food.notes && <Text style={s.aiNotes}>{food.notes}</Text>}
                </View>
                <View style={s.aiResultRight}>
                  <Text style={s.foodCalories}>{food.calories} kcal</Text>
                  <View style={[s.confidenceBadge, { backgroundColor: confidenceColor(food.confidence) + '20' }]}>
                    <Text style={[s.confidenceText, { color: confidenceColor(food.confidence) }]}>
                      {food.confidence}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={s.foodMacros}>
                P: {food.proteinG}g · C: {food.carbsG}g · F: {food.fatG}g
              </Text>
              <View style={s.aiResultActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEditFood(food)}>
                  <Pencil size={14} color={colors.textSecondary} weight="bold" />
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.logBtn} onPress={() => handleLogAiFood(food)}>
                  <CheckCircle size={16} color={colors.white} weight="fill" />
                  <Text style={s.logBtnText}>Log this</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={s.manualButtonsRow}>
          <TouchableOpacity onPress={() => setScreen('manual_list')} style={s.manualBtnHalf}>
            <ImageIcon size={18} color={colors.primary} weight="bold" />
            <Text style={s.manualBtnText}>Browse Foods</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEditingFood(null); setManualFoodName(''); setManualCalories(''); setManualProtein(''); setManualCarbs(''); setManualFat(''); setScreen('manual_entry'); }} style={s.manualBtnHalf}>
            <Pencil size={18} color={colors.primary} weight="bold" />
            <Text style={s.manualBtnText}>Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Manual list screen ─────────────────────────────────────────────────────
  if (screen === 'manual_list') {
    return (
      <View style={s.root}>
        <View style={[s.topBar, s.topBarLight, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={s.closeBtn} onPress={handleRetake}>
            <X size={28} weight="bold" color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.suggestionsTitle}>Select your food</Text>
          <View style={{ width: 44 }} />
        </View>

        {capturedUri && (
          <View style={s.imagePreview}>
            <Image source={{ uri: capturedUri }} style={s.previewImage} />
            <TouchableOpacity onPress={handleRetake} style={s.retakeBtn}>
              <Camera size={16} weight="regular" color={colors.white} />
              <Text style={s.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.aiResultsHeader}>
          <Sparkle size={18} weight="fill" color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.aiTitle}>Food List</Text>
            <Text style={s.aiSubtitle}>Select or search what you ate</Text>
          </View>
        </View>

        <View style={s.categoryToggle}>
          <TouchableOpacity style={[s.categoryBtn, !showRawOnly && s.categoryBtnActive]} onPress={() => setShowRawOnly(false)}>
            <Text style={[s.categoryBtnText, !showRawOnly && s.categoryBtnTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.categoryBtn, showRawOnly && s.categoryBtnActive]} onPress={() => setShowRawOnly(true)}>
            <Text style={[s.categoryBtnText, showRawOnly && s.categoryBtnTextActive]}>Raw Ingredients</Text>
          </TouchableOpacity>
        </View>

        <View style={s.searchContainer}>
          <TextInput
            style={s.searchInput}
            value={foodSearch}
            onChangeText={setFoodSearch}
            placeholder="Search foods..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <ScrollView style={s.foodList} contentContainerStyle={s.foodListContent}>
          {filteredFoods.map((food, index) => (
            <TouchableOpacity key={index} style={s.foodItem} onPress={() => handleSelectFood(food)}>
              <View style={s.foodInfo}>
                <Text style={s.foodName}>{food.name}</Text>
                <Text style={s.foodServing}>{food.servingQty} {food.servingUnit}</Text>
              </View>
              <View style={s.foodNutrition}>
                <Text style={s.foodCalories}>{food.calories} kcal</Text>
                <Text style={s.foodMacros}>P: {food.proteinG}g · C: {food.carbsG}g · F: {food.fatG}g</Text>
              </View>
              <ArrowRight size={20} color={colors.textSecondary} weight="bold" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.manualButtonsRow}>
          <TouchableOpacity onPress={() => { setEditingFood(null); setManualFoodName(''); setManualCalories(''); setManualProtein(''); setManualCarbs(''); setManualFat(''); setScreen('manual_entry'); }} style={s.manualBtnHalf}>
            <Pencil size={18} color={colors.primary} weight="bold" />
            <Text style={s.manualBtnText}>Enter Manually</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSearchInstead} style={s.manualBtnHalf}>
            <ArrowRight size={18} color={colors.primary} weight="bold" />
            <Text style={s.manualBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Manual entry screen ────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <View style={[s.topBar, s.topBarLight, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.closeBtn} onPress={() => setScreen(aiResults.length > 0 ? 'ai_results' : 'manual_list')}>
          <X size={28} weight="bold" color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.suggestionsTitle}>{editingFood ? 'Edit Food' : 'Enter Food Details'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={s.manualForm} contentContainerStyle={s.manualFormContent}>
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Food Name</Text>
          <TextInput style={s.input} value={manualFoodName} onChangeText={setManualFoodName} placeholder="Enter food name" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={s.inputRow}>
          <View style={s.inputHalf}>
            <Text style={s.inputLabel}>Calories</Text>
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

        <TouchableOpacity onPress={handleManualEntry} style={s.confirmBtn}>
          <PlusCircle size={20} weight="fill" color={colors.white} />
          <Text style={s.confirmBtnText}>Add Food</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const FRAME_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Permission
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, padding: spacing.xl, gap: spacing.lg },
  permissionText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12 },
  permBtnText: { ...typography.body, color: colors.textOnAccent },
  backLink: { padding: spacing.md },
  backLinkText: { ...typography.body, color: colors.textSecondary },

  // Camera
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topBarLight: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeBtn: { padding: spacing.xs },
  topBarTitle: { ...typography.body, color: colors.white, fontWeight: '600' },
  captureArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  captureFrame: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: colors.white },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20 },
  aiLabelText: { ...typography.label, color: colors.white },
  bottomBar: { width: '100%', paddingTop: spacing.lg, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: spacing.md },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  captureBtnOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  captureBtnInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  sideBtn: { alignItems: 'center', gap: 4, width: 64 },
  sideBtnText: { ...typography.label, color: colors.white, fontSize: 11 },

  // Analyzing
  analyzingContainer: { flex: 1 },
  analyzingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  analyzingCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.xl, alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.xl },
  analyzingTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary, fontSize: 17 },
  analyzingSubtitle: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },

  // Shared list screens
  suggestionsTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  imagePreview: { height: 180, position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  retakeBtn: { position: 'absolute', bottom: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 },
  retakeText: { ...typography.label, color: colors.white },
  aiResultsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  aiTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  aiSubtitle: { ...typography.label, color: colors.textSecondary },

  // AI result cards
  foodList: { flex: 1, backgroundColor: colors.background },
  foodListContent: { padding: spacing.md, gap: spacing.sm },
  aiResultCard: { backgroundColor: colors.white, borderRadius: 14, padding: spacing.md, gap: spacing.xs },
  aiResultTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  aiResultRight: { alignItems: 'flex-end', gap: spacing.xs },
  aiNotes: { ...typography.label, color: colors.textTertiary, marginTop: 2 },
  confidenceBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
  confidenceText: { fontSize: 11, fontWeight: '600' },
  aiResultActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  editBtnText: { ...typography.label, color: colors.textSecondary, fontWeight: '500' },
  logBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: 8, backgroundColor: colors.primary },
  logBtnText: { ...typography.label, color: colors.white, fontWeight: '600' },

  // Manual list
  foodItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, gap: spacing.md },
  foodInfo: { flex: 1 },
  foodName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  foodServing: { ...typography.label, color: colors.textSecondary },
  foodNutrition: { alignItems: 'flex-end' },
  foodCalories: { ...typography.body, fontWeight: '700', color: colors.primary },
  foodMacros: { ...typography.label, color: colors.textSecondary },
  categoryToggle: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  categoryBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryBtnText: { ...typography.label, color: colors.textSecondary, fontWeight: '500' },
  categoryBtnTextActive: { color: colors.white },
  searchContainer: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body, color: colors.textPrimary, backgroundColor: colors.background },

  // Manual entry
  manualForm: { flex: 1, backgroundColor: colors.background },
  manualFormContent: { padding: spacing.lg, gap: spacing.md },
  inputGroup: { marginBottom: spacing.sm },
  inputLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body, color: colors.textPrimary, backgroundColor: colors.white },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  inputHalf: { flex: 1 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.md, marginTop: spacing.md },
  confirmBtnText: { ...typography.body, fontWeight: '600', color: colors.textOnAccent },

  // Bottom buttons
  manualButtonsRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  manualBtnHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  manualBtnText: { ...typography.body, fontWeight: '600', color: colors.primary },
});
