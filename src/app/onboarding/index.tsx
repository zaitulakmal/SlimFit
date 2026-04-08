/**
 * Onboarding wizard — Duolingo-style redesign.
 * Keeps all existing logic, only UI layer changed.
 * 
 * Steps:
 *   1  Welcome           No input — intro screen
 *   2  Name              Optional text input (Skip link)
 *   3  Gender            Required — Male / Female cards
 *   4  Age               Required — numeric input (13-120)
 *   5  Height + Weight   Both required (height 50-300, weight 20-500)
 *   6  Activity Level    Required — 4 selectable ActivityCards
 *   7  Goal              Target weight required, deadline optional (Skip link)
 *   8  TDEE Summary      Read-only calculated results, "Start Tracking" CTA
 */

import { useState, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, spacing, radius, shadow } from '../../constants/theme-new';
import type { TextStyle } from 'react-native';

const tx = (style: TextStyle): TextStyle => style;
const typography = {
  displayLarge: tx({ fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5 }),
  display: tx({ fontSize: 28, fontWeight: '800', lineHeight: 34, letterSpacing: -0.4 }),
  heading: tx({ fontSize: 22, fontWeight: '700', lineHeight: 28, letterSpacing: -0.3 }),
  title: tx({ fontSize: 18, fontWeight: '700', lineHeight: 24, letterSpacing: -0.2 }),
  subtitle: tx({ fontSize: 16, fontWeight: '600', lineHeight: 22, letterSpacing: -0.1 }),
  body: tx({ fontSize: 15, fontWeight: '500', lineHeight: 22 }),
  bodySm: tx({ fontSize: 14, fontWeight: '500', lineHeight: 20 }),
  label: tx({ fontSize: 13, fontWeight: '600', lineHeight: 18 }),
  caption: tx({ fontSize: 12, fontWeight: '500', lineHeight: 16 }),
  micro: tx({ fontSize: 11, fontWeight: '600', lineHeight: 14 }),
} as const;
import {
  calculateTDEE,
  calculateBMI,
  roundTDEE,
  getBMICategory,
  type Gender,
  type ActivityLevel,
  type BMICategory,
} from '../../constants/tdee';
import { useProfileStore } from '../../stores/profileStore';
import StepProgress from '../../components/onboarding/StepProgress';
import ActivityCard from '../../components/onboarding/ActivityCard';

interface FormData {
  name: string;
  gender: Gender | null;
  age: string;
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel | null;
  targetWeightKg: string;
  deadline: string;
}

const TOTAL_STEPS = 8;

function bmiChipColor(category: BMICategory): string {
  switch (category) {
    case 'normal': return colors.primary;
    case 'overweight': return colors.accent;
    case 'obese': return colors.danger;
    default: return colors.secondary;
  }
}

