import { useState, useCallback } from 'react';
import {
  Alert,
  Dimensions,
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
import Svg, {
  Rect, Circle as SvgCircle, Defs, LinearGradient, Stop, Path,
} from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  PencilSimple, Check, XCircle,
  Fire, Drop, Scales, ForkKnife, Trophy, TrendDown,
  SignOut, Warning, Sun, ArrowClockwise,
} from 'phosphor-react-native';
import Constants from 'expo-constants';

import { pastelColors as C, pastelSpacing as spacing } from '../../../constants/pastel-theme';
import {
  getBMICategory, calculateCalorieTarget,
  type BMICategory, type ActivityLevel, type Gender, type GoalType,
} from '../../../constants/tdee';
import { useProfileStore } from '../../../stores/profileStore';
import { useAuthStore } from '../../../stores/authStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useStatsStore, BADGE_DEFS, getFlairEmoji } from '../../../stores/statsStore';
import type { NotifType } from '../../../services/notifications';

const W = Dimensions.get('window').width;

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
  chipOn: { borderColor: C.navy, backgroundColor: '#EEF1F9' },
  chipTxt:   { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  chipTxtOn: { color: C.navy },
});

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({ type, label, enabled, hour, minute, onToggle, onTimePress }: {
  type: NotifType; label: string; enabled: boolean; hour: number; minute: number;
  onToggle: (v: boolean) => void; onTimePress: () => void;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <View style={notif.row}>
      <View style={{ flex: 1 }}>
        <Text style={notif.label}>{label}</Text>
        <TouchableOpacity onPress={onTimePress} disabled={!enabled}>
          <Text style={[notif.time, !enabled && { color: C.border }]}>{pad(hour)}:{pad(minute)}</Text>
        </TouchableOpacity>
      </View>
      <Switch value={enabled} onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.navy }} thumbColor={C.white} />
    </View>
  );
}

const notif = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  time:  { fontSize: 12, fontWeight: '700', color: C.navy, marginTop: 2 },
});

// ─── Time picker ──────────────────────────────────────────────────────────────

