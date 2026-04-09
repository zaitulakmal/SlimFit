/**
 * Profile screen — user data display, inline editing, and language toggle.
 *
 * Section layout per UI-SPEC:
 *   1  Avatar area: initials circle + name + BMI chip
 *   2  Stats row: Weight | BMI | TDEE
 *   3  Profile Details: editable fields
 *   4  Settings: language toggle (D-09, D-10)
 *   5  About: version + privacy
 *
 * Language toggle (D-10): calls setLanguage → i18n.changeLanguage() → instant re-render
 * Profile edits: call updateProfile → TDEE/BMI recalculated automatically
 */

import { useState, useCallback } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { XCircle, Check, PencilSimple, Fire, Drop, Scales, ForkKnife, Trophy, TrendDown } from 'phosphor-react-native';

function PhosphorIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const props = { size, color, weight: 'fill' as const };
  switch (name) {
    case 'flame':        return <Fire {...props} />;
    case 'water':        return <Drop {...props} />;
    case 'scale':        return <Scales {...props} />;
    case 'restaurant':   return <ForkKnife {...props} />;
    case 'trophy':       return <Trophy {...props} />;
    case 'trending-down':return <TrendDown {...props} />;
    default:             return <Fire {...props} />;
  }
}
import Constants from 'expo-constants';
import Svg, { Rect, Circle as SvgCircle, Defs, LinearGradient, Stop, Ellipse, Path } from 'react-native-svg';

import { colors as themeColors, spacing, typography } from '../../../constants/theme';
import { pastelColors } from '../../../constants/pastel-theme';

const colors = pastelColors;
import {
  getBMICategory,
  calculateCalorieTarget,
  type BMICategory,
  type ActivityLevel,
  type Gender,
  type GoalType,
} from '../../../constants/tdee';
import { useProfileStore } from '../../../stores/profileStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useStatsStore, BADGE_DEFS } from '../../../stores/statsStore';
import type { NotifType } from '../../../services/notifications';

// ---------------------------------------------------------------------------
// BMI chip color
// ---------------------------------------------------------------------------

function bmiChipColor(category: BMICategory): string {
  switch (category) {
    case 'normal':
      return pastelColors.primary;
    case 'overweight':
      return pastelColors.amber;
    case 'obese':
      return pastelColors.coral;
    default:
      return pastelColors.blue;
  }
}

// ---------------------------------------------------------------------------
// Language toggle pill
// ---------------------------------------------------------------------------

interface LanguageToggleProps {
  current: string;
  onChange: (lang: string) => void;
}

function LanguageToggle({ current, onChange }: LanguageToggleProps) {
  const isEN = current !== 'ms';
  // Pill slides from left (EN) to right (BM)
  const offset = useSharedValue(isEN ? 0 : 1);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(offset.value * 44, { duration: 200, easing: Easing.out(Easing.quad) }) }],
  }));

  const toggle = useCallback(
    (lang: string) => {
      offset.value = lang === 'ms' ? 1 : 0;
      onChange(lang);
    },
    [offset, onChange]
  );

  return (
    <View style={langStyles.container}>
      {/* Animated sliding pill */}
      <Animated.View style={[langStyles.pill, pillStyle]} />

      {/* EN tap target */}
      <Pressable
        style={langStyles.option}
        onPress={() => toggle('en')}
        accessibilityRole="radio"
        accessibilityState={{ selected: isEN }}
        accessibilityLabel="English"
      >
        <Text style={[langStyles.optionText, isEN && langStyles.activeText]}>
          EN
        </Text>
      </Pressable>

      {/* BM tap target */}
      <Pressable
        style={langStyles.option}
        onPress={() => toggle('ms')}
        accessibilityRole="radio"
        accessibilityState={{ selected: !isEN }}
        accessibilityLabel="Bahasa Melayu"
      >
        <Text style={[langStyles.optionText, !isEN && langStyles.activeText]}>
          BM
        </Text>
      </Pressable>
    </View>
  );
}

const langStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    left: 4,
    width: 36,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  optionText: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '700' as any,
  },
  activeText: {
    color: colors.textOnAccent,
  },
});

// ---------------------------------------------------------------------------
// Editable field row
// ---------------------------------------------------------------------------

type FieldKey =
  | 'name'
  | 'gender'
  | 'age'
  | 'heightCm'
  | 'weightKg'
  | 'activityLevel'
  | 'targetWeightKg'
  | 'deadline';

