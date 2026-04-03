/**
 * Home screen — modern weight-loss dashboard.
 * Dark-green header · animated calorie ring · macro bars · stat cards · explore section.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Defs, RadialGradient, Stop, Rect, Path, ClipPath, G } from 'react-native-svg';
import {
  UserCircle,
  Drop,
  Scales,
  Fire,
  ForkKnife,
  Barbell,
  BookOpenText,
  MapPin,
  ArrowRight,
  Lightning,
} from 'phosphor-react-native';

import { useProfileStore } from '../../stores/profileStore';
import { useWeightStore } from '../../stores/weightStore';
import { useWaterStore } from '../../stores/waterStore';
import { useFoodStore } from '../../stores/foodStore';
import { useStatsStore } from '../../stores/statsStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import ProgressRing from '../../components/common/ProgressRing';

const { width: W } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  headerDark:    '#143D27',
  headerMid:     '#1B5233',
  headerAccent:  '#2E7D50',
  primary:       '#B39DDB',   // pastel purple
  primaryBright: '#C5B8E8',
  amber:         '#F59E0B',
  coral:         '#F9A8D4',
  blue:          '#60C8F5',
  purple:        '#B39DDB',
  white:         '#FFFFFF',
  whiteAlpha70:  'rgba(255,255,255,0.70)',
  whiteAlpha40:  'rgba(255,255,255,0.40)',
  whiteAlpha15:  'rgba(255,255,255,0.15)',
  whiteAlpha08:  'rgba(255,255,255,0.08)',
  surface:       '#FFFFFF',
  bg:            '#F7F3FF',
  text:          '#1E1B4B',
  textSub:       '#6B7280',
  border:        '#E9D5FF',
  proteinColor:  '#F9A8D4',
  carbsColor:    '#60C8F5',
  fatColor:      '#FDE68A',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting_morning';
  if (h < 17) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

// ── Animated water bottle ─────────────────────────────────────────────────────
function WaterBottle({ progress }: { progress: number }) {
  const W = 52, H = 80;
  const fillHeight = useSharedValue(0);

  useEffect(() => {
    fillHeight.value = 0;
    const t = setTimeout(() => {
      fillHeight.value = withTiming(Math.min(progress, 1), {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
    }, 100);
    return () => clearTimeout(t);
  }, [progress]);

  // Animated fill rect height & y position
  const AnimatedRect = Animated.createAnimatedComponent(Rect);
  const fillProps = useAnimatedProps(() => {
    const maxFill = 52; // usable fill area height inside bottle
    const fillH = fillHeight.value * maxFill;
    return {
      y: 22 + (maxFill - fillH),
      height: fillH,
    };
  });

  const pct = Math.round(progress * 100);
  const isComplete = progress >= 1;
  const fillColor = isComplete ? C.primary : C.blue;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={W} height={H} viewBox="0 0 52 80">
        <Defs>
          <ClipPath id="bottleClip">
            {/* Bottle shape: neck + body */}
            <Path d="M19,4 L33,4 L33,12 Q40,14 40,22 L40,74 Q40,78 36,78 L16,78 Q12,78 12,74 L12,22 Q12,14 19,12 Z" />
          </ClipPath>
        </Defs>

        {/* Bottle outline (background) */}
        <Path
          d="M19,4 L33,4 L33,12 Q40,14 40,22 L40,74 Q40,78 36,78 L16,78 Q12,78 12,74 L12,22 Q12,14 19,12 Z"
          fill={`${fillColor}18`}
          stroke={fillColor}
          strokeWidth={2}
        />

        {/* Water fill — clipped to bottle shape */}
        <G clipPath="url(#bottleClip)">
          <AnimatedRect
            x={12}
            width={28}
            fill={fillColor}
            opacity={0.85}
            animatedProps={fillProps}
          />
          {/* Shine highlight */}
          <Rect x={16} y={26} width={4} height={20} rx={2} fill="rgba(255,255,255,0.35)" />
        </G>

        {/* Bottle cap */}
        <Rect x={20} y={1} width={12} height={5} rx={2} fill={fillColor} />
      </Svg>

      {/* Percentage label */}
      <Text style={{ fontSize: 12, fontWeight: '800', color: fillColor, marginTop: 4 }}>
        {isComplete ? '✓' : `${pct}%`}
      </Text>
    </View>
  );
}

