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
} from 'phosphor-react-native';

import { useProfileStore } from '../../stores/profileStore';
import { useWeightStore } from '../../stores/weightStore';
import { useWaterStore } from '../../stores/waterStore';
import { useFoodStore } from '../../stores/foodStore';
import { useStatsStore } from '../../stores/statsStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useFastingStore } from '../../stores/fastingStore';

const { width: W, height: H } = Dimensions.get('window');
const RF = (size: number) => Math.round(size * (W / 390));
const RFV = (size: number) => Math.round(size * (H / 780));

// ── Pastel color palette ─────────────────────────────────────────────────────────
const C = {
  // Pastel green gradient (fresh, healthy)
  headerTop:     '#A8E6CF',    // mint green
  headerMid:     '#88D8B0',    // soft green
  headerBottom: '#56AB91',    // deeper green
  
  // Pastel accent colors
  primary:      '#56AB91',    // soft green
  secondary:    '#A8E6CF',    // mint
  amber:        '#FFD93D',    // pastel yellow
  coral:        '#FF8A80',   // pastel red
  pink:         '#FFB5E8',    // pastel pink
  blue:         '#7EC8E3',    // pastel blue
  purple:       '#B5A8D8',    // pastel purple
  orange:       '#FFB74D',    // pastel orange
  
  // Neutrals
  white:         '#FFFFFF',
  whiteAlpha80:  'rgba(255,255,255,0.80)',
  whiteAlpha70:  'rgba(255,255,255,0.70)',
  whiteAlpha50:  'rgba(255,255,255,0.50)',
  whiteAlpha30:  'rgba(255,255,255,0.30)',
  whiteAlpha15:  'rgba(255,255,255,0.15)',
  
  surface:       '#FFFFFF',
  bg:            '#F5FBF8',   // very light mint
  text:          '#2D4A3E',   // dark green-brown
  textSub:       '#6B8E7A',   // muted green
  textLight:     '#A5C4B4',   // light green
  
  // Pastel card backgrounds
  cardMint:      '#E8F8F0',
  cardYellow:   '#FFF9E6',
  cardPink:     '#FFEAF0',
  cardBlue:     '#E8F4F8',
  cardPurple:   '#F0EBF8',
  cardOrange:   '#FFF2E6',
  
  // Status colors
  proteinColor:  '#FF8A80',   // coral
  carbsColor:    '#7EC8E3',   // blue
  fatColor:      '#FFD93D',   // yellow
  
  border:        '#D4EDE3',
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
        {/* Background ring */}
        <SvgCircle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke={C.whiteAlpha30}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring */}
        <AnimatedCircle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke={color}
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

