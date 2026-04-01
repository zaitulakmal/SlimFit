/**
 * Onboarding wizard — 8-step flow that collects user profile data.
 *
 * Step structure (per UI-SPEC and CONTEXT.md):
 *   1  Welcome           No input — intro screen
 *   2  Name              Optional text input (Skip link)
 *   3  Gender            Required — Male / Female cards
 *   4  Age               Required — numeric input (13-120)
 *   5  Height + Weight   Both required (height 50-300, weight 20-500)
 *   6  Activity Level    Required — 4 selectable ActivityCards
 *   7  Goal              Target weight required, deadline optional (Skip link)
 *   8  TDEE Summary      Read-only calculated results, "Start Tracking" CTA
 *
 * On "Start Tracking": calls profileStore.saveProfile() then router.replace('/(tabs)').
 * State management: local useState for step + form data (ephemeral wizard state).
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, spacing, typography } from '../../constants/theme';
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// BMI chip color helper
// ---------------------------------------------------------------------------

function bmiChipColor(category: BMICategory): string {
  switch (category) {
    case 'normal':
      return colors.primary;
    case 'overweight':
      return colors.amber;
    case 'obese':
      return colors.coral;
    default:
      return colors.skyBlue;
  }
}

// ---------------------------------------------------------------------------
// Wizard component
// ---------------------------------------------------------------------------

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
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = useCallback((): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (step === 3 && !formData.gender) {
      errs.gender = t('common.error_calc');
    }

    if (step === 4) {
      const age = parseInt(formData.age, 10);
      if (!formData.age || isNaN(age) || age < 13 || age > 120) {
        errs.age = 'Age must be between 13 and 120';
      }
    }

    if (step === 5) {
      const h = parseFloat(formData.heightCm);
      const w = parseFloat(formData.weightKg);
      if (!formData.heightCm || isNaN(h) || h < 50 || h > 300) {
        errs.heightCm = 'Height must be between 50 and 300 cm';
      }
      if (!formData.weightKg || isNaN(w) || w < 20 || w > 500) {
        errs.weightKg = 'Weight must be between 20 and 500 kg';
      }
    }

    if (step === 6 && !formData.activityLevel) {
      errs.activityLevel = 'Please select an activity level';
    }

    if (step === 7) {
      const tw = parseFloat(formData.targetWeightKg);
      if (!formData.targetWeightKg || isNaN(tw) || tw < 20 || tw > 500) {
        errs.targetWeightKg = 'Target weight must be between 20 and 500 kg';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [step, formData, t]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goNext = useCallback(() => {
    if (!validate()) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step, validate]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setErrors({});
      setStep((s) => s - 1);
    }
  }, [step]);

  const skip = useCallback(() => {
    setErrors({});
    setStep((s) => s + 1);
  }, []);

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

  // ---------------------------------------------------------------------------
  // TDEE / BMI for step 8 summary
  // ---------------------------------------------------------------------------

  const summaryTDEE =
    formData.gender && formData.activityLevel
      ? roundTDEE(
          calculateTDEE(
            formData.gender,
            parseFloat(formData.weightKg) || 0,
            parseFloat(formData.heightCm) || 0,
            parseInt(formData.age, 10) || 0,
            formData.activityLevel
          )
        )
      : 0;

  const summaryBMI =
    parseFloat(formData.weightKg) && parseFloat(formData.heightCm)
      ? parseFloat(
          calculateBMI(
            parseFloat(formData.weightKg),
            parseFloat(formData.heightCm)
          ).toFixed(1)
        )
      : 0;

  const summaryBMICategory = summaryBMI > 0 ? getBMICategory(summaryBMI) : 'normal';

  const formattedTDEE = summaryTDEE.toLocaleString();

  // ---------------------------------------------------------------------------
  // Step illustration icons
  // ---------------------------------------------------------------------------

  const stepIcons: Record<number, keyof typeof Ionicons.glyphMap> = {
    1: 'fitness-outline',
    2: 'happy-outline',
    3: 'people-outline',
    4: 'calendar-outline',
    5: 'resize-outline',
    6: 'flash-outline',
    7: 'flag-outline',
    8: 'trophy-outline',
  };

  // ---------------------------------------------------------------------------
  // Step content
  // ---------------------------------------------------------------------------

  const renderStepContent = () => {
    switch (step) {
      // -----------------------------------------------------------------------
      // Step 1: Welcome
      // -----------------------------------------------------------------------
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.welcome_title')}</Text>
            <Text style={styles.bodySecondary}>{t('onboarding.welcome_sub')}</Text>
          </View>
        );

      // -----------------------------------------------------------------------
      // Step 2: Name (optional)
      // -----------------------------------------------------------------------
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.name_label')}</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(v) => setFormData((f) => ({ ...f, name: v }))}
              placeholder="e.g. Alex"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="next"
              autoCapitalize="words"
            />
          </View>
        );

      // -----------------------------------------------------------------------
      // Step 3: Gender
      // -----------------------------------------------------------------------
      case 3: {
        const genderOptions: { value: Gender; labelKey: string }[] = [
          { value: 'male', labelKey: 'onboarding.gender_male' },
          { value: 'female', labelKey: 'onboarding.gender_female' },
        ];
        return (
          <View style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.gender_label')}</Text>
            {errors.gender ? (
              <Text style={styles.errorText}>{errors.gender}</Text>
            ) : null}
            <View style={styles.genderRow}>
              {genderOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.genderCard,
                    formData.gender === opt.value && styles.genderCardSelected,
                  ]}
                  onPress={() => {
                    setFormData((f) => ({ ...f, gender: opt.value }));
                    setErrors((e) => ({ ...e, gender: undefined }));
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: formData.gender === opt.value }}
                >
                  <Ionicons
                    name={opt.value === 'male' ? 'man-outline' : 'woman-outline'}
                    size={32}
                    color={
                      formData.gender === opt.value
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.genderLabel,
                      formData.gender === opt.value && styles.genderLabelSelected,
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                  {formData.gender === opt.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.primary}
                      style={styles.genderCheck}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }

      // -----------------------------------------------------------------------
      // Step 4: Age
      // -----------------------------------------------------------------------
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.age_label')}</Text>
            <TextInput
              style={[styles.input, errors.age ? styles.inputError : null]}
              value={formData.age}
              onChangeText={(v) => {
                setFormData((f) => ({ ...f, age: v }));
                setErrors((e) => ({ ...e, age: undefined }));
              }}
              placeholder="e.g. 28"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              returnKeyType="next"
            />
            {errors.age ? (
              <Text style={styles.errorText}>{errors.age}</Text>
            ) : null}
          </View>
        );

      // -----------------------------------------------------------------------
      // Step 5: Height + Weight
      // -----------------------------------------------------------------------
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.measurements_label')}</Text>
            <Text style={styles.inputLabel}>{t('onboarding.height_label')}</Text>
            <TextInput
              style={[styles.input, errors.heightCm ? styles.inputError : null]}
              value={formData.heightCm}
              onChangeText={(v) => {
                setFormData((f) => ({ ...f, heightCm: v }));
                setErrors((e) => ({ ...e, heightCm: undefined }));
              }}
              placeholder="e.g. 170"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            {errors.heightCm ? (
              <Text style={styles.errorText}>{errors.heightCm}</Text>
            ) : null}
            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
              {t('onboarding.weight_label')}
            </Text>
            <TextInput
              style={[styles.input, errors.weightKg ? styles.inputError : null]}
              value={formData.weightKg}
              onChangeText={(v) => {
                setFormData((f) => ({ ...f, weightKg: v }));
                setErrors((e) => ({ ...e, weightKg: undefined }));
              }}
              placeholder="e.g. 70"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            {errors.weightKg ? (
              <Text style={styles.errorText}>{errors.weightKg}</Text>
            ) : null}
          </View>
        );

      // -----------------------------------------------------------------------
      // Step 6: Activity Level
      // -----------------------------------------------------------------------
      case 6: {
        const activities: {
          value: ActivityLevel;
          icon: keyof typeof Ionicons.glyphMap;
          titleKey: string;
          descKey: string;
        }[] = [
          {
            value: 'sedentary',
            icon: 'bed-outline',
            titleKey: 'onboarding.activity_sedentary',
            descKey: 'onboarding.activity_sedentary_desc',
          },
          {
            value: 'lightly_active',
            icon: 'walk-outline',
            titleKey: 'onboarding.activity_light',
            descKey: 'onboarding.activity_light_desc',
          },
          {
            value: 'moderately_active',
            icon: 'bicycle-outline',
            titleKey: 'onboarding.activity_moderate',
            descKey: 'onboarding.activity_moderate_desc',
          },
          {
            value: 'very_active',
            icon: 'barbell-outline',
            titleKey: 'onboarding.activity_very',
            descKey: 'onboarding.activity_very_desc',
          },
        ];
        return (
          <View style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.activity_label')}</Text>
            {errors.activityLevel ? (
              <Text style={styles.errorText}>{errors.activityLevel}</Text>
            ) : null}
            {activities.map((act) => (
              <ActivityCard
                key={act.value}
                icon={act.icon}
                title={t(act.titleKey)}
                description={t(act.descKey)}
                selected={formData.activityLevel === act.value}
                onPress={() => {
                  setFormData((f) => ({ ...f, activityLevel: act.value }));
                  setErrors((e) => ({ ...e, activityLevel: undefined }));
                }}
              />
            ))}
          </View>
        );
      }

      // -----------------------------------------------------------------------
      // Step 7: Goal (target weight + optional deadline)
      // -----------------------------------------------------------------------
      case 7:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.goal_label')}</Text>
            <Text style={styles.inputLabel}>{t('onboarding.target_weight_label')}</Text>
            <TextInput
              style={[
                styles.input,
                errors.targetWeightKg ? styles.inputError : null,
              ]}
              value={formData.targetWeightKg}
              onChangeText={(v) => {
                setFormData((f) => ({ ...f, targetWeightKg: v }));
                setErrors((e) => ({ ...e, targetWeightKg: undefined }));
              }}
              placeholder="e.g. 65"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            {errors.targetWeightKg ? (
              <Text style={styles.errorText}>{errors.targetWeightKg}</Text>
            ) : null}
            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
              {t('onboarding.deadline_label')}
            </Text>
            <TextInput
              style={styles.input}
              value={formData.deadline}
              onChangeText={(v) => setFormData((f) => ({ ...f, deadline: v }))}
              placeholder="e.g. 2026-12-31"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="done"
            />
          </View>
        );

      // -----------------------------------------------------------------------
      // Step 8: TDEE Summary
      // -----------------------------------------------------------------------
      case 8:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.display}>{t('onboarding.summary_title')}</Text>

            {/* TDEE display — D-07: tilde prefix, rounded to nearest 50 */}
            <View style={styles.summaryCard}>
              <Text style={styles.tdeeValue}>
                {t('onboarding.tdee_label', { n: formattedTDEE })}
              </Text>
              <Text style={styles.tdeeSub}>{t('onboarding.tdee_sub')}</Text>
            </View>

            {/* BMI display with color-coded category chip */}
            <View style={styles.bmiRow}>
              <Text style={styles.bmiValue}>{t('onboarding.bmi_label')}: {summaryBMI}</Text>
              <View
                style={[
                  styles.bmiChip,
                  { backgroundColor: bmiChipColor(summaryBMICategory) },
                ]}
              >
                <Text style={styles.bmiChipText}>
                  {t(`profile.bmi_${summaryBMICategory}`)}
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // CTA state
  // ---------------------------------------------------------------------------

  const ctaDisabled =
    (step === 6 && !formData.activityLevel) ||
    (step === 3 && !formData.gender) ||
    saving;

  const showSkip = step === 2 || step === 7;
  const isFinalStep = step === TOTAL_STEPS;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress bar */}
      <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />

      {/* Header row: back chevron + step counter */}
      <View style={styles.header}>
        {step > 1 ? (
          <Pressable
            onPress={goBack}
            style={styles.backButton}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.stepCounter}>
          {t('onboarding.step_of', { current: step, total: TOTAL_STEPS })}
        </Text>
      </View>

      {/* Illustration placeholder — large centered Ionicons per D-03 */}
      <View style={styles.illustrationFrame}>
        <Ionicons
          name={stepIcons[step]}
          size={64}
          color={colors.primary}
        />
      </View>

      {/* Step content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Footer: optional Skip + CTA */}
      <View style={styles.footer}>
        {showSkip && (
          <TouchableOpacity onPress={skip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.cta, ctaDisabled && styles.ctaDisabled]}
          onPress={isFinalStep ? handleStartTracking : goNext}
          disabled={ctaDisabled}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {isFinalStep
              ? t('onboarding.start_tracking')
              : t('onboarding.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepCounter: {
    ...typography.label,
    color: colors.textSecondary,
  },
  illustrationFrame: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  stepContent: {
    flex: 1,
  },
  display: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  bodySecondary: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  inputLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.coral,
  },
  errorText: {
    ...typography.label,
    color: colors.coral,
    marginTop: spacing.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    position: 'relative',
    minHeight: 100,
  },
  genderCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selectedTint,
  },
  genderLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  genderLabelSelected: {
    color: colors.primary,
  },
  genderCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tdeeValue: {
    ...typography.display,
    color: colors.primary,
    textAlign: 'center',
  },
  tdeeSub: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  bmiValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  bmiChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  bmiChipText: {
    ...typography.label,
    color: colors.textOnAccent,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cta: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    ...typography.body,
    color: colors.textOnAccent,
  },
});