interface EditableRowProps {
  label: string;
  value: string;
  fieldKey: FieldKey;
  onEdit: (key: FieldKey, value: string) => void;
  editing: FieldKey | null;
  setEditing: (key: FieldKey | null) => void;
  options?: { label: string; value: string }[];
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}

function EditableRow({
  label,
  value,
  fieldKey,
  onEdit,
  editing,
  setEditing,
  options,
  keyboardType = 'default',
}: EditableRowProps) {
  const [draft, setDraft] = useState(value);
  const isEditing = editing === fieldKey;

  const handleSave = () => {
    onEdit(fieldKey, draft);
    setEditing(null);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(null);
  };

  if (isEditing) {
    if (options) {
      // Option picker (gender / activity level)
      return (
        <View style={rowStyles.container}>
          <Text style={rowStyles.label}>{label}</Text>
          <View style={rowStyles.optionsRow}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  rowStyles.optionChip,
                  draft === opt.value && rowStyles.optionChipSelected,
                ]}
                onPress={() => {
                  setDraft(opt.value);
                  onEdit(fieldKey, opt.value);
                  setEditing(null);
                }}
              >
                <Text
                  style={[
                    rowStyles.optionChipText,
                    draft === opt.value && rowStyles.optionChipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleCancel}>
            <XCircle size={20} weight="regular" color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={rowStyles.container}>
        <Text style={rowStyles.label}>{label}</Text>
        <TextInput
          style={rowStyles.input}
          value={draft}
          onChangeText={setDraft}
          keyboardType={keyboardType}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <View style={rowStyles.editActions}>
          <TouchableOpacity onPress={handleSave} style={rowStyles.saveBtn}>
            <Check size={18} weight="bold" color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCancel}>
            <XCircle size={20} weight="regular" color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={rowStyles.container}
      onPress={() => {
        setDraft(value);
        setEditing(fieldKey);
      }}
    >
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value || '—'}</Text>
      <PencilSimple size={18} weight="regular" color={colors.textSecondary} />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  value: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.white,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  saveBtn: {
    backgroundColor: '#FB923C',
    borderRadius: 6,
    padding: spacing.xs,
  },
  optionsRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selectedTint,
  },
  optionChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  optionChipTextSelected: {
    color: colors.primary,
  },
});

// ---------------------------------------------------------------------------
// Profile screen
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Weekly bar chart (last 7 days)
// ---------------------------------------------------------------------------

interface WeeklyChartProps {
  data: { dateStr: string; calories: number }[];
  tdee: number;
}

function WeeklyChart({ data, tdee }: WeeklyChartProps) {
  const maxCal = Math.max(...data.map((d) => d.calories), tdee, 1);
  const chartH = 80;
  const barW = 28;
  const gap = 8;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <Svg width={totalW} height={chartH + 24}>
      {data.map((entry, i) => {
        const barH = Math.max((entry.calories / maxCal) * chartH, entry.calories > 0 ? 4 : 0);
        const x = i * (barW + gap);
        const y = chartH - barH;
        const isOver = tdee > 0 && entry.calories > tdee;
        const color = entry.calories === 0 ? colors.border : isOver ? colors.amber : colors.primary;
        const day = new Date(entry.dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' });
        return (
          <Svg key={entry.dateStr}>
            <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} />
            {/* Day label - using a simple rect placeholder for letter */}
            <Rect x={x + barW / 2 - 6} y={chartH + 6} width={12} height={12} rx={2} fill="transparent" />
          </Svg>
        );
      })}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Notification row
// ---------------------------------------------------------------------------

interface NotifRowProps {
  type: NotifType;
  label: string;
  enabled: boolean;
  hour: number;
  minute: number;
  onToggle: (enabled: boolean) => void;
  onTimePress: () => void;
}

function NotifRow({ type, label, enabled, hour, minute, onToggle, onTimePress }: NotifRowProps) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <View style={notifStyles.row}>
      <View style={notifStyles.info}>
        <Text style={notifStyles.label}>{label}</Text>
        <TouchableOpacity onPress={onTimePress} disabled={!enabled}>
          <Text style={[notifStyles.time, !enabled && notifStyles.timeDisabled]}>
            {pad(hour)}:{pad(minute)}
          </Text>
        </TouchableOpacity>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const notifStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flex: 1 },
  label: { ...typography.body, color: colors.textPrimary },
  time: { ...typography.label, color: colors.primary, marginTop: 2 },
  timeDisabled: { color: colors.border },
});