function TimePicker({ hour, minute, onSave, onClose }: { hour: number; minute: number; onSave: (h: number, m: number) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [h, setH] = useState(String(hour));
  const [m, setM] = useState(String(minute).padStart(2, '0'));
  const save = () => { onSave(Math.min(Math.max(parseInt(h) || 0, 0), 23), Math.min(Math.max(parseInt(m) || 0, 0), 59)); };
  return (
    <View style={tp.backdrop}>
      <View style={tp.modal}>
        <Text style={tp.title}>{t('notif.time_label')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <TextInput style={tp.input} value={h} onChangeText={setH} keyboardType="numeric" maxLength={2} selectTextOnFocus />
          <Text style={tp.colon}>:</Text>
          <TextInput style={tp.input} value={m} onChangeText={setM} keyboardType="numeric" maxLength={2} selectTextOnFocus />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={onClose} style={tp.cancel}><Text style={{ color: C.textSecondary, fontWeight: '600' }}>{t('common.cancel')}</Text></TouchableOpacity>
          <TouchableOpacity onPress={save} style={tp.save}><Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{t('profile.edit_save')}</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:  { backgroundColor: C.white, borderRadius: 20, padding: 24, width: 260, gap: 20 },
  title:  { fontSize: 16, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  input:  { fontSize: 28, fontWeight: '800', color: C.navy, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, width: 68, textAlign: 'center', paddingVertical: 8 },
  colon:  { fontSize: 28, fontWeight: '800', color: C.textPrimary },
  cancel: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12, backgroundColor: C.background },
  save:   { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12, backgroundColor: C.navy },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, setLanguage, resetProfile } = useProfileStore();
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState<FieldKey | null>(null);

  const { settings: notifSettings, loadSettings, toggleNotification, updateTime } = useNotificationStore();
  const { streakMap, unlockedBadgeIds, weeklyCalories, loadStats } = useStatsStore();
  const [timePickerFor, setTimePickerFor] = useState<NotifType | null>(null);

  useFocusEffect(useCallback(() => { loadSettings(); loadStats(); }, []));

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background }}>
        <Text style={{ color: C.textSecondary }}>{t('home.empty_state')}</Text>
      </View>
    );
  }

  const bmiCat   = profile.bmi ? getBMICategory(profile.bmi) : 'normal';
  const chipCol  = bmiColor(bmiCat);
  const initials = profile.name ? profile.name.trim().charAt(0).toUpperCase() : '?';

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
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Svg width={W} height={220 + insets.top} style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${220 + insets.top}`}>
            <Defs>
              <LinearGradient id="profGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#1A2B5C" />
                <Stop offset="100%" stopColor="#243470" />
              </LinearGradient>
            </Defs>
            <Rect width={W} height={220 + insets.top} fill="url(#profGrad)" />

            {/* Ambient glows */}
            <SvgCircle cx={W * 0.85} cy={0}              r={110} fill="#FFFFFF" opacity={0.03} />
            <SvgCircle cx={W * 0.1}  cy={220 + insets.top} r={90} fill="#F0C808" opacity={0.06} />

            {/* ── Trophy — top right */}
            <Path
              d={`M${W - 62},${insets.top + 18} L${W - 30},${insets.top + 18} L${W - 30},${insets.top + 46} Q${W - 30},${insets.top + 60} ${W - 46},${insets.top + 60} Q${W - 62},${insets.top + 60} ${W - 62},${insets.top + 46} Z`}
              fill="#F0C808" opacity={0.85}
            />
            {/* trophy handles */}
            <Path d={`M${W - 62},${insets.top + 28} Q${W - 74},${insets.top + 28} ${W - 74},${insets.top + 42} Q${W - 74},${insets.top + 52} ${W - 62},${insets.top + 52}`} stroke="#F0C808" strokeWidth={3} fill="none" opacity={0.7} />
            <Path d={`M${W - 30},${insets.top + 28} Q${W - 18},${insets.top + 28} ${W - 18},${insets.top + 42} Q${W - 18},${insets.top + 52} ${W - 30},${insets.top + 52}`} stroke="#F0C808" strokeWidth={3} fill="none" opacity={0.7} />
            {/* trophy base */}
            <Rect x={W - 58} y={insets.top + 60} width={24} height={5} rx={2} fill="#F0C808" opacity={0.7} />
            <Rect x={W - 64} y={insets.top + 65} width={36} height={5} rx={2} fill="#F0C808" opacity={0.6} />
            {/* star inside trophy */}
            <SvgCircle cx={W - 46} cy={insets.top + 38} r={6} fill="rgba(255,255,255,0.4)" />

            {/* ── Apple — top left */}
            <SvgCircle cx={38} cy={insets.top + 52} r={26} fill="#C41E3A" opacity={0.88} />
            <SvgCircle cx={38} cy={insets.top + 52} r={18} fill="#E84060" opacity={0.4} />
            <SvgCircle cx={30} cy={insets.top + 42} r={5}  fill="rgba(255,255,255,0.3)" />
            <Rect x={36} y={insets.top + 24} width={4} height={10} rx={2} fill="#34D399" opacity={0.9} />
            <Path d={`M36,${insets.top + 26} Q44,${insets.top + 18} 50,${insets.top + 24}`} stroke="#34D399" strokeWidth={2.5} fill="none" opacity={0.9} />

            {/* ── Heart — right side mid */}
            <Path
              d={`M${W - 26},${insets.top + 110} C${W - 26},${insets.top + 104} ${W - 20},${insets.top + 100} ${W - 14},${insets.top + 104} C${W - 8},${insets.top + 100} ${W - 2},${insets.top + 104} ${W - 2},${insets.top + 110} C${W - 2},${insets.top + 118} ${W - 14},${insets.top + 126} ${W - 14},${insets.top + 126} C${W - 14},${insets.top + 126} ${W - 26},${insets.top + 118} ${W - 26},${insets.top + 110} Z`}
              fill="#FF6B8A" opacity={0.8}
            />

            {/* ── Flame — left side mid */}
            <Path
              d={`M26,${insets.top + 150} C20,${insets.top + 136} 28,${insets.top + 128} 26,${insets.top + 118} C30,${insets.top + 124} 34,${insets.top + 128} 32,${insets.top + 120} C38,${insets.top + 128} 40,${insets.top + 140} 34,${insets.top + 150} C32,${insets.top + 156} 28,${insets.top + 156} 26,${insets.top + 150} Z`}
              fill="#FB923C" opacity={0.8}
            />
            <Path
              d={`M28,${insets.top + 148} C25,${insets.top + 140} 29,${insets.top + 135} 28,${insets.top + 130} C31,${insets.top + 134} 32,${insets.top + 142} 30,${insets.top + 148} Z`}
              fill="#FDE68A" opacity={0.7}
            />

            {/* ── Water drop — bottom left area */}
            <Path
              d={`M${W - 38},${insets.top + 148} Q${W - 50},${insets.top + 158} ${W - 38},${insets.top + 172} Q${W - 26},${insets.top + 158} ${W - 38},${insets.top + 148} Z`}
              fill="#7EC8E3" opacity={0.75}
            />
            <SvgCircle cx={W - 42} cy={insets.top + 157} r={3} fill="rgba(255,255,255,0.5)" />

            {/* Sparkle dots */}
            <SvgCircle cx={W * 0.38} cy={insets.top + 30}  r={3} fill="#F0C808" opacity={0.55} />
            <SvgCircle cx={W * 0.55} cy={insets.top + 18}  r={2} fill="#FFFFFF" opacity={0.3} />
            <SvgCircle cx={W * 0.65} cy={insets.top + 90}  r={2} fill="#F0C808" opacity={0.4} />
            <SvgCircle cx={18}       cy={insets.top + 95}  r={3} fill="#FFFFFF" opacity={0.15} />
            <SvgCircle cx={W * 0.42} cy={insets.top + 155} r={2} fill="#FFFFFF" opacity={0.2} />

            {/* Wavy bottom */}
            <Path d={`M0,${195 + insets.top} Q${W * 0.25},${215 + insets.top} ${W * 0.5},${202 + insets.top} Q${W * 0.75},${188 + insets.top} ${W},${208 + insets.top} L${W},${220 + insets.top} L0,${220 + insets.top} Z`} fill={C.background} />
          </Svg>

          <View style={[s.headerContent, { paddingTop: insets.top + 24 }]}>
            {/* Avatar */}
            <View style={s.avatarRing}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarLetter}>{initials}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={[s.userName, { marginBottom: 0 }]}>{profile.name || '—'}</Text>
              {getFlairEmoji(unlockedBadgeIds) && (
                <Text style={{ fontSize: 18 }}>{getFlairEmoji(unlockedBadgeIds)}</Text>
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
          ].map(item => (
            <View key={item.label} style={s.statCard}>
              <Text style={s.statVal}>{item.value}<Text style={s.statUnit}> {item.unit}</Text></Text>
              <Text style={s.statLbl}>{item.label}</Text>
            </View>
          ))}
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
          ].map(({ type, icon, color, label }) => (
            <View key={type} style={s.streakCard}>
              <View style={[s.streakIconBg, { backgroundColor: color + '18' }]}>
                <PhosphorIcon name={icon} size={20} color={color} />
              </View>
              <Text style={[s.streakNum, { color }]}>{streakMap[type]?.current ?? 0}</Text>
              <Text style={s.streakUnit}>{t('stats.days')}</Text>
              <Text style={s.streakLbl} numberOfLines={2}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Achievements ── */}
        <Text style={s.sec}>{t('stats.achievements')}</Text>
        <View style={s.badgeGrid}>
          {BADGE_DEFS.map(def => {
            const unlocked = unlockedBadgeIds.includes(def.id);
            return (
              <View key={def.id} style={[s.badgeCard, !unlocked && s.badgeLocked]}>
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

        {/* ── Reminders ── */}
        <Text style={s.sec}>{t('notif.section')}</Text>
        <View style={s.card}>
          {([
            'breakfast', 'lunch', 'dinner', 'snack', 'water', 'weigh_in',
            'exercise', 'streak_protection', 'weekly_report', 'motivation',
          ] as NotifType[]).map(type => {
            const ns = notifSettings?.[type];
            if (!ns) return null;
            return (
              <NotifRow key={type} type={type} label={t(`notif.${type}`)}
                enabled={ns.enabled} hour={ns.hour} minute={ns.minute}
                onToggle={val => toggleNotification(type, val).catch(() => Alert.alert('', t('notif.permission_denied')))}
                onTimePress={() => setTimePickerFor(type)} />
            );
          })}
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
              <SignOut size={18} weight="fill" color="#DC2626" />
              <Text style={s.signOutTxt}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {timePickerFor && notifSettings?.[timePickerFor] && (
        <TimePicker
          hour={notifSettings[timePickerFor].hour}
          minute={notifSettings[timePickerFor].minute}
          onClose={() => setTimePickerFor(null)}
          onSave={(h, m) => { updateTime(timePickerFor, h, m); setTimePickerFor(null); }} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Header
  header: { backgroundColor: '#1A2B5C', height: 220, overflow: 'hidden' },
  headerContent: { alignItems: 'center', paddingBottom: 24 },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarCircle: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: '#F0C808',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '900', color: '#1A2B5C' },
  userName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 8 },
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
    flex: 1, backgroundColor: C.white, borderRadius: 18, padding: 14, alignItems: 'center',
    shadowColor: '#1A2B5C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  statVal:  { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  statUnit: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
  statLbl:  { fontSize: 11, fontWeight: '600', color: C.textSecondary, marginTop: 3 },

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
    shadowColor: '#1A2B5C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
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
    flex: 1, backgroundColor: C.white, borderRadius: 18, padding: 14, alignItems: 'center', gap: 4,
    shadowColor: '#1A2B5C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  streakIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  streakNum:  { fontSize: 22, fontWeight: '900' },
  streakUnit: { fontSize: 10, fontWeight: '600', color: C.textSecondary },
  streakLbl:  { fontSize: 10, fontWeight: '600', color: C.textSecondary, textAlign: 'center' },

  // Badges
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 4 },
  badgeCard: {
    width: '47%', backgroundColor: C.white, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 6,
    shadowColor: '#1A2B5C', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  badgeLocked:  { backgroundColor: C.background },
  badgeIconBg:  { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  badgeTitle:   { fontSize: 13, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  badgeDesc:    { fontSize: 11, fontWeight: '500', color: C.textSecondary, textAlign: 'center' },

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
    paddingVertical: 14, borderRadius: 14, backgroundColor: '#FEF2F2',
  },
  signOutTxt: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
});
