/**
 * Intermittent Fasting page.
 * - Circular clock timer showing fasting window progress
 * - Body silhouette with fat-burn highlight that grows with progress
 * - IF plan selector (16:8, 18:6, 20:4)
 * - Start / Stop fasting button
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Svg, {
  Circle as SvgCircle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
  G,
  Ellipse,
  ClipPath,
  Rect,
} from 'react-native-svg';
import { CaretLeft, Clock, Fire, Play, Stop as StopIcon, CheckCircle } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pastelColors } from '../../constants/pastel-theme';
import { useFastingStore } from '../../stores/fastingStore';

const { width: W, height: H } = Dimensions.get('window');
const RF = (n: number) => Math.round(n * (W / 390));
const RFV = (n: number) => Math.round(n * (H / 780));

const C = pastelColors;

const PLANS = [
  { label: '16:8', fastingHours: 16, eatHours: 8, color: '#FF8A80', desc: 'Most popular beginner plan' },
  { label: '18:6', fastingHours: 18, eatHours: 6, color: '#FFB74D', desc: 'Deeper fat burn' },
  { label: '20:4', fastingHours: 20, eatHours: 4, color: '#FF7043', desc: 'Advanced — warrior diet' },
];

// ── fat-burn stages by fasting hour ─────────────────────────────────────────
function getFatBurnStage(elapsedHours: number) {
  if (elapsedHours < 4)  return { label: 'Digesting',      pct: 0.05, color: '#A8E6CF' };
  if (elapsedHours < 8)  return { label: 'Glycogen Depleting', pct: 0.25, color: '#FFD93D' };
  if (elapsedHours < 12) return { label: 'Ketosis Starting',   pct: 0.50, color: '#FFB74D' };
  if (elapsedHours < 16) return { label: 'Fat Burning',         pct: 0.75, color: '#FF8A80' };
  return                        { label: 'Deep Fat Burn',        pct: 1.00, color: '#FF5252' };
}

// ── Circular fasting clock ───────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

function FastingClock({
  progress,
  isFasting,
  elapsedMin,
  remainingMin,
  durationHours,
}: {
  progress: number;
  isFasting: boolean;
  elapsedMin: number;
  remainingMin: number;
  durationHours: number;
}) {
  const SIZE = RF(280);
  const STROKE = RF(16);
  const TICK_MARGIN = RF(22);  // space reserved outside ring for tick marks
  const r = SIZE / 2 - STROKE / 2 - TICK_MARGIN;
  const circ = 2 * Math.PI * r;

  const ring = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    ring.value = withTiming(Math.min(progress, 1), {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  useEffect(() => {
    if (isFasting) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 900 }),
          withTiming(1.00, { duration: 900 }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [isFasting]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - ring.value),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const elH = Math.floor(elapsedMin / 60);
  const elM = elapsedMin % 60;
  const remH = Math.floor(remainingMin / 60);
  const remM = remainingMin % 60;
  const pct = Math.round(progress * 100);

  const ringColor = isFasting ? '#FF8A80' : '#D4EDE3';
  const ringGlowColor = isFasting ? '#FF5252' : '#88D8B0';

  return (
    <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="clockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringGlowColor} />
            <Stop offset="100%" stopColor={ringColor} />
          </LinearGradient>
          <RadialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor={isFasting ? '#FFF0F0' : '#F5FBF8'} />
          </RadialGradient>
        </Defs>

        {/* Center fill */}
        <SvgCircle cx={SIZE / 2} cy={SIZE / 2} r={r - STROKE / 2} fill="url(#centerGrad)" />

        {/* Track */}
        <SvgCircle
          cx={SIZE / 2} cy={SIZE / 2} r={r}
          stroke="#E8F4F0" strokeWidth={STROKE} fill="none"
        />

        {/* Progress arc */}
        <AnimatedCircle
          cx={SIZE / 2} cy={SIZE / 2} r={r}
          stroke="url(#clockGrad)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          animatedProps={animProps}
          transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}
        />

        {/* Hour tick marks — outside the ring, within SVG bounds */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
          const tickR = r + STROKE / 2 + RF(6);
          const cx1 = SIZE / 2 + tickR * Math.cos(angle);
          const cy1 = SIZE / 2 + tickR * Math.sin(angle);
          const isMajor = i % 6 === 0;
          return (
            <SvgCircle
              key={i}
              cx={cx1} cy={cy1}
              r={isMajor ? RF(4) : RF(2)}
              fill={isMajor ? (isFasting ? '#FF8A80' : '#56AB91') : '#D4EDE3'}
            />
          );
        })}
      </Svg>

      {/* Center text */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {isFasting ? (
            <>
              <Fire size={RF(22)} color="#FF8A80" weight="fill" />
              <Text style={styles.clockPct}>{pct}%</Text>
              <Text style={styles.clockElapsed}>
                {String(elH).padStart(2, '0')}:{String(elM).padStart(2, '0')} elapsed
              </Text>
              <Text style={styles.clockRemaining}>
                {String(remH).padStart(2, '0')}:{String(remM).padStart(2, '0')} left
              </Text>
            </>
          ) : (
            <>
              <Clock size={RF(24)} color="#56AB91" weight="regular" />
              <Text style={styles.clockIdleLabel}>{durationHours}h Fast</Text>
              <Text style={styles.clockIdleSub}>Tap Start</Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Body silhouette with fat-burn overlay ────────────────────────────────────
function BodyGraphic({ elapsedHours, isFasting }: { elapsedHours: number; isFasting: boolean }) {
  const stage = getFatBurnStage(isFasting ? elapsedHours : 0);
  const fillAnim = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withTiming(isFasting ? stage.pct : 0, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [stage.pct, isFasting]);

  const BW = RF(120);
  const BH = RF(220);

  // Fat overlay clips from bottom upward based on progress
  const AnimatedRect = Animated.createAnimatedComponent(Rect);
  const clipProps = useAnimatedProps(() => {
    const fillH = fillAnim.value * BH;
    return {
      y: BH - fillH,
      height: fillH,
    };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={BW} height={BH} viewBox="0 0 120 220">
        <Defs>
          <LinearGradient id="fatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={stage.color} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={stage.color} stopOpacity="0.4" />
          </LinearGradient>
          <ClipPath id="fatClip">
            <AnimatedRect x={0} width={120} animatedProps={clipProps} />
          </ClipPath>
        </Defs>

        {/* Body silhouette — base (always shown in neutral color) */}
        <G>
          {/* Head */}
          <Ellipse cx={60} cy={18} rx={14} ry={16} fill="#D4EDE3" />
          {/* Neck */}
          <Rect x={54} y={32} width={12} height={10} rx={4} fill="#D4EDE3" />
          {/* Torso */}
          <Path
            d="M30 42 Q20 55 22 90 Q24 115 30 120 L90 120 Q96 115 98 90 Q100 55 90 42 Z"
            fill="#D4EDE3"
          />
          {/* Left arm */}
          <Path d="M30 44 Q14 60 18 95 Q22 105 28 100 Q30 75 38 55 Z" fill="#D4EDE3" />
          {/* Right arm */}
          <Path d="M90 44 Q106 60 102 95 Q98 105 92 100 Q90 75 82 55 Z" fill="#D4EDE3" />
          {/* Left leg */}
          <Path d="M38 118 Q32 140 33 175 Q34 195 42 195 Q50 195 52 175 Q54 145 52 118 Z" fill="#D4EDE3" />
          {/* Right leg */}
          <Path d="M82 118 Q88 140 87 175 Q86 195 78 195 Q70 195 68 175 Q66 145 68 118 Z" fill="#D4EDE3" />
        </G>

        {/* Fat burn overlay — same paths clipped from bottom up */}
        <G clipPath="url(#fatClip)">
          {/* Head */}
          <Ellipse cx={60} cy={18} rx={14} ry={16} fill="url(#fatGrad)" />
          {/* Neck */}
          <Rect x={54} y={32} width={12} height={10} rx={4} fill="url(#fatGrad)" />
          {/* Torso */}
          <Path
            d="M30 42 Q20 55 22 90 Q24 115 30 120 L90 120 Q96 115 98 90 Q100 55 90 42 Z"
            fill="url(#fatGrad)"
          />
          {/* Left arm */}
          <Path d="M30 44 Q14 60 18 95 Q22 105 28 100 Q30 75 38 55 Z" fill="url(#fatGrad)" />
          {/* Right arm */}
          <Path d="M90 44 Q106 60 102 95 Q98 105 92 100 Q90 75 82 55 Z" fill="url(#fatGrad)" />
          {/* Left leg */}
          <Path d="M38 118 Q32 140 33 175 Q34 195 42 195 Q50 195 52 175 Q54 145 52 118 Z" fill="url(#fatGrad)" />
          {/* Right leg */}
          <Path d="M82 118 Q88 140 87 175 Q86 195 78 195 Q70 195 68 175 Q66 145 68 118 Z" fill="url(#fatGrad)" />
        </G>

        {/* Flame icon center when burning */}
        {isFasting && stage.pct >= 0.5 && (
          <G>
            <Ellipse cx={60} cy={80} rx={10} ry={13} fill={stage.color} opacity={0.8} />
            <Path d="M60 70 Q65 76 63 83 Q61 87 60 90 Q59 87 57 83 Q55 76 60 70 Z" fill="#FFF" opacity={0.6} />
          </G>
        )}
      </Svg>

      <Text style={[styles.stageLabel, { color: isFasting ? stage.color : '#A5C4B4' }]}>
        {isFasting ? stage.label : 'Not fasting'}
      </Text>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function FastingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const store = useFastingStore();
  const today = useFastingStore((s) => s.today);

  // Tick every minute for live timer
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      store.loadToday();
    }, []),
  );

  const isFasting = store.isFasting();
  const progress = store.getProgress();
  const elapsedMin = store.getElapsedMinutes();
  const remainingMin = store.getRemainingMinutes();
  const elapsedHours = elapsedMin / 60;
  const durationHours = today?.durationHours ?? 16;
  const stage = getFatBurnStage(isFasting ? elapsedHours : 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <CaretLeft size={RF(22)} color="#2D4A3E" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Intermittent Fasting</Text>
        <View style={{ width: RF(40) }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + RFV(24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Clock + Body row */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.clockRow}>
          <FastingClock
            progress={progress}
            isFasting={isFasting}
            elapsedMin={elapsedMin}
            remainingMin={remainingMin}
            durationHours={durationHours}
          />
        </Animated.View>

        {/* Fat burn stage badge */}
        {isFasting && (
          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={[styles.stageBadge, { backgroundColor: stage.color + '22', borderColor: stage.color }]}>
            <Fire size={RF(14)} color={stage.color} weight="fill" />
            <Text style={[styles.stageBadgeText, { color: stage.color }]}>{stage.label}</Text>
          </Animated.View>
        )}

        {/* Body graphic */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.bodyRow}>
          <BodyGraphic elapsedHours={elapsedHours} isFasting={isFasting} />

          {/* Stage info column */}
          <View style={styles.stageInfo}>
            <Text style={styles.stageInfoTitle}>Fat Burn Status</Text>
            {[
              { h: 0,  label: 'Digesting',           color: '#A8E6CF' },
              { h: 4,  label: 'Glycogen Depleting',   color: '#FFD93D' },
              { h: 8,  label: 'Ketosis Starting',     color: '#FFB74D' },
              { h: 12, label: 'Fat Burning',           color: '#FF8A80' },
              { h: 16, label: 'Deep Fat Burn',         color: '#FF5252' },
            ].map((s) => {
              const active = isFasting && elapsedHours >= s.h;
              const isCurrent = isFasting && (() => {
                if (s.h === 16) return elapsedHours >= 16;
                if (s.h === 12) return elapsedHours >= 12 && elapsedHours < 16;
                if (s.h === 8)  return elapsedHours >= 8  && elapsedHours < 12;
                if (s.h === 4)  return elapsedHours >= 4  && elapsedHours < 8;
                return elapsedHours < 4;
              })();
              return (
                <View key={s.h} style={[styles.stageRow, isCurrent && styles.stageRowActive]}>
                  <View style={[styles.stageDot, { backgroundColor: active ? s.color : '#D4EDE3' }]} />
                  <View>
                    <Text style={[styles.stageRowLabel, { color: active ? s.color : '#A5C4B4' }]}>{s.label}</Text>
                    <Text style={styles.stageRowHour}>{s.h}h+</Text>
                  </View>
                  {isCurrent && <CheckCircle size={RF(14)} color={s.color} weight="fill" style={{ marginLeft: 'auto' }} />}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Plan selector */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.planSection}>
          <Text style={styles.planTitle}>Fasting Plan</Text>
          <View style={styles.planRow}>
            {PLANS.map((plan) => {
              const selected = durationHours === plan.fastingHours;
              return (
                <TouchableOpacity
                  key={plan.label}
                  style={[
                    styles.planCard,
                    selected && { borderColor: plan.color, backgroundColor: plan.color + '15' },
                  ]}
                  onPress={() => store.setDuration(plan.fastingHours)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.planLabel, { color: selected ? plan.color : '#6B8E7A' }]}>
                    {plan.label}
                  </Text>
                  <Text style={[styles.planDesc, { color: selected ? plan.color : '#A5C4B4' }]}>
                    {plan.desc}
                  </Text>
                  {selected && (
                    <View style={[styles.planSelectedDot, { backgroundColor: plan.color }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Start / Stop button */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.btnWrapper}>
          <TouchableOpacity
            style={[styles.mainBtn, isFasting ? styles.mainBtnStop : styles.mainBtnStart]}
            onPress={() => isFasting ? store.stopFast() : store.startFast()}
            activeOpacity={0.8}
          >
            {isFasting
              ? <StopIcon size={RF(20)} color="#FFF" weight="fill" />
              : <Play size={RF(20)} color="#FFF" weight="fill" />}
            <Text style={styles.mainBtnText}>
              {isFasting ? 'End Fast' : 'Start Fasting'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5FBF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RF(20),
    paddingVertical: RFV(14),
    backgroundColor: '#F5FBF8',
  },
  backBtn: {
    width: RF(40),
    height: RF(40),
    borderRadius: RF(20),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: {
    fontSize: RF(18),
    fontWeight: '700',
    color: '#2D4A3E',
  },
  scroll: {
    paddingHorizontal: RF(20),
    alignItems: 'center',
  },
  clockRow: {
    marginTop: RFV(8),
    marginBottom: RFV(12),
    alignItems: 'center',
  },
  clockPct: {
    fontSize: RF(36),
    fontWeight: '800',
    color: '#FF8A80',
    marginTop: RFV(4),
    letterSpacing: -1,
  },
  clockElapsed: {
    fontSize: RF(13),
    color: '#6B8E7A',
    marginTop: RFV(2),
  },
  clockRemaining: {
    fontSize: RF(12),
    color: '#A5C4B4',
    marginTop: RFV(2),
  },
  clockIdleLabel: {
    fontSize: RF(28),
    fontWeight: '800',
    color: '#56AB91',
    marginTop: RFV(6),
  },
  clockIdleSub: {
    fontSize: RF(13),
    color: '#A5C4B4',
    marginTop: RFV(4),
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RF(6),
    paddingHorizontal: RF(14),
    paddingVertical: RFV(6),
    borderRadius: RF(20),
    borderWidth: 1,
    marginBottom: RFV(16),
  },
  stageBadgeText: {
    fontSize: RF(13),
    fontWeight: '700',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: RF(20),
    marginBottom: RFV(24),
    backgroundColor: '#FFFFFF',
    borderRadius: RF(20),
    padding: RF(16),
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stageLabel: {
    fontSize: RF(12),
    fontWeight: '600',
    marginTop: RFV(8),
    textAlign: 'center',
  },
  stageInfo: {
    flex: 1,
    paddingTop: RFV(4),
  },
  stageInfoTitle: {
    fontSize: RF(13),
    fontWeight: '700',
    color: '#2D4A3E',
    marginBottom: RFV(10),
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RF(8),
    paddingVertical: RFV(5),
    paddingHorizontal: RF(6),
    borderRadius: RF(8),
    marginBottom: RFV(2),
  },
  stageRowActive: {
    backgroundColor: '#F5FBF8',
  },
  stageDot: {
    width: RF(8),
    height: RF(8),
    borderRadius: RF(4),
  },
  stageRowLabel: {
    fontSize: RF(11),
    fontWeight: '600',
  },
  stageRowHour: {
    fontSize: RF(10),
    color: '#A5C4B4',
  },
  planSection: {
    width: '100%',
    marginBottom: RFV(20),
  },
  planTitle: {
    fontSize: RF(16),
    fontWeight: '700',
    color: '#2D4A3E',
    marginBottom: RFV(12),
  },
  planRow: {
    flexDirection: 'row',
    gap: RF(10),
  },
  planCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RF(14),
    padding: RF(12),
    borderWidth: 1.5,
    borderColor: '#D4EDE3',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  planLabel: {
    fontSize: RF(18),
    fontWeight: '800',
    marginBottom: RFV(4),
  },
  planDesc: {
    fontSize: RF(10),
    fontWeight: '500',
    lineHeight: RF(14),
  },
  planSelectedDot: {
    width: RF(8),
    height: RF(8),
    borderRadius: RF(4),
    position: 'absolute',
    top: RF(10),
    right: RF(10),
  },
  btnWrapper: {
    width: '100%',
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RF(10),
    paddingVertical: RFV(16),
    borderRadius: RF(16),
  },
  mainBtnStart: {
    backgroundColor: '#56AB91',
  },
  mainBtnStop: {
    backgroundColor: '#FF8A80',
  },
  mainBtnText: {
    fontSize: RF(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
