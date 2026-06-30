/**
 * Home screen — pastel color palette with food illustrations.
 * Soft green gradient header · animated ring · colorful cards · explore section.
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
import Svg, { Circle as SvgCircle, Defs, RadialGradient, Stop, Rect, Path, ClipPath, G, Ellipse, Line, LinearGradient } from 'react-native-svg';
import {
  UserCircle,
  Drop,
  Scales,
  Fire,
  ForkKnife,
  Barbell,
  BookOpenText,
  MapPin,
  Clock,
  ArrowRight,
  Lightning,
  PlusCircle,
  ChartLineUp,
} from 'phosphor-react-native';

import { useProfileStore } from '../../stores/profileStore';
import { useWeightStore } from '../../stores/weightStore';
import { useWaterStore } from '../../stores/waterStore';
import { useFoodStore } from '../../stores/foodStore';
import { useStatsStore, BADGE_DEFS, type BadgeDef } from '../../stores/statsStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useFastingStore } from '../../stores/fastingStore';
import { projectGoalDate, type GoalProjection } from '../../services/goalProjection';
import GoalCountdownCard from '../../components/ui/GoalCountdownCard';
import AdBanner from '../../components/ui/AdBanner';
import CelebrationModal from '../../components/ui/CelebrationModal';
import BadgeToast from '../../components/ui/BadgeToast';

const { width: W, height: H } = Dimensions.get('window');
const RF = (size: number) => Math.round(size * (W / 390));
const RFV = (size: number) => Math.round(size * (H / 780));

// ── Figma: "Modernize Weight Loss Tracker UI" ─────────────────────────────────────
// Dashboard palette: Ruby #C41E3A · Papyrus #E8DCC4 · Citron #F0C808
const C = {
  // Header — papyrus cream (Figma Dashboard)
  headerTop:    '#E8DCC4',
  headerMid:    '#F5EFE7',
  headerBottom: '#FFF9E6',

  // Core brand
  primary:      '#C41E3A',   // Ruby red
  secondary:    '#E8DCC4',   // Papyrus beige
  amber:        '#F0C808',   // Sunny Citron
  amberDark:    '#D4AF07',
  coral:        '#C41E3A',
  pink:         '#FFE4E6',
  blue:         '#BFDBFE',
  purple:       '#DDD6FE',
  orange:       '#FB923C',
  green:        '#10B981',

  // Neutrals
  white:         '#FFFFFF',
  whiteAlpha80:  'rgba(255,255,255,0.80)',
  whiteAlpha70:  'rgba(255,255,255,0.70)',
  whiteAlpha60:  'rgba(255,255,255,0.60)',
  whiteAlpha50:  'rgba(255,255,255,0.50)',
  whiteAlpha30:  'rgba(255,255,255,0.30)',
  whiteAlpha15:  'rgba(255,255,255,0.15)',

  surface:       '#FFFFFF',
  bg:            '#F5EFE7',  // warm cream page background
  text:          '#3D2B1F',  // warm dark brown
  textSub:       '#7A6A5A',  // muted warm brown
  textLight:     '#A89880',  // light warm brown

  // Figma stat card tints
  cardMint:      '#D1FAE5',  // green — meals
  cardYellow:    '#FFF9E6',  // citron — calories
  cardPink:      '#FFE4E6',  // ruby — weight
  cardBlue:      '#DBEAFE',  // blue — water
  cardPurple:    '#EDE9FE',
  cardOrange:    '#FFEDD5',  // orange — burned

  // Macro track colors
  proteinColor:  '#C41E3A',  // ruby
  carbsColor:    '#F0C808',  // citron
  fatColor:      '#FB923C',  // orange

  border:        '#EDE8DF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────────
function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting_morning';
  if (h < 17) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

// ── Animated calorie ring ───────────────────────────────────────────────────────
function AnimatedCalorieRing({ 
  progress, 
  size = 200,
  color = C.primary,
}: { 
  progress: number; 
  size?: number;
  color?: string;
}) {
  const ringProgress = useSharedValue(0);
  
  useEffect(() => {
    ringProgress.value = withTiming(Math.min(progress, 1), {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);
  
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);
  
  const animatedProps = useAnimatedProps(() => {
    const offset = circ * (1 - ringProgress.value);
    return {
      strokeDashoffset: offset,
    };
  });
  
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#C41E3A" />
            <Stop offset="100%" stopColor="#F0C808" />
          </LinearGradient>
        </Defs>
        {/* Background ring track */}
        <SvgCircle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring — red→yellow gradient */}
        <AnimatedCircle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${size/2}, ${size/2})`}
        />
      </Svg>
    </View>
  );
}

// ── Animated water bottle ───────────────────────────────────────────────────────
function WaterBottle({ progress }: { progress: number }) {
  const W = 56, H = 84;
  const fillHeight = useSharedValue(0);
  
  useEffect(() => {
    fillHeight.value = withTiming(Math.min(progress, 1), {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);
  
  const AnimatedRect = Animated.createAnimatedComponent(Rect);
  const fillProps = useAnimatedProps(() => {
    const maxFill = 54;
    const fillH = fillHeight.value * maxFill;
    return {
      y: 20 + (maxFill - fillH),
      height: fillH,
    };
  });
  
  const pct = Math.round(progress * 100);
  const isComplete = progress >= 1;
  const fillColor = isComplete ? C.primary : '#7EC8E3';
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id="bottleClip3">
            <Path d="M18,4 L38,4 L38,10 Q44,12 44,20 L44,76 Q44,80 40,80 L16,80 Q12,80 12,76 L12,20 Q12,12 18,10 Z" />
          </ClipPath>
        </Defs>
        
        {/* Bottle outline */}
        <Path
          d="M18,4 L38,4 L38,10 Q44,12 44,20 L44,76 Q44,80 40,80 L16,80 Q12,80 12,76 L12,20 Q12,12 18,10 Z"
          fill={`${fillColor}20`}
          stroke={fillColor}
          strokeWidth={2.5}
        />
        
        {/* Water fill */}
        <G clipPath="url(#bottleClip3)">
          <AnimatedRect
            x={12}
            width={32}
            fill={fillColor}
            opacity={0.8}
            animatedProps={fillProps}
          />
          {/* Shine */}
          <Rect x={16} y={24} width={4} height={24} rx={2} fill="rgba(255,255,255,0.5)" />
        </G>
        
        {/* Cap */}
        <Rect x={20} y={1} width={16} height={5} rx={2} fill={fillColor} />
      </Svg>
      
      <Text style={{ fontSize: 13, fontWeight: '800', color: fillColor, marginTop: 6 }}>
        {isComplete ? '✓' : `${pct}%`}
      </Text>
    </View>
  );
}

// ── Fasting Clock Component ─────────────────────────────────────────────────────
const FASTING_SCHEDULES = [
  { label: '16:8', fastingHours: 16, eatHours: 8, color: '#FF8A80' },
  { label: '18:6', fastingHours: 18, eatHours: 6, color: '#FFB74D' },
  { label: '20:4', fastingHours: 20, eatHours: 4, color: '#FF7043' },
];

function AnimatedFastingClock({ 
  schedule, 
  currentHour,
  isFasting,
  startHour = 20,
}: { 
  schedule: typeof FASTING_SCHEDULES[0];
  currentHour: number;
  isFasting: boolean;
  startHour?: number;
}) {
  const size = RF(90);
  const SW = 9;                         // stroke width for arcs
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - SW / 2 - 2;     // ring fits fully inside SVG

  const eatingStart = startHour;
  const eatingEnd = (startHour + schedule.eatHours) % 24;

  const hourToAngle = (hour: number) => (hour / 24) * 360 - 90;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const currentAngle = hourToAngle(currentHour);

  const arcPath = (startDeg: number, endDeg: number, isLarge: boolean) => {
    const s = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
    const e = { x: cx + r * Math.cos(toRad(endDeg)), y: cy + r * Math.sin(toRad(endDeg)) };
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${isLarge ? 1 : 0} 1 ${e.x} ${e.y}`;
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="fastingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF8A80" />
            <Stop offset="100%" stopColor="#FF7043" />
          </LinearGradient>
          <LinearGradient id="eatingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#81C784" />
            <Stop offset="100%" stopColor="#66BB6A" />
          </LinearGradient>
        </Defs>

        {/* Track ring */}
        <SvgCircle cx={cx} cy={cy} r={r} fill="#F5FBF8" stroke="#E8F4F0" strokeWidth={SW} />

        {/* Fasting arc (red) — longer window */}
        <Path
          d={arcPath(hourToAngle(eatingEnd), hourToAngle(eatingStart), schedule.fastingHours > 12)}
          stroke="url(#fastingGrad)"
          strokeWidth={SW}
          fill="none"
          strokeLinecap="round"
        />

        {/* Eating arc (green) — shorter window */}
        <Path
          d={arcPath(hourToAngle(eatingStart), hourToAngle(eatingEnd), schedule.eatHours > 12)}
          stroke="url(#eatingGrad)"
          strokeWidth={SW}
          fill="none"
          strokeLinecap="round"
        />

        {/* Current time dot — sits on the ring */}
        <SvgCircle
          cx={cx + r * Math.cos(toRad(currentAngle))}
          cy={cy + r * Math.sin(toRad(currentAngle))}
          r={5}
          fill={isFasting ? '#FF8A80' : '#81C784'}
        />
        <SvgCircle
          cx={cx + r * Math.cos(toRad(currentAngle))}
          cy={cy + r * Math.sin(toRad(currentAngle))}
          r={2.5}
          fill="white"
        />

        {/* Center circle */}
        <SvgCircle cx={cx} cy={cy} r={r - SW / 2 - 4} fill="white" />

        {/* Clock hands */}
        {(() => {
          const innerR = r - SW / 2 - 4;
          const hourAngle = toRad(((currentHour % 12) / 12) * 360 - 90);
          const minAngle  = toRad(((currentHour % 1) * 360) - 90);
          const handColor = isFasting ? '#FF8A80' : '#56AB91';
          return (
            <G>
              <Path
                d={`M ${cx} ${cy} L ${cx + innerR * 0.5 * Math.cos(hourAngle)} ${cy + innerR * 0.5 * Math.sin(hourAngle)}`}
                stroke={handColor} strokeWidth={2.5} strokeLinecap="round"
              />
              <Path
                d={`M ${cx} ${cy} L ${cx + innerR * 0.75 * Math.cos(minAngle)} ${cy + innerR * 0.75 * Math.sin(minAngle)}`}
                stroke={handColor} strokeWidth={1.5} strokeLinecap="round"
              />
              <SvgCircle cx={cx} cy={cy} r={2} fill={handColor} />
            </G>
          );
        })()}
      </Svg>

      <View style={{ flexDirection: 'row', marginTop: RF(6), gap: RF(10) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#81C784' }} />
          <Text style={{ fontSize: RF(9), color: '#6B8E7A' }}>{schedule.eatHours}h eat</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF8A80' }} />
          <Text style={{ fontSize: RF(9), color: '#6B8E7A' }}>{schedule.fastingHours}h fast</Text>
        </View>
      </View>
    </View>
  );
}

