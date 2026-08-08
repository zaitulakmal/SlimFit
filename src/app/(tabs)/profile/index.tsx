import { useState, useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  PencilSimple, Check, XCircle,
  Fire, Drop, Scales, ForkKnife, Trophy, TrendDown, Crown, UserCircle,
  SignOut, Warning, Sun, ArrowClockwise, Ruler, ArrowRight,
} from 'phosphor-react-native';
import Constants from 'expo-constants';

import { pastelColors as C, pastelSpacing as spacing } from '../../../constants/pastel-theme';
import { cute, radius, cuteShadow, withAlpha, cardTints, cardBorder, cardTintOrder } from '@/theme/cute';
import { Mascot } from '@/components/art/Mascot';
import {
  getBMICategory, calculateCalorieTarget,
  type BMICategory, type ActivityLevel, type Gender, type GoalType,
} from '../../../constants/tdee';
import { useProfileStore } from '../../../stores/profileStore';
import { useAuthStore } from '../../../stores/authStore';
import { useStatsStore, BADGE_DEFS, getFlairIcon } from '../../../stores/statsStore';

// ─── Icons ──────────────────────────────────────────────────────────────────

function PhosphorIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { size, color, weight: 'fill' as const };
  switch (name) {
    case 'flame':         return <Fire {...p} />;
    case 'water':         return <Drop {...p} />;
    case 'scale':         return <Scales {...p} />;
    case 'restaurant':    return <ForkKnife {...p} />;
    case 'trophy':        return <Trophy {...p} />;
    case 'trending-down': return <TrendDown {...p} />;
    case 'sunny':         return <Sun {...p} />;
    case 'refresh':       return <ArrowClockwise {...p} />;
    case 'crown':         return <Crown {...p} />;
    default:              return <Fire {...p} />;
  }
}

// ─── BMI chip colour ─────────────────────────────────────────────────────────

function bmiColor(cat: BMICategory): string {
  if (cat === 'normal')    return C.green;
  if (cat === 'overweight') return C.amber;
  if (cat === 'obese')     return C.coral;
  return C.skyBlue;
}

// ─── Language toggle ─────────────────────────────────────────────────────────

function LanguageToggle({ current, onChange }: { current: string; onChange: (l: string) => void }) {
  const isEN = current !== 'ms';
  const offset = useSharedValue(isEN ? 0 : 1);
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(offset.value * 44, { duration: 200, easing: Easing.out(Easing.quad) }) }],
  }));
  const toggle = useCallback((lang: string) => { offset.value = lang === 'ms' ? 1 : 0; onChange(lang); }, [offset, onChange]);

  return (
    <View style={lang.wrap}>
      <Animated.View style={[lang.pill, pillStyle]} />
      <Pressable style={lang.opt} onPress={() => toggle('en')}>
        <Text style={[lang.txt, isEN && lang.active]}>EN</Text>
      </Pressable>
      <Pressable style={lang.opt} onPress={() => toggle('ms')}>
        <Text style={[lang.txt, !isEN && lang.active]}>BM</Text>
      </Pressable>
    </View>
  );
}