// ── Decorative SVG header with vegetables ─────────────────────────────────────
function HeaderDecoration() {
  return (
    <Svg width={W} height={380} style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} 380`}>

      {/* Background blobs */}
      <SvgCircle cx={W - 50} cy={-30} r={110} fill={C.whiteAlpha08} />
      <SvgCircle cx={-30}    cy={360} r={90}  fill={C.whiteAlpha08} />
      <SvgCircle cx={W*0.1}  cy={60}  r={12}  fill={C.whiteAlpha15} />
      <SvgCircle cx={W*0.9}  cy={100} r={8}   fill={C.whiteAlpha15} />

      {/* ── BROCCOLI (top-right) ── */}
      {/* stem */}
      <Rect x={W-52} y={42} width={6} height={22} rx={3} fill="#4CAF50" opacity={0.9} />
      {/* crown circles */}
      <SvgCircle cx={W-49} cy={36} r={14} fill="#66BB6A" opacity={0.9} />
      <SvgCircle cx={W-62} cy={40} r={10} fill="#81C784" opacity={0.9} />
      <SvgCircle cx={W-36} cy={40} r={10} fill="#81C784" opacity={0.9} />
      <SvgCircle cx={W-49} cy={28} r={9}  fill="#A5D6A7" opacity={0.9} />
      {/* detail dots */}
      <SvgCircle cx={W-53} cy={33} r={3}  fill="#388E3C" opacity={0.6} />
      <SvgCircle cx={W-44} cy={30} r={2}  fill="#388E3C" opacity={0.6} />
      <SvgCircle cx={W-56} cy={40} r={2}  fill="#388E3C" opacity={0.5} />

      {/* ── CARROT (top-left) ── */}
      {/* leaves */}
      <Path d="M38,18 Q34,8 28,12 Q32,16 36,22 Z"  fill="#66BB6A" opacity={0.9} />
      <Path d="M40,16 Q40,4  34,6  Q36,14 40,18 Z"  fill="#81C784" opacity={0.9} />
      <Path d="M42,18 Q48,8  52,14 Q46,16 42,22 Z"  fill="#66BB6A" opacity={0.9} />
      {/* body */}
      <Path d="M34,20 Q30,48 40,56 Q50,48 46,20 Z"  fill="#FF8A65" opacity={0.95} />
      {/* stripes */}
      <Path d="M34,26 Q40,24 46,26" stroke="#E64A19" strokeWidth={1.2} fill="none" opacity={0.5} />
      <Path d="M33,33 Q40,31 47,33" stroke="#E64A19" strokeWidth={1.2} fill="none" opacity={0.5} />
      <Path d="M34,40 Q40,38 46,40" stroke="#E64A19" strokeWidth={1.2} fill="none" opacity={0.5} />

      {/* ── APPLE (right side, mid) ── */}
      {/* leaf + stem */}
      <Path d="M${W-28},155 Q${W-20},148 ${W-16},156" fill="#66BB6A" opacity={0.9} />
      <Rect x={W-26} y={155} width={3} height={8} rx={1.5} fill="#795548" opacity={0.9} />
      {/* body */}
      <Path d={`M${W-40},165 Q${W-42},150 ${W-28},152 Q${W-14},150 ${W-16},165 Q${W-14},185 ${W-28},188 Q${W-42},185 ${W-40},165 Z`}
        fill="#EF9A9A" opacity={0.9} />
      {/* shine */}
      <SvgCircle cx={W-33} cy={162} r={4} fill="rgba(255,255,255,0.4)" />

      {/* ── TOMATO (left side, mid) ── */}
      {/* leaves */}
      <Path d="M22,170 Q18,162 12,166 Q16,170 20,176 Z" fill="#66BB6A" opacity={0.9} />
      <Path d="M26,168 Q26,160 20,162 Q22,168 24,174 Z" fill="#81C784" opacity={0.9} />
      <Path d="M30,170 Q36,162 40,166 Q34,170 32,176 Z" fill="#66BB6A" opacity={0.9} />
      {/* body */}
      <SvgCircle cx={26} cy={184} r={20} fill="#EF5350" opacity={0.9} />
      {/* shine */}
      <SvgCircle cx={20} cy={178} r={5} fill="rgba(255,255,255,0.35)" />

      {/* ── LEMON (bottom-right corner) ── */}
      <Path d={`M${W-44},270 Q${W-48},255 ${W-36},252 Q${W-24},250 ${W-22},262 Q${W-20},276 ${W-32},280 Q${W-46},282 ${W-44},270 Z`}
        fill="#FFF176" opacity={0.9} />
      {/* texture lines */}
      <Path d={`M${W-38},258 Q${W-32},264 ${W-38},272`} stroke="#F9A825" strokeWidth={1} fill="none" opacity={0.5} />
      <Path d={`M${W-30},256 Q${W-24},263 ${W-30},271`} stroke="#F9A825" strokeWidth={1} fill="none" opacity={0.5} />
      {/* nub */}
      <SvgCircle cx={W-22} cy={262} r={3} fill="#F9A825" opacity={0.7} />

      {/* ── AVOCADO (bottom-left) ── */}
      {/* outer */}
      <Path d="M14,260 Q10,240 20,228 Q30,220 38,230 Q46,242 42,262 Q38,278 28,280 Q16,278 14,260 Z"
        fill="#558B2F" opacity={0.9} />
      {/* inner flesh */}
      <Path d="M18,260 Q16,244 24,234 Q32,226 36,236 Q42,248 38,262 Q34,274 26,274 Q18,272 18,260 Z"
        fill="#DCEDC8" opacity={0.95} />
      {/* seed */}
      <SvgCircle cx={28} cy={256} r={10} fill="#8D6E63" opacity={0.9} />
      <SvgCircle cx={26} cy={253} r={4}  fill="#A1887F" opacity={0.5} />

      {/* ── Small sparkle dots ── */}
      <SvgCircle cx={W*0.5} cy={20}  r={3} fill="rgba(255,255,255,0.3)" />
      <SvgCircle cx={W*0.3} cy={140} r={4} fill="rgba(255,255,255,0.2)" />
      <SvgCircle cx={W*0.7} cy={220} r={3} fill="rgba(255,255,255,0.2)" />
      <SvgCircle cx={W*0.55} cy={290} r={4} fill="rgba(255,255,255,0.15)" />

      {/* Wavy bottom edge */}
      <Path
        d={`M0,348 Q${W*0.25},375 ${W*0.5},355 Q${W*0.75},335 ${W},358 L${W},380 L0,380 Z`}
        fill={C.bg}
      />
    </Svg>
  );
}

// ── Animated macro bar ────────────────────────────────────────────────────────
function MacroBar({
  label, value, total, color, delay,
}: { label: string; value: number; total: number; color: string; delay: number }) {
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = 0;
    const t = setTimeout(() => {
      width.value = withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) });
    }, delay);
    return () => clearTimeout(t);
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${interpolate(width.value, [0, 1], [0, 100])}%` as any,
  }));

  return (
    <View style={mb.macroItem}>
      <View style={mb.macroLabelRow}>
        <Text style={mb.macroLabel}>{label}</Text>
        <Text style={mb.macroValue}>{Math.round(value)}g</Text>
      </View>
      <View style={[mb.track, { backgroundColor: `${color}30` }]}>
        <Animated.View style={[mb.fill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

const mb = StyleSheet.create({
  macroItem:    { flex: 1 },
  macroLabelRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  macroLabel:   { fontSize: 11, fontWeight: '600', color: C.whiteAlpha70, letterSpacing: 0.3 },
  macroValue:   { fontSize: 11, fontWeight: '700', color: C.white },
  track:        { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill:         { height: 6, borderRadius: 3 },
});

// ── Quick-access card ─────────────────────────────────────────────────────────
function ExploreCard({
  title, subtitle, icon, iconBg, accentColor, onPress, index,
}: {
  title: string; subtitle: string;
  icon: React.ReactNode; iconBg: string; accentColor: string;
  onPress: () => void; index: number;
}) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.97]) }],
    opacity:   interpolate(pressed.value, [0, 1], [1, 0.92]),
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80 + 300).springify()}
      style={animStyle}
    >
      <TouchableOpacity
        style={[ec.card, { borderLeftColor: accentColor }]}
        onPress={onPress}
        onPressIn={() => { pressed.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { pressed.value = withSpring(0, { damping: 12, stiffness: 200 }); }}
        activeOpacity={1}
      >
        <View style={[ec.iconWrap, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={ec.textWrap}>
          <Text style={ec.title}>{title}</Text>
          <Text style={ec.sub}>{subtitle}</Text>
        </View>
        <View style={[ec.arrow, { backgroundColor: `${accentColor}15` }]}>
          <ArrowRight size={16} color={accentColor} weight="bold" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ec = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title:    { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  sub:      { fontSize: 12, fontWeight: '500', color: C.textSub },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({
  icon, value, label, color, index,
}: { icon: React.ReactNode; value: string; label: string; color: string; index: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 70 + 200).springify()} style={sc.chip}>
      <View style={[sc.iconBg, { backgroundColor: `${color}18` }]}>{icon}</View>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  value:  { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  label:  { fontSize: 11, fontWeight: '600', color: C.textSub, textAlign: 'center' },
});

// ── Mini water/weight cards ───────────────────────────────────────────────────
function MiniCard({
  icon, label, labelColor, children, onPress, index,
}: {
  icon: React.ReactNode; label: string; labelColor: string;
  children: React.ReactNode; onPress: () => void; index: number;
}) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.96]) }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80 + 100).springify()}
      style={[animStyle, { flex: 1 }]}
    >
      <TouchableOpacity
        style={mcard.card}
        onPress={onPress}
        onPressIn={() => { pressed.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { pressed.value = withSpring(0, { damping: 12, stiffness: 200 }); }}
        activeOpacity={1}
      >
        <View style={mcard.labelRow}>
          {icon}
          <Text style={[mcard.label, { color: labelColor }]}>{label}</Text>
        </View>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const mcard = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  label:    { fontSize: 12, fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const { todayLog: weightToday, logs: weightLogs } = useWeightStore();
  const waterToday = useWaterStore((s) => s.today);
  const dayLogs    = useFoodStore((s) => s.dayLogs);
  const streakMap  = useStatsStore((s) => s.streakMap);
  const totalBurned = useWorkoutStore((s) => s.totalBurned);

  const foodTotals = {
    calories: dayLogs.reduce((a, l) => a + l.calories, 0),
    proteinG: dayLogs.reduce((a, l) => a + l.proteinG, 0),
    carbsG:   dayLogs.reduce((a, l) => a + l.carbsG, 0),
    fatG:     dayLogs.reduce((a, l) => a + l.fatG, 0),
  };

  const foodStreak = streakMap['food']?.current ?? 0;

  const [calorieProgress, setCalorieProgress] = useState(0);
  const [waterProgress,   setWaterProgress]   = useState(0);

  useFocusEffect(
    useCallback(() => {
      useWeightStore.getState().loadLogs();
      useWaterStore.getState().loadToday();
      useFoodStore.getState().loadDayLogs();
      useStatsStore.getState().loadStats();
      useWorkoutStore.getState().loadToday();

      setCalorieProgress(0);
      setWaterProgress(0);

      const id = setTimeout(() => {
        const p    = useProfileStore.getState().profile;
        const tdee = p?.tdee ?? 0;
        const cal  = useFoodStore.getState().getTotals().calories;
        setCalorieProgress(tdee > 0 ? Math.min(cal / tdee, 1) : 0);
        const w    = useWaterStore.getState().today;
        const goal = w?.goalMl ?? 2000;
        const tot  = w?.totalMl ?? 0;
        setWaterProgress(goal > 0 ? Math.min(tot / goal, 1) : 0);
      }, 80);
      return () => clearTimeout(id);
    }, [])
  );

  if (!profile) {
    return (
      <View style={s.emptyState}>
        <UserCircle size={64} color={C.border} weight="regular" />
        <Text style={s.emptyText}>{t('home.empty_state')}</Text>
      </View>
    );
  }

  const tdee      = profile.tdee ?? 0;
  const consumed  = Math.round(foodTotals.calories);
  const remaining = Math.max(tdee - consumed, 0);
  const overBudget = consumed > tdee;
  const ringColor  = overBudget ? C.amber : '#C5B8E8';

  const waterTotalMl = waterToday?.totalMl ?? 0;
  const waterGoalMl  = waterToday?.goalMl  ?? 2000;

  const currentWeight  = weightToday?.weightKg ?? profile.weightKg;
  const targetWeight   = profile.targetWeightKg;
  const startWeight    = weightLogs.length > 0 ? weightLogs[0].weightKg : profile.weightKg;
  const totalNeeded    = Math.abs(startWeight - targetWeight);
  const achieved       = Math.abs(startWeight - currentWeight);
  const goalProgress   = totalNeeded > 0 ? Math.min(achieved / totalNeeded, 1) : 0;

  const name = profile.name || '';

  // Macro daily targets (rough estimates from TDEE)
  const proteinTarget = Math.round((tdee * 0.25) / 4);
  const carbsTarget   = Math.round((tdee * 0.50) / 4);
  const fatTarget     = Math.round((tdee * 0.25) / 9);

  const waterDisplay = (ml: number) =>
    ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ─────────────────────────────────────── */}
      <View style={s.header}>
        <HeaderDecoration />

        {/* Greeting row */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.greetRow}>
          <View>
            <Text style={s.greetText}>{t(greetingKey(), { name })}</Text>
            <Text style={s.dateText}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          {foodStreak >= 2 && (
            <View style={s.streakPill}>
              <Text style={s.streakEmoji}>🔥</Text>
              <Text style={s.streakNum}>{foodStreak}</Text>
            </View>
          )}
        </Animated.View>

        {/* Calorie ring */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.ringWrap}>
          <ProgressRing
            progress={calorieProgress}
            size={200}
            strokeWidth={14}
            color={ringColor}
            backgroundColor={C.whiteAlpha15}
          >
            <View style={s.ringCenter}>
              <Text style={[s.ringMain, { color: ringColor }]}>
                {remaining.toLocaleString()}
              </Text>
              <Text style={s.ringSub}>kcal remaining</Text>
              <Text style={s.ringBudget}>of ~{tdee.toLocaleString()}</Text>
            </View>
          </ProgressRing>
        </Animated.View>

        {/* Macro bars */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={s.macroRow}>
          <MacroBar label="Protein" value={foodTotals.proteinG} total={proteinTarget} color={C.purple}  delay={150} />
          <View style={s.macroDivider} />
          <MacroBar label="Carbs"   value={foodTotals.carbsG}   total={carbsTarget}   color={C.blue}    delay={200} />
          <View style={s.macroDivider} />
          <MacroBar label="Fat"     value={foodTotals.fatG}      total={fatTarget}     color={C.amber}   delay={250} />
        </Animated.View>
      </View>

      {/* ── BODY ───────────────────────────────────────── */}
      <View style={s.body}>

        {/* Stat chips row */}
        <Animated.View entering={FadeInUp.delay(80).springify()} style={s.sectionLabel}>
          <Text style={s.sectionTitle}>Today's Stats</Text>
        </Animated.View>

        <View style={s.chipsRow}>
          <StatChip
            icon={<Fire size={20} weight="fill" color="#F59E0B" />}
            value={consumed.toLocaleString()}
            label="Consumed"
            color="#F59E0B"
            index={0}
          />
          <StatChip
            icon={<Drop size={20} weight="fill" color="#0EA5E9" />}
            value={waterDisplay(waterTotalMl)}
            label="Water"
            color="#0EA5E9"
            index={1}
          />
          {totalBurned > 0 && (
            <StatChip
              icon={<Lightning size={20} weight="fill" color="#EC4899" />}
              value={totalBurned.toLocaleString()}
              label="Burned"
              color="#EC4899"
              index={2}
            />
          )}
        </View>

        {/* Water + Weight cards */}
        <View style={s.miniCardsRow}>
          <MiniCard
            icon={<Drop size={14} weight="fill" color="#0EA5E9" />}
            label="Water"
            labelColor="#0EA5E9"
            onPress={() => router.push('/water-hidden')}
            index={0}
          >
            <WaterBottle progress={waterProgress} />
            <Text style={s.miniSub}>
              {waterDisplay(waterTotalMl)} / {waterDisplay(waterGoalMl)}
            </Text>
          </MiniCard>

          <MiniCard
            icon={<Scales size={14} weight="regular" color="#B39DDB" />}
            label="Weight"
            labelColor="#B39DDB"
            onPress={() => router.push('/weight-hidden')}
            index={1}
          >
            <Text style={[s.bigValue, { color: C.text }]}>{currentWeight} kg</Text>
            <View style={s.goalTrack}>
              <View style={[s.goalFill, { width: `${goalProgress * 100}%` as any }]} />
            </View>
            <Text style={s.miniSub}>Goal: {targetWeight} kg</Text>
          </MiniCard>
        </View>

        {/* Explore section */}
        <Animated.View entering={FadeInUp.delay(160).springify()} style={s.sectionLabel}>
          <Text style={s.sectionTitle}>Explore</Text>
        </Animated.View>

        <ExploreCard
          title="Recipes"
          subtitle="Browse healthy Malaysian meals"
          icon={<BookOpenText size={24} weight="fill" color="#F59E0B" />}
          iconBg="#FFFBEB"
          accentColor="#F59E0B"
          onPress={() => router.push('/recipes-hidden')}
          index={0}
        />
        <ExploreCard
          title="Activity"
          subtitle="Log workouts & calories burned"
          icon={<Barbell size={24} weight="fill" color="#EC4899" />}
          iconBg="#FDF2F8"
          accentColor="#EC4899"
          onPress={() => router.push('/activity-hidden')}
          index={1}
        />
        <ExploreCard
          title="Nearby"
          subtitle="Find healthy food spots near you"
          icon={<MapPin size={24} weight="fill" color="#0EA5E9" />}
          iconBg="#E0F4FF"
          accentColor="#0EA5E9"
          onPress={() => router.push('/grocery-hidden')}
          index={2}
        />
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: C.headerDark,
    paddingTop: 64,
    paddingBottom: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 400,
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    zIndex: 1,
  },
  greetText: {
    fontSize: 24,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.whiteAlpha70,
    marginTop: 3,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.whiteAlpha15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.whiteAlpha40,
  },
  streakEmoji: { fontSize: 16 },
  streakNum:   { fontSize: 15, fontWeight: '800', color: C.white },

  ringWrap:   { marginBottom: 24, zIndex: 1 },
  ringCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  ringMain:   { fontSize: 34, fontWeight: '800', letterSpacing: -0.6, lineHeight: 40, color: '#FFFFFF' },
  ringSub:    { fontSize: 13, fontWeight: '600', color: C.whiteAlpha70, marginTop: 2 },
  ringBudget: { fontSize: 12, fontWeight: '500', color: C.whiteAlpha70, marginTop: 2 },

  macroRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 0,
    backgroundColor: C.whiteAlpha08,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 1,
  },
  macroDivider: { width: 1, backgroundColor: C.whiteAlpha15, marginHorizontal: 12 },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },

  sectionLabel: { marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.2 },

  chipsRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  miniCardsRow:{ flexDirection: 'row', gap: 12, marginBottom: 24 },

  miniSub:  { fontSize: 11, fontWeight: '500', color: C.textSub, textAlign: 'center' },
  bigValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  goalTrack:{ width: '100%', height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  goalFill: { height: 6, backgroundColor: '#B39DDB', borderRadius: 3 },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: C.textSub, textAlign: 'center', paddingHorizontal: 32 },
});