// ---------------------------------------------------------------------------
// Time picker modal (simple hour/minute inputs)
// ---------------------------------------------------------------------------

interface TimePickerProps {
  hour: number;
  minute: number;
  onSave: (h: number, m: number) => void;
  onClose: () => void;
}

function TimePicker({ hour, minute, onSave, onClose }: TimePickerProps) {
  const { t } = useTranslation();
  const [h, setH] = useState(String(hour));
  const [m, setM] = useState(String(minute).padStart(2, '0'));

  const handleSave = () => {
    const hv = Math.min(Math.max(parseInt(h) || 0, 0), 23);
    const mv = Math.min(Math.max(parseInt(m) || 0, 0), 59);
    onSave(hv, mv);
  };

  return (
    <View style={tpStyles.backdrop}>
      <View style={tpStyles.modal}>
        <Text style={tpStyles.title}>{t('notif.time_label')}</Text>
        <View style={tpStyles.inputs}>
          <TextInput
            style={tpStyles.input}
            value={h}
            onChangeText={setH}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus
          />
          <Text style={tpStyles.colon}>:</Text>
          <TextInput
            style={tpStyles.input}
            value={m}
            onChangeText={setM}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus
          />
        </View>
        <View style={tpStyles.actions}>
          <TouchableOpacity onPress={onClose} style={tpStyles.cancelBtn}>
            <Text style={tpStyles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={tpStyles.saveBtn}>
            <Text style={tpStyles.saveText}>{t('profile.edit_save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    width: 240,
    gap: spacing.md,
  },
  title: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  inputs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  input: {
    ...typography.display,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    width: 64,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  colon: { ...typography.display, color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, padding: spacing.sm, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textSecondary },
  saveBtn: { flex: 1, backgroundColor: '#FB923C', borderRadius: 10, padding: spacing.sm, alignItems: 'center' },
  saveText: { ...typography.body, color: '#431407', fontWeight: '700' },
});

// ---------------------------------------------------------------------------
// Profile screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { profile, updateProfile, setLanguage, resetProfile } = useProfileStore();
  const router = useRouter();
  const [editing, setEditing] = useState<FieldKey | null>(null);

  const { settings: notifSettings, loadSettings, toggleNotification, updateTime } =
    useNotificationStore();
  const { streakMap, unlockedBadgeIds, weeklyCalories, loadStats } = useStatsStore();
  const [timePickerFor, setTimePickerFor] = useState<NotifType | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadStats();
    }, [])
  );

  // ---------------------------------------------------------------------------
  // Field save handler — validates and calls updateProfile
  // MUST be before any early return to satisfy Rules of Hooks
  // ---------------------------------------------------------------------------

  const handleFieldSave = useCallback(
    async (key: FieldKey, rawValue: string) => {
      const trimmed = rawValue.trim();
      let parsed: Record<string, unknown> = {};

      switch (key) {
        case 'name':
          parsed = { name: trimmed || null };
          break;
        case 'gender':
          if (trimmed !== 'male' && trimmed !== 'female') return;
          parsed = { gender: trimmed as Gender };
          break;
        case 'age': {
          const v = parseInt(trimmed, 10);
          if (isNaN(v) || v < 13 || v > 120) {
            Alert.alert('Invalid', 'Age must be between 13 and 120');
            return;
          }
          parsed = { age: v };
          break;
        }
        case 'heightCm': {
          const v = parseFloat(trimmed);
          if (isNaN(v) || v < 50 || v > 300) {
            Alert.alert('Invalid', 'Height must be between 50 and 300 cm');
            return;
          }
          parsed = { heightCm: v };
          break;
        }
        case 'weightKg': {
          const v = parseFloat(trimmed);
          if (isNaN(v) || v < 20 || v > 500) {
            Alert.alert('Invalid', 'Weight must be between 20 and 500 kg');
            return;
          }
          parsed = { weightKg: v };
          break;
        }
        case 'activityLevel':
          parsed = { activityLevel: trimmed as ActivityLevel };
          break;
        case 'targetWeightKg': {
          const v = parseFloat(trimmed);
          if (isNaN(v) || v < 20 || v > 500) {
            Alert.alert('Invalid', 'Target weight must be between 20 and 500 kg');
            return;
          }
          parsed = { targetWeightKg: v };
          break;
        }
        case 'deadline':
          parsed = { deadline: trimmed || null };
          break;
      }

      try {
        await updateProfile(parsed);
      } catch {
        Alert.alert('Error', t('common.error_save'));
      }
    },
    [updateProfile, t]
  );

  // Early return AFTER all hooks
  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('home.empty_state')}</Text>
      </View>
    );
  }

  const bmiCategory = profile.bmi ? getBMICategory(profile.bmi) : 'normal';
  const chipColor = bmiChipColor(bmiCategory);

  const initials = profile.name
    ? profile.name.trim().charAt(0).toUpperCase()
    : '?';

  const activityLabels: Record<ActivityLevel, string> = {
    sedentary: t('onboarding.activity_sedentary'),
    lightly_active: t('onboarding.activity_light'),
    moderately_active: t('onboarding.activity_moderate'),
    very_active: t('onboarding.activity_very'),
  };

  const genderLabels: Record<Gender, string> = {
    male: t('onboarding.gender_male'),
    female: t('onboarding.gender_female'),
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Section 1: Avatar area with graphics */}
      <View style={[styles.avatarSection, { minHeight: 200 }]}>
        <Svg width={420} height={200} style={StyleSheet.absoluteFill} viewBox="0 0 420 200">
          <Defs>
            <LinearGradient id="profileHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFEDD5" />
              <Stop offset="50%" stopColor="#FED7AA" />
              <Stop offset="100%" stopColor="#FDBA74" />
            </LinearGradient>
          </Defs>
          <Rect width={420} height={200} fill="url(#profileHeaderGrad)" />

          {/* Soft glow blobs */}
          <SvgCircle cx={380} cy={-20} r={100} fill="#FB923C" opacity={0.12} />
          <SvgCircle cx={-30} cy={200} r={110} fill="#FDBA74" opacity={0.18} />
          <SvgCircle cx={60} cy={-10} r={50} fill="#FED7AA" opacity={0.25} />

          {/* Peach fruit */}
          <Ellipse cx={370} cy={155} rx={28} ry={26} fill="#FB923C" opacity={0.75} />
          <Ellipse cx={370} cy={155} rx={20} ry={18} fill="#FDBA74" />
          <Path d="M370,129 Q375,119 382,123" stroke="#92400E" strokeWidth={2} fill="none" />

          {/* Strawberry */}
          <Ellipse cx={50} cy={160} rx={18} ry={20} fill="#F97316" opacity={0.7} />
          <SvgCircle cx={50} cy={143} r={8} fill="#84CC16" opacity={0.8} />

          {/* Mango slice */}
          <Ellipse cx={85} cy={45} rx={22} ry={18} fill="#FBBF24" opacity={0.65} />
          <Ellipse cx={85} cy={45} rx={14} ry={11} fill="#FDE68A" />
        </Svg>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{profile.name || '—'}</Text>
        <View style={[styles.bmiChip, { backgroundColor: chipColor }]}>
          <Text style={styles.bmiChipText}>
            {t(`profile.bmi_${bmiCategory}`)}
          </Text>
        </View>
      </View>

      {/* Section 2: Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.weightKg} kg</Text>
          <Text style={styles.statLabel}>{t('profile.stats_weight')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.bmi}</Text>
          <Text style={styles.statLabel}>{t('profile.stats_bmi')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>~{(profile.calorieTarget ?? profile.tdee)?.toLocaleString()}</Text>
          <Text style={styles.statLabel}>{t('profile.stats_tdee')}</Text>
        </View>
      </View>

      {/* Section: Profile Details */}
      <Text style={styles.sectionHeader}>{t('profile.section_details')}</Text>
      <View style={styles.sectionCard}>
        <EditableRow
          label={t('onboarding.name_label')}
          value={profile.name || ''}
          fieldKey="name"
          onEdit={handleFieldSave}
          editing={editing}
          setEditing={setEditing}
        />
        <EditableRow
          label={t('onboarding.gender_label')}
          value={genderLabels[profile.gender]}
          fieldKey="gender"
          onEdit={handleFieldSave}
          editing={editing}
          setEditing={setEditing}
          options={[
            { label: t('onboarding.gender_male'), value: 'male' },
            { label: t('onboarding.gender_female'), value: 'female' },
          ]}
        />
        <EditableRow
          label={t('onboarding.age_label')}
          value={String(profile.age)}
          fieldKey="age"
          onEdit={handleFieldSave}
          editing={editing}
          setEditing={setEditing}
          keyboardType="numeric"
        />
        <EditableRow
          label={t('onboarding.height_label')}
          value={String(profile.heightCm)}
          fieldKey="heightCm"
          onEdit={handleFieldSave}
          editing={editing}
          setEditing={setEditing}
          keyboardType="decimal-pad"
        />
        <EditableRow
          label={t('onboarding.weight_label')}
          value={String(profile.weightKg)}
          fieldKey="weightKg"
          onEdit={handleFieldSave}
          editing={editing}
          setEditing={setEditing}
          keyboardType="decimal-pad"
        />
        <EditableRow
          label={t('onboarding.activity_label')}
          value={activityLabels[profile.activityLevel]}
          fieldKey="activityLevel"
          onEdit={handleFieldSave}
          editing={editing}
          setEditing={setEditing}
          options={[
            {
              label: t('onboarding.activity_sedentary'),
              value: 'sedentary',
            },
            { label: t('onboarding.activity_light'), value: 'lightly_active' },
            {
              label: t('onboarding.activity_moderate'),
              value: 'moderately_active',
            },
            { label: t('onboarding.activity_very'), value: 'very_active' },
          ]}
        />
        <EditableRow
          label={t('onboarding.target_weight_label')}
          value={String(profile.targetWeightKg)}
          fieldKey="targetWeightKg"
          onEdit={handleFieldSave}
          editing={editing}
          setEditing={setEditing}
          keyboardType="decimal-pad"
        />
        <EditableRow
          label={t('onboarding.deadline_label')}
          value={profile.deadline || ''}
          fieldKey="deadline"
          onEdit={handleFieldSave}
          editing={editing}
          setEditing={setEditing}
        />
      </View>

      {/* Section 4: Settings */}
      <Text style={styles.sectionHeader}>{t('profile.section_settings')}</Text>
      <View style={styles.sectionCard}>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>{t('profile.language_label')}</Text>
          <LanguageToggle
            current={profile.language}
            onChange={(lang) => setLanguage(lang)}
          />
        </View>
      </View>

      {/* Section: Reminders */}
      <Text style={styles.sectionHeader}>{t('notif.section')}</Text>
      <View style={styles.sectionCard}>
        {((['breakfast', 'lunch', 'dinner', 'water', 'weigh_in'] as NotifType[])).map((type) => {
          const s = notifSettings?.[type];
          if (!s) return null;
          return (
            <NotifRow
              key={type}
              type={type}
              label={t(`notif.${type}`)}
              enabled={s.enabled}
              hour={s.hour}
              minute={s.minute}
              onToggle={(val) => {
                toggleNotification(type, val).catch(() =>
                  Alert.alert('', t('notif.permission_denied'))
                );
              }}
              onTimePress={() => setTimePickerFor(type)}
            />
          );
        })}
      </View>

      {/* Section: Streaks */}
      <Text style={styles.sectionHeader}>{t('stats.streaks')}</Text>
      <View style={styles.streakRow}>
        {[
          { type: 'food', icon: 'flame' as const, color: colors.amber, label: t('stats.food_streak') },
          { type: 'water', icon: 'water' as const, color: colors.skyBlue, label: t('stats.water_streak') },
          { type: 'weight', icon: 'scale' as const, color: colors.primary, label: t('stats.weight_streak') },
        ].map(({ type, icon, color, label }) => {
          const streak = streakMap[type];
          return (
            <View key={type} style={styles.streakCard}>
              <PhosphorIcon name={icon} size={22} color={color} />
              <Text style={[styles.streakValue, { color }]}>{streak?.current ?? 0}</Text>
              <Text style={styles.streakDays}>{t('stats.days')}</Text>
              <Text style={styles.streakLabel} numberOfLines={2}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Section: Weekly Report */}
      <Text style={styles.sectionHeader}>{t('stats.weekly_report')}</Text>
      <View style={styles.sectionCard}>
        <View style={styles.weeklyChart}>
          {weeklyCalories.map((entry) => {
            const tdee = profile.calorieTarget ?? profile.tdee ?? 0;
            const maxCal = Math.max(...weeklyCalories.map((d) => d.calories), tdee, 500);
            const barH = Math.max((entry.calories / maxCal) * 80, entry.calories > 0 ? 4 : 0);
            const isOver = tdee > 0 && entry.calories > tdee;
            const barColor = entry.calories === 0 ? colors.border : isOver ? colors.amber : colors.primary;
            const day = new Date(entry.dateStr + 'T00:00:00')
              .toLocaleDateString(undefined, { weekday: 'narrow' });
            return (
              <View key={entry.dateStr} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: barH, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.barLabel}>{day}</Text>
                {entry.calories > 0 && (
                  <Text style={styles.barValue}>{Math.round(entry.calories / 100) * 100 >= 1000
                    ? `${(entry.calories / 1000).toFixed(1)}k`
                    : Math.round(entry.calories)}</Text>
                )}
              </View>
            );
          })}
        </View>
        {(profile.calorieTarget ?? profile.tdee) ? (
          <Text style={styles.tdeeRefLine}>
            Budget: ~{(profile.calorieTarget ?? profile.tdee)?.toLocaleString()} kcal/day
          </Text>
        ) : null}
      </View>

      {/* Section: Achievements */}
      <Text style={styles.sectionHeader}>{t('stats.achievements')}</Text>
      <View style={styles.badgeGrid}>
        {BADGE_DEFS.map((def) => {
          const isUnlocked = unlockedBadgeIds.includes(def.id);
          return (
            <View key={def.id} style={[styles.badgeCard, !isUnlocked && styles.badgeLocked]}>
              <View style={[styles.badgeIcon, { backgroundColor: isUnlocked ? def.color + '20' : colors.background }]}>
                <PhosphorIcon name={def.icon} size={26} color={isUnlocked ? def.color : colors.border} />
              </View>
              <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTextLocked]} numberOfLines={2}>
                {isUnlocked ? t(def.titleKey) : t('stats.locked')}
              </Text>
              {isUnlocked && (
                <Text style={styles.badgeDesc} numberOfLines={2}>{t(def.descKey)}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Section 5: About */}
      <View style={styles.aboutSection}>
        {Constants.expoConfig?.version ? (
          <Text style={styles.aboutVersion}>
            v{Constants.expoConfig.version}
          </Text>
        ) : null}
        <Text style={styles.aboutPrivacy}>{t('profile.about_privacy')}</Text>
      </View>

      {/* Reset account */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          Alert.alert(
            t('profile.reset_title'),
            t('profile.reset_confirm'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('profile.reset_action'),
                style: 'destructive',
                onPress: async () => {
                  try {
                    await resetProfile();
                    router.replace('/onboarding');
                  } catch (e) {
                    console.error('[reset]', e);
                    Alert.alert('Error', t('profile.reset_error'));
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.resetButtonText}>{t('profile.reset_title')}</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* Time picker modal */}
    {timePickerFor && notifSettings?.[timePickerFor] && (
      <TimePicker
        hour={notifSettings[timePickerFor].hour}
        minute={notifSettings[timePickerFor].minute}
        onClose={() => setTimePickerFor(null)}
        onSave={(h, m) => {
          updateTime(timePickerFor, h, m);
          setTimePickerFor(null);
        }}
      />
    )}
  </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarInitials: {
    ...typography.display,
    color: '#431407',
  },
  userName: {
    ...typography.heading,
    color: '#431407',
    marginBottom: spacing.sm,
  },
  bmiChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  bmiChipText: {
    ...typography.label,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  statValue: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Section
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A7A7A',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  // Settings row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingsLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  // About
  aboutSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  aboutVersion: {
    ...typography.label,
    color: colors.textSecondary,
  },
  aboutPrivacy: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resetButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.coral,
    alignItems: 'center',
  },
  resetButtonText: {
    ...typography.body,
    color: colors.coral,
    fontWeight: '700',
  },
  // Streaks
  streakRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '700' as any,
    lineHeight: 30,
  },
  streakDays: { ...typography.label, color: colors.textSecondary },
  streakLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  // Weekly chart
  weeklyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barContainer: { height: 80, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { ...typography.label, color: colors.textSecondary },
  barValue: { fontSize: 9, fontWeight: '600' as any, color: colors.textSecondary },
  tdeeRefLine: { ...typography.label, color: colors.textSecondary, textAlign: 'center', paddingBottom: spacing.sm },
  // Badges
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeLocked: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeTitle: { ...typography.body, color: colors.textPrimary, textAlign: 'center' },
  badgeTextLocked: { color: colors.textSecondary },
  badgeDesc: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },
});

const goalSectionStyles = StyleSheet.create({
  goalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  goalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  goalCardActive: {
    borderColor: '#FB923C',
    backgroundColor: '#FFEDD5',
  },
  goalIcon: { fontSize: 22 },
  goalLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  goalLabelActive: { color: '#431407', fontWeight: '700' },
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  targetLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
  targetSub: { ...typography.label, color: colors.textSecondary, marginTop: 2 },
  targetValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#C2410C',
  },
});