const lang = StyleSheet.create({
  wrap: { width: 88, height: 34, borderRadius: 17, backgroundColor: C.border, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  pill: { position: 'absolute', left: 4, width: 40, height: 26, borderRadius: 13, backgroundColor: C.navy },
  opt:  { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  txt:  { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  active: { color: '#FFFFFF' },
});

// ─── Editable row ────────────────────────────────────────────────────────────

type FieldKey = 'name'|'gender'|'age'|'heightCm'|'weightKg'|'activityLevel'|'targetWeightKg'|'deadline';

interface EditableRowProps {
  label: string; value: string; fieldKey: FieldKey;
  onEdit: (k: FieldKey, v: string) => void;
  editing: FieldKey | null; setEditing: (k: FieldKey | null) => void;
  options?: { label: string; value: string }[];
  keyboardType?: 'default'|'numeric'|'decimal-pad';
}

function EditableRow({ label, value, fieldKey, onEdit, editing, setEditing, options, keyboardType = 'default' }: EditableRowProps) {
  const [draft, setDraft] = useState(value);
  const isEditing = editing === fieldKey;

  const save = () => { onEdit(fieldKey, draft); setEditing(null); };
  const cancel = () => { setDraft(value); setEditing(null); };

  if (isEditing && options) {
    return (
      <View style={row.wrap}>
        <Text style={row.label}>{label}</Text>
        <View style={row.chips}>
          {options.map(opt => (
            <TouchableOpacity key={opt.value} style={[row.chip, draft === opt.value && row.chipOn]}
              onPress={() => { setDraft(opt.value); onEdit(fieldKey, opt.value); setEditing(null); }}>
              <Text style={[row.chipTxt, draft === opt.value && row.chipTxtOn]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={cancel}><XCircle size={20} color={C.textSecondary} /></TouchableOpacity>
      </View>
    );
  }

  if (isEditing) {
    return (
      <View style={row.wrap}>
        <Text style={row.label}>{label}</Text>
        <TextInput style={row.input} value={draft} onChangeText={setDraft}
          keyboardType={keyboardType} autoFocus returnKeyType="done" onSubmitEditing={save} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity onPress={save} style={row.saveBtn}><Check size={16} weight="bold" color="#FFFFFF" /></TouchableOpacity>
          <TouchableOpacity onPress={cancel}><XCircle size={20} color={C.textSecondary} /></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={row.wrap} onPress={() => { setDraft(value); setEditing(fieldKey); }}>
      <Text style={row.label}>{label}</Text>
      <Text style={row.value} numberOfLines={1}>{value || '—'}</Text>
      <PencilSimple size={16} color={C.textTertiary} />
    </Pressable>
  );
}

const row = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { fontSize: 14, fontWeight: '500', color: C.textPrimary, flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: C.textSecondary, flex: 1, textAlign: 'right', marginRight: 4 },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: C.textPrimary, borderWidth: 1.5, borderColor: C.navy, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.white },
  saveBtn: { backgroundColor: C.navy, borderRadius: 8, padding: 6 },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  chipOn: { borderColor: C.navy, backgroundColor: '#FDEDE9' },
  chipTxt:   { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  chipTxtOn: { color: C.navy },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, setLanguage, resetProfile } = useProfileStore();
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState<FieldKey | null>(null);

  const { streakMap, unlockedBadgeIds, weeklyCalories, loadStats } = useStatsStore();

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  const handleFieldSave = useCallback(async (key: FieldKey, rawValue: string) => {
    const v = rawValue.trim();
    let parsed: Record<string, unknown> = {};
    switch (key) {
      case 'name':        parsed = { name: v || null }; break;
      case 'gender':      if (v !== 'male' && v !== 'female') return; parsed = { gender: v as Gender }; break;
      case 'age':         { const n = parseInt(v, 10); if (isNaN(n) || n < 13 || n > 120) { Alert.alert('Invalid', 'Age 13–120'); return; } parsed = { age: n }; break; }
      case 'heightCm':    { const n = parseFloat(v); if (isNaN(n) || n < 50 || n > 300)  { Alert.alert('Invalid', 'Height 50–300 cm'); return; } parsed = { heightCm: n }; break; }
      case 'weightKg':    { const n = parseFloat(v); if (isNaN(n) || n < 20 || n > 500)  { Alert.alert('Invalid', 'Weight 20–500 kg'); return; } parsed = { weightKg: n }; break; }
      case 'activityLevel': parsed = { activityLevel: v as ActivityLevel }; break;
      case 'targetWeightKg': { const n = parseFloat(v); if (isNaN(n) || n < 20 || n > 500) { Alert.alert('Invalid', 'Target 20–500 kg'); return; } parsed = { targetWeightKg: n }; break; }
      case 'deadline':    parsed = { deadline: v || null }; break;
    }
    try { await updateProfile(parsed); } catch { Alert.alert('Error', t('common.error_save')); }
  }, [updateProfile, t]);

  if (!profile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF4E4' }}>
        <Text style={{ color: C.textSecondary }}>{t('home.empty_state')}</Text>
      </View>
    );
  }

  const bmiCat   = profile.bmi ? getBMICategory(profile.bmi) : 'normal';
  const chipCol  = bmiColor(bmiCat);
  // null → we show a user icon rather than a bare "?".
  const initials = profile.name ? profile.name.trim().charAt(0).toUpperCase() : null;
  const flairIcon = getFlairIcon(unlockedBadgeIds);

  const actLabels: Record<ActivityLevel, string> = {
    sedentary: t('onboarding.activity_sedentary'),
    lightly_active: t('onboarding.activity_light'),
    moderately_active: t('onboarding.activity_moderate'),
    very_active: t('onboarding.activity_very'),
  };
  const genLabels: Record<Gender, string> = {
    male: t('onboarding.gender_male'),
    female: t('onboarding.gender_female'),
  };

  const tdee = profile.calorieTarget ?? profile.tdee ?? 0;
  const maxCal = Math.max(...weeklyCalories.map(d => d.calories), tdee, 500);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF4E4' }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: insets.top + 12 }]}>
          <View style={s.headerContent}>
            {/* Avatar + buddy */}
            <View style={s.avatarRow}>
              <View style={s.avatarRing}>
                <View style={s.avatarCircle}>
                  {initials ? (
                    <Text style={s.avatarLetter}>{initials}</Text>
                  ) : (
                    <UserCircle size={46} weight="fill" color={cute.coralDeep} />
                  )}
                </View>
              </View>
              <Mascot size={64} mood={(streakMap['food']?.current ?? 0) >= 3 ? 'cheer' : 'happy'} />
            </View>

            <View style={s.nameRow}>
              <Text
                style={[s.userName, { marginBottom: 0 }, !profile.name && s.userNameEmpty]}
                numberOfLines={1}
              >
                {profile.name || t('profile.name_placeholder')}
              </Text>
              {flairIcon && (
                <View style={s.flairPill}>
                  <PhosphorIcon name={flairIcon} size={14} color={cute.coralDeep} />
                </View>
              )}
            </View>

            <View style={[s.bmiChip, { backgroundColor: chipCol + '22', borderColor: chipCol + '55' }]}>
              <View style={[s.bmiDot, { backgroundColor: chipCol }]} />
              <Text style={[s.bmiText, { color: chipCol }]}>{t(`profile.bmi_${bmiCat}`)}</Text>
            </View>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={s.statsRow}>
          {[
            { label: t('profile.stats_weight'), value: `${profile.weightKg}`, unit: 'kg' },
            { label: 'BMI',                     value: `${profile.bmi ?? '—'}`, unit: '' },
            { label: t('profile.stats_tdee'),   value: `${(tdee / 1000 >= 1 ? (tdee / 1000).toFixed(1) + 'k' : Math.round(tdee))}`, unit: 'kcal' },
          ].map((item, i) => {
            const tint = cardTintOrder[i % cardTintOrder.length];
            return (
              <View
                key={item.label}
                style={[s.statCard, { backgroundColor: cardTints[tint], borderColor: withAlpha(cardBorder[tint], 0.5) }]}
              >
                <Text style={s.statVal}>
                  {item.value}<Text style={s.statUnit}> {item.unit}</Text>
                </Text>
                <Text style={s.statLbl}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Weekly bar chart ── */}
        <Text style={s.sec}>{t('stats.weekly_report')}</Text>
        <View style={s.card}>
          <View style={s.chart}>
            {weeklyCalories.map(entry => {
              const barH = Math.max((entry.calories / maxCal) * 72, entry.calories > 0 ? 4 : 0);
              const isOver = tdee > 0 && entry.calories > tdee;
              const barCol = entry.calories === 0 ? C.border : isOver ? C.amber : C.navy;
              const day = new Date(entry.dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' });
              return (
                <View key={entry.dateStr} style={s.barWrap}>
                  <View style={s.barBg}>
                    <View style={[s.bar, { height: barH, backgroundColor: barCol }]} />
                  </View>
                  <Text style={s.barDay}>{day}</Text>
                  {entry.calories > 0 && (
                    <Text style={s.barVal}>
                      {entry.calories >= 1000 ? `${(entry.calories / 1000).toFixed(1)}k` : Math.round(entry.calories)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          {tdee > 0 && (
            <Text style={s.chartRef}>Budget: ~{Math.round(tdee).toLocaleString()} kcal/day</Text>
          )}
        </View>

        {/* ── Streaks ── */}
        <Text style={s.sec}>{t('stats.streaks')}</Text>
        <View style={s.streakRow}>
          {[
            { type: 'food',   icon: 'flame', color: C.amber,   label: t('stats.food_streak') },
            { type: 'water',  icon: 'water', color: C.skyBlue, label: t('stats.water_streak') },
            { type: 'weight', icon: 'scale', color: C.primary, label: t('stats.weight_streak') },
          ].map(({ type, icon, color, label }, i) => {
            const tint = (['blush', 'sky', 'lavender'] as const)[i % 3];
            return (
            <View key={type} style={[s.streakCard, { backgroundColor: cardTints[tint], borderColor: withAlpha(cardBorder[tint], 0.5) }]}>
              <View style={[s.streakIconBg, { backgroundColor: withAlpha('#FFFFFF', 0.6) }]}>
                <PhosphorIcon name={icon} size={20} color={color} />
              </View>
              <Text style={[s.streakNum, { color: cute.ink }]}>{streakMap[type]?.current ?? 0}</Text>
              <Text style={s.streakUnit}>{t('stats.days')}</Text>
              <Text style={s.streakLbl} numberOfLines={2}>{label}</Text>
            </View>
            );
          })}
        </View>

        {/* ── Achievements ── */}
        <Text style={s.sec}>{t('stats.achievements')}</Text>
        <View style={s.badgeGrid}>
          {BADGE_DEFS.map((def, i) => {
            const unlocked = unlockedBadgeIds.includes(def.id);
            const tint = cardTintOrder[i % cardTintOrder.length];
            return (
              <View
                key={def.id}
                style={[
                  s.badgeCard,
                  {
                    backgroundColor: unlocked ? cardTints[tint] : cute.card,
                    borderColor: unlocked ? withAlpha(cardBorder[tint], 0.5) : cute.line,
                  },
                  !unlocked && s.badgeLocked,
                ]}
              >
                <View style={[s.badgeIconBg, { backgroundColor: unlocked ? def.color + '18' : C.border + '40' }]}>
                  <PhosphorIcon name={def.icon} size={24} color={unlocked ? def.color : C.border} />
                </View>
                <Text style={[s.badgeTitle, !unlocked && { color: C.textTertiary }]} numberOfLines={2}>
                  {unlocked ? t(def.titleKey) : t('stats.locked')}
                </Text>
                {unlocked && <Text style={s.badgeDesc} numberOfLines={2}>{t(def.descKey)}</Text>}
              </View>
            );
          })}
        </View>

        {/* ── Tools ── */}
        <Text style={s.sec}>Tools</Text>
        <TouchableOpacity
          style={[s.toolCard, { backgroundColor: cardTints.peach, borderColor: withAlpha(cardBorder.peach, 0.5) }]}
          onPress={() => router.push('/measurements-hidden' as any)}
          activeOpacity={0.85}
        >
          <View style={[s.toolIcon, { backgroundColor: withAlpha('#FFFFFF', 0.75) }]}>
            <Ruler size={22} weight="fill" color={cute.ink} />
          </View>
          <View style={s.toolText}>
            <Text style={s.toolTitle}>Body Measurements</Text>
            <Text style={s.toolSub}>Track waist, hips, chest &amp; more</Text>
          </View>
          <ArrowRight size={18} color={cute.ink} weight="bold" />
        </TouchableOpacity>

        {/* ── Profile Details ── */}
        <Text style={s.sec}>{t('profile.section_details')}</Text>
        <View style={s.card}>
          {[
            { label: t('onboarding.name_label'),    fieldKey: 'name' as FieldKey,   value: profile.name || '' },
            { label: t('onboarding.gender_label'),  fieldKey: 'gender' as FieldKey, value: genLabels[profile.gender],
              options: [{ label: t('onboarding.gender_male'), value: 'male' }, { label: t('onboarding.gender_female'), value: 'female' }] },
            { label: t('onboarding.age_label'),     fieldKey: 'age' as FieldKey,    value: String(profile.age), keyboardType: 'numeric' as const },
            { label: t('onboarding.height_label'),  fieldKey: 'heightCm' as FieldKey, value: String(profile.heightCm), keyboardType: 'decimal-pad' as const },
            { label: t('onboarding.weight_label'),  fieldKey: 'weightKg' as FieldKey, value: String(profile.weightKg), keyboardType: 'decimal-pad' as const },
            { label: t('onboarding.activity_label'), fieldKey: 'activityLevel' as FieldKey, value: actLabels[profile.activityLevel],
              options: [
                { label: t('onboarding.activity_sedentary'), value: 'sedentary' },
                { label: t('onboarding.activity_light'),     value: 'lightly_active' },
                { label: t('onboarding.activity_moderate'),  value: 'moderately_active' },
                { label: t('onboarding.activity_very'),      value: 'very_active' },
              ]},
            { label: t('onboarding.target_weight_label'), fieldKey: 'targetWeightKg' as FieldKey, value: String(profile.targetWeightKg), keyboardType: 'decimal-pad' as const },
            { label: t('onboarding.deadline_label'), fieldKey: 'deadline' as FieldKey, value: profile.deadline || '' },
          ].map(item => (
            <EditableRow key={item.fieldKey} {...item} onEdit={handleFieldSave} editing={editing} setEditing={setEditing} />
          ))}
        </View>

        {/* ── Settings ── */}
        <Text style={s.sec}>{t('profile.section_settings')}</Text>
        <View style={s.card}>
          <View style={s.settingRow}>
            <Text style={s.settingLbl}>{t('profile.language_label')}</Text>
            <LanguageToggle current={profile.language} onChange={lang => setLanguage(lang)} />
          </View>
        </View>

        {/* ── About ── */}
        <View style={s.aboutRow}>
          {Constants.expoConfig?.version && (
            <Text style={s.aboutTxt}>Slimora v{Constants.expoConfig.version}</Text>
          )}
          <Text style={s.aboutTxt}>{t('profile.about_privacy')}</Text>
        </View>

        {/* ── Danger zone ── */}
        <View style={s.dangerZone}>
          <TouchableOpacity style={s.resetBtn} onPress={() => Alert.alert(
            t('profile.reset_title'), t('profile.reset_confirm'),
            [{ text: t('common.cancel'), style: 'cancel' },
             { text: t('profile.reset_action'), style: 'destructive', onPress: async () => {
               try { await resetProfile(); router.replace('/onboarding'); }
               catch { Alert.alert('Error', t('profile.reset_error')); }
             }}])}>
            <Warning size={18} weight="fill" color={C.coral} />
            <Text style={s.resetTxt}>{t('profile.reset_title')}</Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity style={s.signOutBtn} onPress={() => Alert.alert(
              'Sign Out', 'Are you sure?',
              [{ text: 'Cancel', style: 'cancel' },
               { text: 'Sign Out', style: 'destructive', onPress: () => logout() }])}>
              <SignOut size={18} weight="fill" color="#FF6B6B" />
              <Text style={s.signOutTxt}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Header — height comes from its content (measured via onLayout), so a long
  // name or a wrapped BMI label can never be clipped.
  header: { backgroundColor: 'transparent', paddingBottom: 8, paddingHorizontal: 16 },
  headerContent: {
    alignItems: 'center',
    backgroundColor: cute.card,
    borderRadius: radius.xl,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: cute.line,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  flairPill: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: withAlpha(cute.coral, 0.16),
  },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 3, borderColor: withAlpha(cute.coral, 0.3),
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    backgroundColor: withAlpha(cute.coral, 0.1),
  },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '900', color: cute.coralDeep },
  userName: { fontSize: 20, fontWeight: '800', color: cute.ink, letterSpacing: -0.3, marginBottom: 8 },
  userNameEmpty: { fontWeight: '600', color: cute.inkSoft },
  bmiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  bmiDot: { width: 7, height: 7, borderRadius: 4 },
  bmiText: { fontSize: 12, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16, marginBottom: 6 },
  statCard: {
    flex: 1, backgroundColor: C.white, borderRadius: radius.xl, padding: 16, alignItems: 'center',
    borderWidth: 1,
  },
  statVal:  { fontSize: 22, fontWeight: '900', color: C.textPrimary, letterSpacing: -0.5 },
  statUnit: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  statLbl:  { fontSize: 11, fontWeight: '600', color: C.textSecondary, marginTop: 4 },

  // Section label
  sec: {
    fontSize: 11, fontWeight: '700', color: C.textTertiary,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 8, paddingHorizontal: 16,
  },

  // Generic card
  card: {
    backgroundColor: C.white, borderRadius: 18,
    paddingHorizontal: 16, marginHorizontal: 16, marginBottom: 4,
    shadowColor: '#3D2C3E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },

  // Weekly chart
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 4, gap: 4 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  barBg:   { height: 72, justifyContent: 'flex-end', width: '100%' },
  bar:     { width: '100%', borderRadius: 5, minHeight: 2 },
  barDay:  { fontSize: 11, fontWeight: '600', color: C.textSecondary },
  barVal:  { fontSize: 9, fontWeight: '700', color: C.textTertiary },
  chartRef: { fontSize: 11, fontWeight: '600', color: C.textTertiary, textAlign: 'center', paddingVertical: 10 },

  // Streaks
  streakRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 4 },
  streakCard: {
    flex: 1, backgroundColor: C.white, borderRadius: radius.xl, padding: 16, alignItems: 'center', gap: 4,
    borderWidth: 1,
  },
  streakIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  streakNum:  { fontSize: 22, fontWeight: '900' },
  streakUnit: { fontSize: 10, fontWeight: '600', color: C.textSecondary },
  streakLbl:  { fontSize: 10, fontWeight: '600', color: C.textSecondary, textAlign: 'center' },

  // Badges
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 4 },
  badgeCard: {
    width: '47%', backgroundColor: C.white, borderRadius: radius.xl, padding: 16,
    alignItems: 'center', gap: 6,
    borderWidth: 1,
  },
  badgeLocked:  { backgroundColor: C.background },
  badgeIconBg:  { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  badgeTitle:   { fontSize: 13, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  badgeDesc:    { fontSize: 11, fontWeight: '500', color: C.textSecondary, textAlign: 'center' },

  // Tools nav card
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: radius.xl,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 4,
    gap: 12,
    borderWidth: 1,
  },
  toolIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolText: { flex: 1 },
  toolTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  toolSub: { fontSize: 12, fontWeight: '500', color: C.textSecondary, marginTop: 2 },

  // Settings
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  settingLbl: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border },
  linkRowText: { fontSize: 14, fontWeight: '500', color: C.textPrimary },

  // About
  aboutRow: { alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 8, paddingHorizontal: 16 },
  aboutTxt:  { fontSize: 12, color: C.textTertiary, textAlign: 'center' },

  // Danger zone
  dangerZone: { paddingHorizontal: 16, marginTop: 8, gap: 10, marginBottom: 16 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.coral + '60', backgroundColor: C.coral + '0A',
  },
  resetTxt: { fontSize: 14, fontWeight: '700', color: C.coral },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: '#FDEDE9',
  },
  signOutTxt: { fontSize: 14, fontWeight: '700', color: '#FF6B6B' },
});