// ── Decorative food illustrations ───────────────────────────────────────────────
function HeaderDecoration() {
  const screenWidth = Dimensions.get('window').width;
  const WR = screenWidth;
  const svgH = RFV(420);
  
  return (
    <Svg width={W} height={svgH} style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} 420`}>
      {/* Solid green background */}
      <Rect width={W} height={420} fill={C.headerTop} />
      
      {/* Floating decorative circles */}
      <SvgCircle cx={W * 0.1} cy={-30} r={70} fill={C.whiteAlpha30} />
      <SvgCircle cx={W * 0.85} cy={-50} r={90} fill={C.whiteAlpha30} />
      <SvgCircle cx={W * 0.6} cy={400} r={80} fill={C.whiteAlpha30} />
      <SvgCircle cx={W * 0.15} cy={380} r={50} fill={C.whiteAlpha30} />
      
      {/* ── APPLE (top-left) ── */}
      <Ellipse cx={50} cy={90} rx={28} ry={30} fill="#FF8A80" opacity={0.9} />
      <Ellipse cx={50} cy={90} rx={20} ry={22} fill="#FFCDD2" />
      <Rect x={48} y={56} width={4} height={10} rx={2} fill="#56AB91" />
      <Path d="M48,56 Q55,48 60,55" fill="#81C784" />
      
      {/* ── BANANA (top-right) ── */}
      <Path d={`M${WR - 70},80 Q${WR - 50},70 ${WR - 30},90 Q${WR - 10},110 ${WR + 10},90`} stroke="#FFEB3B" strokeWidth={14} fill="none" strokeLinecap="round" />
      <Path d={`M${WR - 70},80 Q${WR - 50},70 ${WR - 30},90 Q${WR - 10},110 ${WR + 10},90`} stroke="#FDD835" strokeWidth={6} fill="none" strokeLinecap="round" />
      
      {/* ── GRAPE (mid-left) ── */}
      <SvgCircle cx={25} cy={170} r={10} fill="#CE93D8" />
      <SvgCircle cx={40} cy={165} r={10} fill="#BA68C8" />
      <SvgCircle cx={55} cy={170} r={10} fill="#CE93D8" />
      <SvgCircle cx={32} cy={185} r={10} fill="#AB47BC" />
      <SvgCircle cx={47} cy={185} r={10} fill="#CE93D8" />
      <SvgCircle cx={40} cy={198} r={10} fill="#BA68C8" />
      {/* Stem */}
      <Rect x={38} y={152} width={4} height={10} rx={2} fill="#56AB91" />
      
      {/* ── STRAWBERRY (mid-right) ── */}
      <Path d={`M${WR - 45},165 Q${WR - 45},145 ${WR - 25},145 Q${WR - 5},145 ${WR - 5},165 Q${WR - 5},190 ${WR - 25},190 Q${WR - 45},190 ${WR - 45},165 Z`} fill="#FF8A80" />
      <SvgCircle cx={WR - 30} cy={153} r={2.5} fill="#FFF59D" />
      <SvgCircle cx={WR - 22} cy={157} r={2.5} fill="#FFF59D" />
      <SvgCircle cx={WR - 38} cy={157} r={2.5} fill="#FFF59D" />
      {/* Leaf */}
      <Path d={`M${WR - 30},145 Q${WR - 30},133 ${WR - 22},137`} stroke="#81C784" strokeWidth={2.5} fill="none" />
      <Path d={`M${WR - 38},143 Q${WR - 38},131 ${WR - 30},135`} stroke="#81C784" strokeWidth={2.5} fill="none" />
      
      {/* ── CARROT (bottom-left) ── */}
      <Path d={`M35,280 L55,340 L15,340 Z`} fill="#FFB74D" />
      {/* Carrot lines */}
      <Line x1={28} y1={295} x2={42} y2={295} stroke="#FF9800" strokeWidth={1.5} />
      <Line x1={25} y1={310} x2={45} y2={310} stroke="#FF9800" strokeWidth={1.5} />
      <Line x1={22} y1={325} x2={48} y2={325} stroke="#FF9800" strokeWidth={1.5} />
      {/* Leaves */}
      <Path d="M35,280 Q25,265 30,272" stroke="#81C784" strokeWidth={3} fill="none" />
      <Path d="M35,280 Q35,265 40,270" stroke="#66BB6A" strokeWidth={3} fill="none" />
      <Path d="M35,280 Q45,265 50,272" stroke="#81C784" strokeWidth={3} fill="none" />
      
      {/* ── BROCOLI (bottom-right) ── */}
      <Rect x={WR - 35} y={300} width={8} height={28} rx={4} fill="#56AB91" />
      <SvgCircle cx={WR - 31} cy={285} r={18} fill="#81C784" />
      <SvgCircle cx={WR - 48} cy={292} r={14} fill="#A5D6A7" />
      <SvgCircle cx={WR - 14} cy={292} r={14} fill="#A5D6A7" />
      <SvgCircle cx={WR - 31} cy={275} r={12} fill="#C8E6C9" />
      
      {/* ── LEMON (floating) ── */}
      <Ellipse cx={W * 0.75} cy={220} rx={28} ry={20} fill="#FFF59D" opacity={0.9} />
      <Ellipse cx={W * 0.75} cy={220} rx={20} ry={14} fill="#FFFDE7" />
      <SvgCircle cx={W * 0.72} cy={214} r={4} fill="rgba(255,255,255,0.5)" />
      
      {/* ── PEACH (floating) ── */}
      <Ellipse cx={W * 0.25} cy={260} rx={24} ry={20} fill="#FFAB91" />
      <Ellipse cx={W * 0.25} cy={260} rx={18} ry={14} fill="#FFCCBC" />
      <SvgCircle cx={W * 0.22} cy={254} r={3} fill="rgba(255,255,255,0.5)" />
      
      {/* Sparkles */}
      <SvgCircle cx={W * 0.4} cy={60} r={4} fill={C.white} opacity={0.6} />
      <SvgCircle cx={W * 0.7} cy={100} r={3} fill={C.white} opacity={0.5} />
      <SvgCircle cx={W * 0.3} cy={320} r={3} fill={C.white} opacity={0.4} />
      <SvgCircle cx={W * 0.8} cy={350} r={2} fill={C.white} opacity={0.35} />
      
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
  macroLabel:   { fontSize: 11, fontWeight: '600', color: 'rgba(45,74,62,0.75)', letterSpacing: 0.3 },
  macroValue:   { fontSize: 11, fontWeight: '700', color: '#2D4A3E' },
  track:        { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill:         { height: 10, borderRadius: 5 },
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
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title:    { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 3 },
  sub:      { fontSize: 13, fontWeight: '500', color: C.textSub },
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
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
  value:  { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  label:  { fontSize: 11, fontWeight: '600', color: C.textSub, textAlign: 'center' },
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
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: C.border,
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

  useFocusEffect(
    useCallback(() => {
      useWeightStore.getState().loadLogs();
      useWaterStore.getState().loadToday();
      useFoodStore.getState().loadDayLogs();
      useStatsStore.getState().loadStats();
      useWorkoutStore.getState().loadToday();
      useFastingStore.getState().loadToday();

      setCalorieProgress(0);
      setWaterProgress(0);

      const id = setTimeout(() => {
        const p    = useProfileStore.getState().profile;
        const tdee = Number(p?.tdee) || 0;
        const cal  = Number(useFoodStore.getState().getTotals().calories);
        setCalorieProgress(tdee > 0 ? Math.min(cal / tdee, 1) : 0);
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

  const tdee      = Number(profile.tdee) || 0;
  const consumed  = Math.round(Number(foodTotals.calories));
  const remaining = Math.max(tdee - consumed, 0);
  const overBudget = consumed > tdee;
  const ringColor  = overBudget ? C.coral : C.primary;

  const waterTotalMl = Number(waterToday?.totalMl) || 0;
  const waterGoalMl  = Number(waterToday?.goalMl) || 2000;

  const currentWeight  = Number(weightToday?.weightKg) || Number(profile.weightKg);
  const targetWeight   = Number(profile.targetWeightKg);
  const startWeight    = weightLogs.length > 0 ? Number(weightLogs[0].weightKg) : Number(profile.weightKg);
  const totalNeeded    = Math.abs(startWeight - targetWeight);
  const achieved       = Math.abs(startWeight - currentWeight);
  const goalProgress   = totalNeeded > 0 ? Math.min(achieved / totalNeeded, 1) : 0;

  const name = profile.name || '';

  // Macro daily targets
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
          <View style={{ flex: 1, flexShrink: 1, marginRight: RF(10) }}>
            <Text style={s.greetText} numberOfLines={2}>{t(greetingKey(), { name })}</Text>
            <Text style={s.dateText} numberOfLines={1}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          {foodStreak >= 2 && (
            <View style={s.streakPill}>
              <Fire size={16} color="#FF8A80" weight="fill" />
              <Text style={s.streakNum}>{foodStreak}</Text>
            </View>
          )}
        </Animated.View>

        {/* Calorie ring */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={s.ringWrap}>
          <AnimatedCalorieRing progress={calorieProgress} size={210} color={ringColor} />
          <View style={s.ringCenter}>
            <Text style={[s.ringMain, { color: '#FFFFFF' }]}>
              {Number(remaining).toLocaleString()}
            </Text>
            <Text style={s.ringSub}>kcal remaining</Text>
            <Text style={s.ringBudget}>of ~{Number(tdee).toLocaleString()}</Text>
          </View>
        </Animated.View>

        {/* Macro bars */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={s.macroRow}>
          <MacroBar label="Protein" value={Number(foodTotals.proteinG)} total={proteinTarget} color={C.proteinColor} delay={180} />
          <View style={s.macroDivider} />
          <MacroBar label="Carbs"   value={Number(foodTotals.carbsG)}   total={carbsTarget}   color={C.carbsColor} delay={230} />
          <View style={s.macroDivider} />
          <MacroBar label="Fat"     value={Number(foodTotals.fatG)}      total={fatTarget}     color={C.fatColor} delay={280} />
        </Animated.View>
      </View>

      {/* ── BODY ───────────────────────────────────────── */}
      <View style={s.body}>

        {/* Stat chips row */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={s.sectionLabel}>
          <Text style={s.sectionTitle}>Today's Stats</Text>
        </Animated.View>

        <View style={s.chipsRow}>
          <StatChip
            icon={<Fire size={22} weight="fill" color="#FF8A80" />}
            value={Number(consumed).toLocaleString()}
            label="Consumed"
            color="#E57373"
            bgColor={C.cardPink}
            index={0}
          />
          <StatChip
            icon={<Drop size={22} weight="fill" color="#7EC8E3" />}
            value={waterDisplay(waterTotalMl)}
            label="Water"
            color="#4FA3C7"
            bgColor={C.cardBlue}
            index={1}
          />
          {totalBurned > 0 && (
            <StatChip
              icon={<Lightning size={22} weight="fill" color="#FFD93D" />}
              value={Number(totalBurned).toLocaleString()}
              label="Burned"
              color="#F9A825"
              bgColor={C.cardYellow}
              index={2}
            />
          )}
        </View>

        {/* Water + Fasting cards */}
        <View style={s.miniCardsRow}>
          <MiniCard
            icon={<Drop size={16} weight="fill" color="#7EC8E3" />}
            label="Water"
            labelColor="#4FA3C7"
            bgColor={C.cardBlue}
            onPress={() => router.push('/water-hidden')}
            index={0}
          >
            <WaterBottle progress={waterProgress} />
            <Text style={s.miniSub}>
              {waterDisplay(waterTotalMl)} / {waterDisplay(waterGoalMl)}
            </Text>
          </MiniCard>

          <MiniCard
            icon={<Clock size={16} weight="fill" color="#FF8A80" />}
            label="Fasting"
            labelColor="#FF8A80"
            bgColor="#FFF0F0"
            onPress={() => router.push('/fasting-hidden')}
            index={1}
          >
            <AnimatedFastingClock 
              schedule={FASTING_SCHEDULES.find(s => s.fastingHours === fastingToday?.durationHours) || FASTING_SCHEDULES[0]}
              currentHour={new Date().getHours() + new Date().getMinutes() / 60}
              isFasting={fastingToday?.isActive || false}
              startHour={fastingToday?.startHour || 20}
            />
            <Text style={[s.miniSub, { color: '#FF8A80', marginTop: RF(4) }]}>
              {fastingToday?.isActive 
                ? `🔥 Burning Fat - ${fastingToday.durationHours}h Fast` 
                : 'Select Schedule'}
            </Text>
          </MiniCard>
        </View>

        {/* Explore section */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={[s.sectionLabel, { marginTop: RFV(12) }]}>
          <Text style={s.sectionTitle}>Explore</Text>
        </Animated.View>

        <ExploreCard
          title="Recipes"
          subtitle="Browse healthy Malaysian meals"
          icon={<BookOpenText size={26} weight="fill" color="#FFB74D" />}
          iconBg="#FFF2E6"
          accentColor="#FFB74D"
          onPress={() => router.push('/recipes-hidden')}
          index={0}
        />
        <ExploreCard
          title="Activity"
          subtitle="Log workouts & calories burned"
          icon={<Barbell size={26} weight="fill" color="#FFB5E8" />}
          iconBg="#FFEAF0"
          accentColor="#FFB5E8"
          onPress={() => router.push('/activity-hidden')}
          index={1}
        />
        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },

  // Header
  header: {
    paddingTop: RFV(60),
    paddingBottom: RFV(32),
    paddingHorizontal: RF(20),
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: RFV(420),
    backgroundColor: C.headerTop,
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
    color: C.white,
    letterSpacing: -0.4,
    lineHeight: RF(28),
  },
  dateText: {
    fontSize: RF(12),
    fontWeight: '500',
    color: C.whiteAlpha80,
    marginTop: RFV(4),
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: RF(12),
    paddingVertical: RF(6),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  streakNum: { fontSize: RF(14), fontWeight: '800', color: C.white },

  ringWrap:   { marginBottom: RFV(20), zIndex: 1, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center', paddingTop: RFV(24) },
  ringMain:   { fontSize: RF(30), fontWeight: '800', letterSpacing: -0.6, lineHeight: RF(36) },
  ringSub:    { fontSize: RF(11), fontWeight: '600', color: C.white, marginTop: RFV(4) },
  ringBudget: { fontSize: RF(10), fontWeight: '500', color: C.white, marginTop: RFV(2) },

  macroRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RF(16),
    paddingHorizontal: RF(14),
    paddingVertical: RF(12),
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  macroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: RF(12) },

  // Body
  body: { paddingHorizontal: 18, paddingTop: 32 },

  sectionLabel: { marginBottom: RFV(12), marginTop: RFV(4) },
  sectionTitle: { fontSize: RF(16), fontWeight: '800', color: C.text, letterSpacing: -0.2 },

  chipsRow:    { flexDirection: 'row', gap: RF(8), marginBottom: RFV(14) },
  miniCardsRow:{ flexDirection: 'row', gap: RF(10), marginBottom: RFV(20) },

  miniSub:  { fontSize: RF(10), fontWeight: '600', color: C.textSub, textAlign: 'center' },
  bigValue: { fontSize: RF(20), fontWeight: '800', letterSpacing: -0.3 },
  goalTrack:{ width: '100%', height: RFV(6), backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: RFV(6), backgroundColor: C.primary, borderRadius: 4 },

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