// Animated CTA Button
function CTAButton({ title, onPress, disabled, loading }: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[ctaStyles.btn, disabled && ctaStyles.btnDisabled]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 180 }); }}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <Text style={ctaStyles.btnText}>{title}</Text>
        {!disabled && !loading && <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const ctaStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
  },
  btnDisabled: {
    backgroundColor: colors.textTertiary,
    opacity: 0.7,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

// Gender card with animation
function GenderCard({ value, labelKey, selected, onPress }: {
  value: Gender;
  labelKey: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, genderStyles.cardWrapper]}>
      <TouchableOpacity
        style={[genderStyles.card, selected && genderStyles.cardSelected]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={1}
      >
        <Ionicons
          name={value === 'male' ? 'man' : 'woman'}
          size={48}
          color={selected ? colors.primary : colors.textSecondary}
        />
        <Text style={[genderStyles.label, selected && genderStyles.labelSelected]}>
          {t(labelKey)}
        </Text>
        {selected && (
          <View style={genderStyles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} weight="fill" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const genderStyles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.xl,
    position: 'relative',
    minHeight: 120,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  checkmark: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
});

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const saveProfile = useProfileStore((s) => s.saveProfile);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    gender: null,
    age: '',
    heightCm: '',
    weightKg: '',
    activityLevel: null,
    targetWeightKg: '',
    deadline: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = useCallback((): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (step === 3 && !formData.gender) errs.gender = t('common.error_calc');
    if (step === 4) {
      const age = parseInt(formData.age, 10);
      if (!formData.age || isNaN(age) || age < 13 || age > 120) errs.age = 'Age must be between 13 and 120';
    }
    if (step === 5) {
      const h = parseFloat(formData.heightCm);
      const w = parseFloat(formData.weightKg);
      if (!formData.heightCm || isNaN(h) || h < 50 || h > 300) errs.heightCm = 'Height must be between 50 and 300 cm';
      if (!formData.weightKg || isNaN(w) || w < 20 || w > 500) errs.weightKg = 'Weight must be between 20 and 500 kg';
    }
    if (step === 6 && !formData.activityLevel) errs.activityLevel = 'Please select an activity level';
    if (step === 7) {
      const tw = parseFloat(formData.targetWeightKg);
      if (!formData.targetWeightKg || isNaN(tw) || tw < 20 || tw > 500) errs.targetWeightKg = 'Target weight must be between 20 and 500 kg';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [step, formData, t]);

  const goNext = useCallback(() => {
    if (!validate()) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step, validate]);

  const goBack = useCallback(() => {
    if (step > 1) { setErrors({}); setStep((s) => s - 1); }
  }, [step]);

  const skip = useCallback(() => { setErrors({}); setStep((s) => s + 1); }, []);

  const handleStartTracking = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveProfile({
        name: formData.name.trim() || null,
        gender: formData.gender!,
        age: parseInt(formData.age, 10),
        heightCm: parseFloat(formData.heightCm),
        weightKg: parseFloat(formData.weightKg),
        activityLevel: formData.activityLevel!,
        targetWeightKg: parseFloat(formData.targetWeightKg),
        deadline: formData.deadline.trim() || null,
        language: 'en',
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', t('common.error_save'));
    } finally {
      setSaving(false);
    }
  }, [saving, saveProfile, formData, router, t]);

  const summaryTDEE =
    formData.gender && formData.activityLevel
      ? roundTDEE(calculateTDEE(
          formData.gender,
          parseFloat(formData.weightKg) || 0,
          parseFloat(formData.heightCm) || 0,
          parseInt(formData.age, 10) || 0,
          formData.activityLevel
        ))
      : 0;

  const summaryBMI =
    parseFloat(formData.weightKg) && parseFloat(formData.heightCm)
      ? parseFloat(calculateBMI(parseFloat(formData.weightKg), parseFloat(formData.heightCm)).toFixed(1))
      : 0;

  const summaryBMICategory = summaryBMI > 0 ? getBMICategory(summaryBMI) : 'normal';
  const formattedTDEE = summaryTDEE.toLocaleString();

  const stepIcons: Record<number, keyof typeof Ionicons.glyphMap> = {
    1: 'fitness',
    2: 'happy',
    3: 'people',
    4: 'calendar',
    5: 'resize',
    6: 'flash',
    7: 'flag',
    8: 'trophy',
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View entering={FadeIn.springify()} style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.welcome_title')}</Text>
            <Text style={styles.bodySecondary}>{t('onboarding.welcome_sub')}</Text>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View entering={FadeInDown.springify()} style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.name_label')}</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(v) => setFormData((f) => ({ ...f, name: v }))}
              placeholder="e.g. Alex"
              placeholderTextColor={colors.textPlaceholder}
              returnKeyType="next"
              autoCapitalize="words"
            />
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View entering={FadeInUp.springify()} style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.gender_label')}</Text>
            {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
            <View style={styles.genderRow}>
              <GenderCard value="male" labelKey="onboarding.gender_male" selected={formData.gender === 'male'} onPress={() => { setFormData((f) => ({ ...f, gender: 'male' })); setErrors((e) => ({ ...e, gender: undefined })); }} />
              <GenderCard value="female" labelKey="onboarding.gender_female" selected={formData.gender === 'female'} onPress={() => { setFormData((f) => ({ ...f, gender: 'female' })); setErrors((e) => ({ ...e, gender: undefined })); }} />
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View entering={FadeInDown.springify()} style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.age_label')}</Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              value={formData.age}
              onChangeText={(v) => { setFormData((f) => ({ ...f, age: v })); setErrors((e) => ({ ...e, age: undefined })); }}
              placeholder="e.g. 28"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="number-pad"
              returnKeyType="next"
            />
            {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View entering={FadeInUp.springify()} style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.measurements_label')}</Text>
            <Text style={styles.inputLabel}>{t('onboarding.height_label')}</Text>
            <TextInput
              style={[styles.input, errors.heightCm && styles.inputError]}
              value={formData.heightCm}
              onChangeText={(v) => { setFormData((f) => ({ ...f, heightCm: v })); setErrors((e) => ({ ...e, heightCm: undefined })); }}
              placeholder="e.g. 170"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            {errors.heightCm ? <Text style={styles.errorText}>{errors.heightCm}</Text> : null}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>{t('onboarding.weight_label')}</Text>
            <TextInput
              style={[styles.input, errors.weightKg && styles.inputError]}
              value={formData.weightKg}
              onChangeText={(v) => { setFormData((f) => ({ ...f, weightKg: v })); setErrors((e) => ({ ...e, weightKg: undefined })); }}
              placeholder="e.g. 70"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            {errors.weightKg ? <Text style={styles.errorText}>{errors.weightKg}</Text> : null}
          </Animated.View>
        );

      case 6:
        return (
          <Animated.View entering={FadeInDown.springify()} style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.activity_label')}</Text>
            {errors.activityLevel ? <Text style={styles.errorText}>{errors.activityLevel}</Text> : null}
            {([
              { value: 'sedentary', icon: 'bed-outline' as const, titleKey: 'onboarding.activity_sedentary', descKey: 'onboarding.activity_sedentary_desc' },
              { value: 'lightly_active', icon: 'walk-outline' as const, titleKey: 'onboarding.activity_light', descKey: 'onboarding.activity_light_desc' },
              { value: 'moderately_active', icon: 'bicycle-outline' as const, titleKey: 'onboarding.activity_moderate', descKey: 'onboarding.activity_moderate_desc' },
              { value: 'very_active', icon: 'barbell-outline' as const, titleKey: 'onboarding.activity_very', descKey: 'onboarding.activity_very_desc' },
            ] as const).map((act) => (
              <ActivityCard
                key={act.value}
                icon={act.icon}
                title={t(act.titleKey)}
                description={t(act.descKey)}
                selected={formData.activityLevel === act.value}
                onPress={() => { setFormData((f) => ({ ...f, activityLevel: act.value })); setErrors((e) => ({ ...e, activityLevel: undefined })); }}
              />
            ))}
          </Animated.View>
        );

      case 7:
        return (
          <Animated.View entering={FadeInUp.springify()} style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.goal_label')}</Text>
            <Text style={styles.inputLabel}>{t('onboarding.target_weight_label')}</Text>
            <TextInput
              style={[styles.input, errors.targetWeightKg && styles.inputError]}
              value={formData.targetWeightKg}
              onChangeText={(v) => { setFormData((f) => ({ ...f, targetWeightKg: v })); setErrors((e) => ({ ...e, targetWeightKg: undefined })); }}
              placeholder="e.g. 65"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            {errors.targetWeightKg ? <Text style={styles.errorText}>{errors.targetWeightKg}</Text> : null}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>{t('onboarding.deadline_label')}</Text>
            <TextInput
              style={styles.input}
              value={formData.deadline}
              onChangeText={(v) => setFormData((f) => ({ ...f, deadline: v }))}
              placeholder="e.g. 2026-12-31"
              placeholderTextColor={colors.textPlaceholder}
              returnKeyType="done"
            />
          </Animated.View>
        );

      case 8:
        return (
          <Animated.View entering={ZoomIn.springify()} style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.summary_title')}</Text>

            <View style={summaryStyles.card}>
              <View style={summaryStyles.iconWrap}>
                <Ionicons name="flame" size={48} color={colors.primary} weight="fill" />
              </View>
              <Text style={summaryStyles.tdeeValue}>
                ~{formattedTDEE}
              </Text>
              <Text style={summaryStyles.tdeeUnit}>kcal/day</Text>
              <Text style={summaryStyles.tdeeSub}>{t('onboarding.tdee_sub')}</Text>
            </View>

            <View style={summaryStyles.bmiRow}>
              <Text style={summaryStyles.bmiLabel}>{t('onboarding.bmi_label')}: </Text>
              <Text style={summaryStyles.bmiValue}>{summaryBMI}</Text>
              <View style={[summaryStyles.bmiChip, { backgroundColor: bmiChipColor(summaryBMICategory) }]}>
                <Text style={summaryStyles.bmiChipText}>{t(`profile.bmi_${summaryBMICategory}`)}</Text>
              </View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  const ctaDisabled =
    (step === 6 && !formData.activityLevel) ||
    (step === 3 && !formData.gender) ||
    saving;

  const showSkip = step === 2 || step === 7;
  const isFinalStep = step === TOTAL_STEPS;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />

      <View style={styles.header}>
        {step > 1 ? (
          <Pressable onPress={goBack} style={styles.backButton} accessibilityLabel={t('common.back')}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.stepCounter}>
          {step} / {TOTAL_STEPS}
        </Text>
      </View>

      <View style={styles.illustrationFrame}>
        <Animated.View entering={ZoomIn.delay(100).springify()}>
          <Ionicons name={stepIcons[step]} size={80} color={colors.primary} weight="fill" />
        </Animated.View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        {showSkip && (
          <TouchableOpacity onPress={skip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        )}

        <CTAButton
          title={isFinalStep ? t('onboarding.start_tracking') : t('onboarding.continue')}
          onPress={isFinalStep ? handleStartTracking : goNext}
          disabled={ctaDisabled}
          loading={saving}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  backButton: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  stepCounter: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  illustrationFrame: { height: 160, alignItems: 'center', justifyContent: 'center' },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  stepContent: { flex: 1 },
  display: { fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5, color: colors.text, marginBottom: spacing.lg },
  bodySecondary: { fontSize: 15, fontWeight: '500', lineHeight: 22, color: colors.textSecondary, marginTop: spacing.sm },
  inputLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  input: {
    fontSize: 15, fontWeight: '500', lineHeight: 22,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputError: { borderColor: colors.danger },
  errorText: { fontSize: 14, fontWeight: '500', color: colors.danger, marginTop: spacing.xs },
  genderRow: { flexDirection: 'column', gap: spacing.md, width: '100%' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.background },
  skipButton: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.md },
  skipText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
});

const summaryStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tdeeValue: { fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5, color: colors.primary },
  tdeeUnit: { fontSize: 18, fontWeight: '700', color: colors.textSecondary, marginTop: spacing.xs },
  tdeeSub: { fontSize: 15, fontWeight: '500', color: colors.textTertiary, marginTop: spacing.md },
  bmiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  bmiLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  bmiValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  bmiChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  bmiChipText: { fontSize: 13, fontWeight: '700', color: colors.textInverse },
});
