import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedProps, useSharedValue,
  withSpring, withTiming, Easing,
  useAnimatedStyle, interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Rect, ClipPath, Defs, G, Ellipse } from 'react-native-svg';
import { Minus, Plus, Drop, CheckCircle, X } from 'phosphor-react-native';

import { colors, spacing, radius, shadow, typography } from '../../constants/theme-new';
import { useWaterStore } from '../../stores/waterStore';
import BottomNav from '../../components/BottomNav';

const STEP_ML = 250;
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ── Animated glass ────────────────────────────────────────────────────────────
function WaterGlass({ progress }: { progress: number }) {
  const GW = 300, GH = 340;
  const fillAnim = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withTiming(Math.min(progress, 1), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const maxFill = 260;
  const fillProps = useAnimatedProps(() => ({
    y: 30 + (maxFill - fillAnim.value * maxFill),
    height: fillAnim.value * maxFill,
  }));

  const isGoalMet = progress >= 1;
  const fillColor = isGoalMet ? colors.primary : colors.secondary;

  return (
    <Svg width={GW} height={GH} viewBox="0 0 300 340">
      <Defs>
        <ClipPath id="glassClip">
          <Path d="M36,28 L264,28 L240,302 Q240,314 228,314 L72,314 Q60,314 60,302 Z" />
        </ClipPath>
      </Defs>

      {/* Glass body background */}
      <Path
        d="M36,28 L264,28 L240,302 Q240,314 228,314 L72,314 Q60,314 60,302 Z"
        fill={`${fillColor}10`}
        stroke="#C8D0DA"
        strokeWidth={4}
      />

      {/* Water fill */}
      <G clipPath="url(#glassClip)">
        <AnimatedRect
          x={36} width={228}
          fill={fillColor}
          opacity={0.75}
          animatedProps={fillProps}
        />
        {/* Shine */}
        <Rect x={56} y={40} width={16} height={160} rx={8} fill="rgba(255,255,255,0.35)" />
        <Rect x={80} y={40} width={8} height={110} rx={4} fill="rgba(255,255,255,0.18)" />
      </G>

      {/* Rim highlight */}
      <Path
        d="M36,28 L264,28"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function WaterScreen() {
  const { today, addWater, removeWater } = useWaterStore();
  useFocusEffect(
    useCallback(() => {
      useWaterStore.getState().loadToday();
    }, [])
  );

  const totalMl  = today?.totalMl ?? 0;
  const goalMl   = today?.goalMl  ?? 2000;
  const progress = Math.min(totalMl / goalMl, 1);
  const isGoalMet = progress >= 1;
  const fillColor = isGoalMet ? colors.primary : colors.secondary;

  const displayMl = (ml: number) =>
    ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;

  const handleAdd = async (ml: number) => {
    await addWater(ml);
  };

  const handleRemove = async () => {
    if (totalMl <= 0) return;
    await removeWater(STEP_ML);
  };

  // Press scale for +/- buttons
  const minusScale = useSharedValue(1);
  const plusScale  = useSharedValue(1);
  const minusStyle = useAnimatedStyle(() => ({ transform: [{ scale: minusScale.value }] }));
  const plusStyle  = useAnimatedStyle(() => ({ transform: [{ scale: plusScale.value }] }));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={s.header}>
          <Drop size={24} weight="fill" color="#1CB0F6" />
          <Text style={s.title}>Hydration</Text>
        </Animated.View>

        {/* Glass + controls */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.glassCard}>
          {/* ml display */}
          <Text style={[s.mlValue, { color: fillColor }]}>{displayMl(totalMl)}</Text>
          <Text style={s.goalText}>of {displayMl(goalMl)} goal</Text>

          {/* Glass */}
          <View style={s.glassWrap}>
            <WaterGlass progress={progress} />
          </View>

          {/* Goal met badge */}
          {isGoalMet && (
            <Animated.View entering={FadeInDown.springify()} style={s.goalBadge}>
              <CheckCircle size={18} weight="fill" color={colors.primary} />
              <Text style={s.goalBadgeText}>Daily goal achieved! 🎉</Text>
            </Animated.View>
          )}

          {/* − step + controls */}
          <View style={s.controlRow}>
            <Animated.View style={minusStyle}>
              <TouchableOpacity
                style={[s.roundBtn, { opacity: totalMl <= 0 ? 0.35 : 1 }]}
                onPress={handleRemove}
                onPressIn={() => { minusScale.value = withSpring(0.88, { damping: 12, stiffness: 300 }); }}
                onPressOut={() => { minusScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
                disabled={totalMl <= 0}
                activeOpacity={1}
              >
                <Minus size={22} weight="bold" color={colors.textSecondary} />
              </TouchableOpacity>
            </Animated.View>

            <Text style={s.stepLabel}>−{displayMl(STEP_ML)}</Text>

            <Animated.View style={plusStyle}>
              <TouchableOpacity
                style={[s.roundBtn, s.roundBtnPrimary, { backgroundColor: fillColor }]}
                onPress={() => handleAdd(STEP_ML)}
                onPressIn={() => { plusScale.value = withSpring(0.88, { damping: 12, stiffness: 300 }); }}
                onPressOut={() => { plusScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
                activeOpacity={1}
              >
                <Plus size={22} weight="bold" color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: '#1CB0F6' }]}>
              {Math.floor(totalMl / 250)}
            </Text>
            <Text style={s.statLabel}>glasses</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: '#00BCD4' }]}>
              {Math.floor(goalMl / 250)}
            </Text>
            <Text style={s.statLabel}>goal</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: '#FF9800' }]}>
              {displayMl(Math.max(goalMl - totalMl, 0))}
            </Text>
            <Text style={s.statLabel}>to go</Text>
          </View>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#E8F4FD' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  title: { ...typography.heading, color: '#1565C0' },

  glassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#B3E5FC',
    ...shadow.md,
  },
  mlValue:  { fontSize: 36, fontWeight: '800', letterSpacing: -0.5, color: '#1CB0F6' },
  goalText: { ...typography.bodySm, color: '#64B5F6', marginBottom: spacing.md },
  glassWrap: { marginVertical: spacing.sm },

  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E0F7FA',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: '#00BCD4',
  },
  goalBadgeText: { ...typography.bodySm, fontWeight: '700', color: '#00897B' },

  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  roundBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#90CAF9',
    ...shadow.sm,
  },
  roundBtnPrimary: {},
  stepLabel: {
    ...typography.bodySm,
    color: '#42A5F5',
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },

  sectionTitle: {
    ...typography.title,
    color: '#1565C0',
    marginBottom: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: '#90CAF9',
    ...shadow.sm,
  },
  quickChipText: { ...typography.label, color: '#1CB0F6', fontWeight: '700' },

  customSection: { marginBottom: spacing.md },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  customInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  customAddBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  customAddText:    { ...typography.label, color: '#fff', fontWeight: '700' },
  customCancel:     { padding: spacing.xs },
  customCancelText: { ...typography.label, color: colors.textSecondary },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  customToggleText: { ...typography.bodySm, color: colors.secondary, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#B3E5FC',
    ...shadow.sm,
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { fontSize: 20, fontWeight: '800' },
  statLabel:   { ...typography.caption, color: '#64B5F6' },
  statDivider: { width: 1, backgroundColor: '#B3E5FC' },
});