// ── Decorative header (navy + food graphics) ────────────────────────────────
function HeaderDecoration({ h }: { h: number }) {
  return (
    <Svg width={W} height={h} style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${h}`}>
      <Defs>
        <LinearGradient id="navyHomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1A2B5C" />
          <Stop offset="100%" stopColor="#243470" />
        </LinearGradient>
      </Defs>

      {/* Navy background */}
      <Rect width={W} height={h} fill="url(#navyHomeGrad)" />

      {/* Ambient glows */}
      <SvgCircle cx={W * 0.85} cy={-20}    r={130} fill="#FFFFFF" opacity={0.03} />
      <SvgCircle cx={W * 0.08} cy={h * 0.9} r={110} fill="#F0C808" opacity={0.06} />

      {/* ── Apple — top left */}
      <SvgCircle cx={38}  cy={90} r={28} fill="#C41E3A" opacity={0.9} />
      <SvgCircle cx={38}  cy={90} r={20} fill="#E84060" opacity={0.45} />
      <SvgCircle cx={30}  cy={80} r={6}  fill="rgba(255,255,255,0.25)" />
      {/* stem */}
      <Rect x={36} y={60} width={4} height={10} rx={2} fill="#34D399" opacity={0.9} />
      <Path d="M36,62 Q44,54 50,60" stroke="#34D399" strokeWidth={2.5} fill="none" opacity={0.9} />

      {/* ── Lemon — top right */}
      <Ellipse cx={W - 38} cy={76} rx={28} ry={22} fill="#F0C808" opacity={0.92} />
      <Ellipse cx={W - 38} cy={76} rx={18} ry={14} fill="#FFF176" opacity={0.7} />
      <SvgCircle cx={W - 48} cy={68} r={5} fill="rgba(255,255,255,0.5)" />

      {/* ── Orange — right side mid */}
      <SvgCircle cx={W - 22} cy={h * 0.45} r={34} fill="#FB923C" opacity={0.8} />
      <SvgCircle cx={W - 22} cy={h * 0.45} r={24} fill="#FDBA74" opacity={0.55} />
      <SvgCircle cx={W - 32} cy={h * 0.45 - 9} r={7} fill="rgba(255,255,255,0.35)" />

      {/* ── Water drop — left side */}
      <Path
        d={`M28,${h * 0.5 - 20} Q18,${h * 0.5} 28,${h * 0.5 + 20} Q38,${h * 0.5} 28,${h * 0.5 - 20}`}
        fill="#7EC8E3" opacity={0.7}
      />
      <SvgCircle cx={24} cy={h * 0.5 - 5} r={3} fill="rgba(255,255,255,0.5)" />

      {/* ── Avocado — bottom left area */}
      <Ellipse cx={52} cy={h - 80} rx={20} ry={26} fill="#34D399" opacity={0.75} />
      <Ellipse cx={52} cy={h - 76} rx={12} ry={16} fill="#FDE68A" opacity={0.85} />
      <Ellipse cx={52} cy={h - 74} rx={6}  ry={9}  fill="#92400E" opacity={0.6} />

      {/* Sparkle dots */}
      <SvgCircle cx={W * 0.38} cy={50}        r={3}   fill="#F0C808" opacity={0.6} />
      <SvgCircle cx={W * 0.62} cy={40}        r={2}   fill="#FFFFFF" opacity={0.3} />
      <SvgCircle cx={W - 16}   cy={h * 0.65}  r={4}   fill="#F0C808" opacity={0.5} />
      <SvgCircle cx={14}       cy={h * 0.72}  r={3}   fill="#FFFFFF" opacity={0.2} />

      {/* Wavy bottom transition to cream */}
      <Path
        d={`M0,${h - 28} Q${W * 0.25},${h - 8} ${W * 0.5},${h - 22} Q${W * 0.75},${h - 36} ${W},${h - 16} L${W},${h} L0,${h} Z`}
        fill="#F5EFE7"
      />
    </Svg>
  );
}

// ── Animated macro bar ──────────────────────────────────────────────────────────
function MacroBar({
  label, value, total, color, delay,
}: { label: string; value: number; total: number; color: string; delay: number }) {
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = 0;
    const t = setTimeout(() => {
      width.value = withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) });
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
      <View style={[mb.track, { backgroundColor: `${color}40` }]}>
        <Animated.View style={[mb.fill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

const mb = StyleSheet.create({
  macroItem:    { flex: 1 },
  macroLabelRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  macroLabel:   { fontSize: 11, fontWeight: '600', color: 'rgba(61,43,31,0.65)', letterSpacing: 0.3 },
  macroValue:   { fontSize: 11, fontWeight: '700', color: '#3D2B1F' },
  track:        { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill:         { height: 8, borderRadius: 4 },
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
    opacity:   interpolate(pressed.value, [0, 1], [1, 0.95]),
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80 + 350).springify()}
      style={animStyle}
    >
      <TouchableOpacity
        style={[ec.card, { backgroundColor: C.surface }]}
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
          <ArrowRight size={18} color={accentColor} weight="bold" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ec = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EDE8DF',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title:    { fontSize: 16, fontWeight: '700', color: '#3D2B1F', marginBottom: 3 },
  sub:      { fontSize: 13, fontWeight: '500', color: '#7A6A5A' },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({
  icon, value, label, color, bgColor, index,
}: { icon: React.ReactNode; value: string; label: string; color: string; bgColor: string; index: number }) {
  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 70 + 220).springify()} 
      style={[sc.chip, { backgroundColor: bgColor }]}
    >
      <View style={sc.iconBg}>{icon}</View>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  chip: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)' },
  value:  { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  label:  { fontSize: 11, fontWeight: '600', color: '#7A6A5A', textAlign: 'center' },
});

// ── Mini water/weight cards ───────────────────────────────────────────────────
function MiniCard({
  icon, label, labelColor, bgColor, children, onPress, index,
}: {
  icon: React.ReactNode; label: string; labelColor: string; bgColor: string;
  children: React.ReactNode; onPress: () => void; index: number;
}) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.96]) }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80 + 120).springify()}
      style={[animStyle, { flex: 1 }]}
    >
      <TouchableOpacity
        style={[mcard.card, { backgroundColor: bgColor }]}
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
    borderRadius: 26,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  label:    { fontSize: 13, fontWeight: '700' },
});

// ── Main screen ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const { todayLog: weightToday, logs: weightLogs } = useWeightStore();
  const waterToday = useWaterStore((s) => s.today);
  const dayLogs    = useFoodStore((s) => s.dayLogs);
  const streakMap  = useStatsStore((s) => s.streakMap);
  const totalBurned = useWorkoutStore((s) => s.totalBurned);
  const fastingToday = useFastingStore((s) => s.today);
  const fastingProgress = useFastingStore((s) => s.getProgress());
  const isProfileLoaded = useProfileStore((s) => s.isLoaded);
  const isFoodLoaded = useFoodStore((s) => s.isLoaded);

  const foodTotals = {
    calories: Number(dayLogs.reduce((a, l) => a + Number(l.calories), 0)),
    proteinG: Number(dayLogs.reduce((a, l) => a + Number(l.proteinG), 0)),
    carbsG:   Number(dayLogs.reduce((a, l) => a + Number(l.carbsG), 0)),
    fatG:     Number(dayLogs.reduce((a, l) => a + Number(l.fatG), 0)),
  };

  const foodStreak = Number(streakMap['food']?.current) || 0;

  const [calorieProgress, setCalorieProgress] = useState(0);
  const [waterProgress,   setWaterProgress]   = useState(0);
  const [milestoneQueue, setMilestoneQueue] = useState<BadgeDef[]>([]);
  const [toastQueue, setToastQueue] = useState<BadgeDef[]>([]);

  useFocusEffect(
    useCallback(() => {
      useWeightStore.getState().loadLogs();
      useWaterStore.getState().loadToday();
      useFoodStore.getState().loadDayLogs();
      useStatsStore.getState().loadStats().then((newlyUnlocked) => {
        if (newlyUnlocked.length === 0) return;
        const defs = newlyUnlocked
          .map((id) => BADGE_DEFS.find((b) => b.id === id))
          .filter(Boolean) as BadgeDef[];
        setMilestoneQueue((q) => [...q, ...defs.filter((d) => d.isMilestone)]);
        setToastQueue((q) => [...q, ...defs.filter((d) => !d.isMilestone)]);
      });
      useWorkoutStore.getState().loadToday();
      useFastingStore.getState().loadToday();

      setCalorieProgress(0);
      setWaterProgress(0);

      const id = setTimeout(() => {
        const p    = useProfileStore.getState().profile;
        const budget = Number(p?.calorieTarget ?? p?.tdee) || 0;
        const cal  = Number(useFoodStore.getState().getTotals().calories);
        setCalorieProgress(budget > 0 ? Math.min(cal / budget, 1) : 0);
        const w    = useWaterStore.getState().today;
        const goal = Number(w?.goalMl) || 2000;
        const tot  = Number(w?.totalMl) || 0;
        setWaterProgress(goal > 0 ? Math.min(tot / goal, 1) : 0);
      }, 100);
      return () => clearTimeout(id);
    }, [])
  );

  if (!isProfileLoaded || !isFoodLoaded) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.emptyState}>
        <UserCircle size={72} color={C.textLight} weight="regular" />
        <Text style={s.emptyText}>{t('home.empty_state')}</Text>
      </View>
    );
  }

  const tdee      = Number(profile.calorieTarget ?? profile.tdee) || 0;
  const consumed  = Math.round(Number(foodTotals.calories));
  const remaining = Math.max(tdee - consumed, 0);
  const overBudget = consumed > tdee;
  const ringColor  = overBudget ? C.coral : C.amber;

  const waterTotalMl = Number(waterToday?.totalMl) || 0;
  const waterGoalMl  = Number(waterToday?.goalMl) || 2000;

  const currentWeight  = Number(weightToday?.weightKg) || Number(profile.weightKg);
  const targetWeight   = Number(profile.targetWeightKg);
  const startWeight    = weightLogs.length > 0 ? Number(weightLogs[0].weightKg) : Number(profile.weightKg);
  const totalNeeded    = Math.abs(startWeight - targetWeight);
  const achieved       = Math.abs(startWeight - currentWeight);
  const goalProgress   = totalNeeded > 0 ? Math.min(achieved / totalNeeded, 1) : 0;

  const goalProjection: GoalProjection | null = projectGoalDate(
    weightLogs.map((w) => ({ dateStr: w.dateStr, weightKg: w.weightKg })),
    targetWeight,
    new Date().toISOString().split('T')[0]
  );

  const name = profile.name || '';

  // Macro daily targets
  const proteinTarget = Math.round((tdee * 0.25) / 4);
  const carbsTarget   = Math.round((tdee * 0.50) / 4);
  const fatTarget     = Math.round((tdee * 0.25) / 9);

  const waterDisplay = (ml: number) =>
    ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;

  return (
    <>
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ─────────────────────────────────────── */}
      <View style={s.header}>
        <HeaderDecoration h={s.header.minHeight as number} />

        {/* Greeting row */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.greetRow}>
          <View style={{ flex: 1, flexShrink: 1, marginRight: RF(10) }}>
            <Text style={s.greetText} numberOfLines={2}>{t(greetingKey(), { name })}</Text>
            <Text style={s.dateText} numberOfLines={1}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          {foodStreak >= 2 && (
            <View style={s.streakPill}>
              <Fire size={16} color="#F0C808" weight="fill" />
              <Text style={s.streakNum}>{foodStreak}</Text>
            </View>
          )}
        </Animated.View>

        {/* Calorie ring */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={s.ringWrap}>
          <AnimatedCalorieRing progress={calorieProgress} size={210} color={ringColor} />
          <View style={s.ringCenter}>
            <Text style={s.ringMain}>
              {Number(remaining).toLocaleString()}
            </Text>
            <Text style={s.ringSub}>kcal remaining</Text>
            <Text style={s.ringBudget}>of ~{Number(tdee).toLocaleString()}</Text>
          </View>
        </Animated.View>

      </View>

      {/* ── BODY ───────────────────────────────────────── */}
      <View style={s.body}>

        {/* ── BENTO GRID ─────────────────────────────────────── */}

        {/* Row 1: Macros */}
        <View style={s.bentoRow}>
          {([
            { label: 'Protein', value: Number(foodTotals.proteinG), target: proteinTarget, color: '#C41E3A', bg: '#FFF0F1' },
            { label: 'Carbs',   value: Number(foodTotals.carbsG),   target: carbsTarget,   color: '#B8860B', bg: '#FFFDE7' },
            { label: 'Fat',     value: Number(foodTotals.fatG),      target: fatTarget,     color: '#E07B2A', bg: '#FFF3E0' },
          ] as const).map((m, i) => (
            <Animated.View key={m.label} entering={FadeInUp.delay(80 + i * 40).springify()} style={[s.bentoCard, s.bentoThird, { backgroundColor: m.bg }]}>
              <Text style={[s.bentoNum, { color: m.color }]}>
                {Math.round(m.value)}<Text style={s.bentoUnit}>g</Text>
              </Text>
              <Text style={[s.bentoLabel, { color: m.color }]}>{m.label}</Text>
              <View style={[s.bentoTrack, { backgroundColor: `${m.color}20` }]}>
                <View style={[s.bentoFill, {
                  width: `${m.target > 0 ? Math.min((m.value / m.target) * 100, 100) : 0}%` as any,
                  backgroundColor: m.color,
                }]} />
              </View>
              <Text style={s.bentoGoal}>{Math.round(m.target)}g goal</Text>
            </Animated.View>
          ))}
        </View>

        {/* Row 2: Water + Burned */}
        <View style={s.bentoRow}>
          <Animated.View entering={FadeInUp.delay(200).springify()} style={{ flex: 3 }}>
            <TouchableOpacity onPress={() => router.push('/water-hidden')} activeOpacity={0.85}>
              <View style={[s.bentoCard, { backgroundColor: '#E8F5E9' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Drop size={18} weight="fill" color="#4CAF50" />
                  <Text style={[s.bentoLabel, { color: '#388E3C' }]}>Water</Text>
                </View>
                <Text style={[s.bentoNum, { color: '#2E7D32', fontSize: RF(28), marginTop: 6 }]}>
                  {waterDisplay(waterTotalMl)}
                </Text>
                <View style={[s.bentoTrack, { backgroundColor: 'rgba(76,175,80,0.15)', marginTop: 10 }]}>
                  <View style={[s.bentoFill, { width: `${Math.min(waterProgress * 100, 100)}%` as any, backgroundColor: '#4CAF50' }]} />
                </View>
                <Text style={s.bentoGoal}>of {waterDisplay(waterGoalMl)}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {totalBurned > 0 && (
            <Animated.View entering={FadeInUp.delay(230).springify()} style={{ flex: 2 }}>
              <View style={[s.bentoCard, { backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center', minHeight: 120 }]}>
                <Lightning size={24} weight="fill" color="#F1C045" />
                <Text style={[s.bentoNum, { color: '#B8860B', fontSize: RF(24), marginTop: 6 }]}>
                  {Number(totalBurned).toLocaleString()}
                </Text>
                <Text style={[s.bentoLabel, { color: '#B8860B' }]}>Burned</Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Row 3: Fasting */}
        <Animated.View entering={FadeInUp.delay(260).springify()}>
          <TouchableOpacity onPress={() => router.push('/fasting-hidden')} activeOpacity={0.85}>
            <View style={[s.bentoCard, { backgroundColor: '#FFF8F8' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <AnimatedFastingClock
                  schedule={FASTING_SCHEDULES.find(sch => sch.fastingHours === fastingToday?.durationHours) || FASTING_SCHEDULES[0]}
                  currentHour={new Date().getHours() + new Date().getMinutes() / 60}
                  isFasting={fastingToday?.isActive || false}
                  startHour={fastingToday?.startHour || 20}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <Clock size={14} weight="fill" color="#A6171C" />
                    <Text style={[s.bentoLabel, { color: '#A6171C' }]}>Fasting</Text>
                  </View>
                  <Text style={[s.bentoNum, { color: '#3D2B1F', fontSize: RF(28) }]}>
                    {fastingToday?.isActive ? `${fastingToday.durationHours}h` : '—'}
                  </Text>
                  <Text style={s.bentoGoal}>
                    {fastingToday?.isActive ? 'Active fast' : 'Tap to set schedule'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Goal Countdown */}
        <Animated.View entering={FadeInUp.delay(160).springify()} style={{ marginBottom: 16 }}>
          <GoalCountdownCard projection={goalProjection} />
        </Animated.View>

        {/* Quick Actions — matching Figma */}
        <Animated.View entering={FadeInUp.delay(180).springify()} style={s.sectionLabel}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
        </Animated.View>
        <View style={s.quickActionsRow}>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: '#F0C808' }]}
            onPress={() => router.push('/(tabs)/food-log')}
            activeOpacity={0.85}
          >
            <PlusCircle size={20} weight="fill" color="#3D2B1F" />
            <Text style={[s.quickBtnText, { color: '#3D2B1F' }]}>Add Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: '#C41E3A' }]}
            onPress={() => router.push('/water-hidden')}
            activeOpacity={0.85}
          >
            <PlusCircle size={20} weight="fill" color="#FFFFFF" />
            <Text style={[s.quickBtnText, { color: '#FFFFFF' }]}>Log Water</Text>
          </TouchableOpacity>
        </View>

        {/* Explore section */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={[s.sectionLabel, { marginTop: RFV(12) }]}>
          <Text style={s.sectionTitle}>Explore</Text>
        </Animated.View>

        <ExploreCard
          title="Recipes"
          subtitle="Browse healthy meals"
          icon={<BookOpenText size={26} weight="fill" color="#F1C045" />}
          iconBg="#FFF8E1"
          accentColor="#F1C045"
          onPress={() => router.push('/recipes-hidden')}
          index={0}
        />
        <ExploreCard
          title="Activity"
          subtitle="Log workouts"
          icon={<Barbell size={26} weight="fill" color="#4CAF50" />}
          iconBg="#E8F5E9"
          accentColor="#4CAF50"
          onPress={() => router.push('/activity-hidden')}
          index={1}
        />
        <ExploreCard
          title="Weekly Report"
          subtitle="See how this week went"
          icon={<ChartLineUp size={26} weight="fill" color="#42A5F5" />}
          iconBg="#E3F2FD"
          accentColor="#42A5F5"
          onPress={() => router.push('/weekly-report')}
          index={2}
        />
        <AdBanner />
        <View style={{ height: 100 }} />
      </View>
    </ScrollView>

    {milestoneQueue[0] && (
      <CelebrationModal
        visible
        title={t(milestoneQueue[0].titleKey)}
        subtitle={t(milestoneQueue[0].descKey)}
        onClose={() => setMilestoneQueue((q) => q.slice(1))}
      />
    )}
    {toastQueue[0] && (
      <BadgeToast
        badge={toastQueue[0]}
        title={t(toastQueue[0].titleKey)}
        onDone={() => setToastQueue((q) => q.slice(1))}
      />
    )}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },

  // Header — navy (consistent with food-log & profile)
  header: {
    paddingTop: RFV(64),
    paddingBottom: RFV(36),
    paddingHorizontal: RF(20),
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: RFV(420),
    backgroundColor: '#1A2B5C',
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: RFV(20),
    zIndex: 1,
  },
  greetText: {
    fontSize: RF(22),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: RF(28),
  },
  dateText: {
    fontSize: RF(12),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginTop: RFV(4),
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(240,200,8,0.18)',
    paddingHorizontal: RF(12),
    paddingVertical: RF(6),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(240,200,8,0.35)',
  },
  streakNum: { fontSize: RF(14), fontWeight: '800', color: '#F0C808' },

  ringWrap:   { marginBottom: RFV(20), zIndex: 1, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center', paddingTop: RFV(24) },
  ringMain:   { fontSize: RF(30), fontWeight: '800', letterSpacing: -0.6, lineHeight: RF(36), color: '#FFFFFF' },
  ringSub:    { fontSize: RF(11), fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginTop: RFV(4) },
  ringBudget: { fontSize: RF(10), fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginTop: RFV(2) },

  macroRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 0,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: RF(20),
    paddingHorizontal: RF(14),
    paddingVertical: RF(14),
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  macroDivider: { width: 1, backgroundColor: 'rgba(61,43,31,0.12)', marginHorizontal: RF(12) },

  // Body
  body: { paddingHorizontal: 18, paddingTop: 32 },

  sectionLabel: { marginBottom: RFV(12), marginTop: RFV(4) },
  sectionTitle: { fontSize: RF(17), fontWeight: '700', color: '#3D2B1F', letterSpacing: -0.2 },

  // Bento grid
  bentoRow: { flexDirection: 'row', gap: RF(10), marginBottom: RFV(10) },
  bentoCard: {
    borderRadius: 24,
    padding: RF(16),
    shadowColor: '#1A2B5C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  bentoThird: { flex: 1 },
  bentoNum: { fontSize: RF(26), fontWeight: '900', letterSpacing: -0.5 },
  bentoUnit: { fontSize: RF(14), fontWeight: '700' },
  bentoLabel: { fontSize: RF(11), fontWeight: '700', marginTop: 2 },
  bentoGoal: { fontSize: RF(10), fontWeight: '500', color: '#9A9A9A', marginTop: RF(4) },
  bentoTrack: { width: '100%', height: 5, borderRadius: 3, overflow: 'hidden', marginTop: RF(8) },
  bentoFill: { height: 5, borderRadius: 3 },

  // Quick Actions
  quickActionsRow: { flexDirection: 'row', gap: RF(12), marginBottom: RFV(20) },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: RFV(54),
    borderRadius: 20,
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  quickBtnText: { fontSize: RF(15), fontWeight: '700' },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    gap: RFV(14),
  },
  emptyText: { fontSize: RF(14), color: C.textSub, textAlign: 'center', paddingHorizontal: RF(28) },
});
