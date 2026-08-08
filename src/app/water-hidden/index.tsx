import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedProps, useSharedValue,
  withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Rect, ClipPath, Defs, G, Circle as SvgCircle, Stop, RadialGradient, LinearGradient } from 'react-native-svg';
import { Minus, Plus, Drop, CheckCircle, Target, DropHalf } from 'phosphor-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cute, cuteShadow, radius, withAlpha, cardTints, cardBorder } from '@/theme/cute';
import { useWaterStore } from '../../stores/waterStore';
import BottomNav from '../../components/BottomNav';

const { width: W } = Dimensions.get('window');
const SKY = cute.sky;
const MINT = cute.mint;

const STEP_ML = 250;
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function WaterBottleLarge({ progress }: { progress: number }) {
  const GW = 200, GH = 320;
  const fillAnim = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withTiming(Math.min(progress, 1), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  // Body: x=60..140, y=90..290
  const bodyX = 60, bodyW = 80, bodyY = 90, bodyH = 200;
  const maxFill = bodyH - 4;

  const fillProps = useAnimatedProps(() => ({
    y: bodyY + 2 + (maxFill - fillAnim.value * maxFill),
    height: fillAnim.value * maxFill,
  }));

  const isGoalMet = progress >= 1;
  const fillColor = isGoalMet ? MINT : SKY;

  const bottlePath = `
    M 90,10 L 110,10
    L 110,20 Q 118,22 120,32
    L 120,50 Q 140,62 140,90
    L 140,282 Q 140,292 130,292
    L 70,292 Q 60,292 60,282
    L 60,90 Q 60,62 80,50
    L 80,32 Q 82,22 90,20 Z
  `;
  const clipPath = `
    M 80,50 Q 60,62 60,90
    L 60,282 Q 60,292 70,292
    L 130,292 Q 140,292 140,282
    L 140,90 Q 140,62 120,50 Z
  `;

  return (
    <Svg width={GW} height={GH} viewBox={`0 0 ${GW} ${GH}`}>
      <Defs>
        <ClipPath id="bottleClipLarge">
          <Path d={clipPath} />
        </ClipPath>
        <LinearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={withAlpha(fillColor, 0.95)} />
          <Stop offset="100%" stopColor={withAlpha(fillColor, 0.7)} />
        </LinearGradient>
      </Defs>

      <Path d={bottlePath} fill={withAlpha(fillColor, 0.12)} stroke={fillColor} strokeWidth={3} strokeLinejoin="round" />

      <G clipPath="url(#bottleClipLarge)">
        <AnimatedRect
          x={60} width={80}
          fill="url(#waterGrad)"
          opacity={0.85}
          animatedProps={fillProps}
        />
        <Rect x={68} y={95} width={10} height={160} rx={5} fill="rgba(255,255,255,0.45)" />
        <Rect x={82} y={95} width={5} height={110} rx={3} fill="rgba(255,255,255,0.25)" />
      </G>

      <Rect x={88} y={6} width={24} height={16} rx={5} fill={fillColor} />
      <Rect x={92} y={2} width={16} height={8} rx={3} fill={fillColor} opacity={0.7} />
    </Svg>
  );
}

export default function WaterScreen() {
  const insets = useSafeAreaInsets();
  const { today, addWater, removeWater, setGoal, loadToday } = useWaterStore();
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  useFocusEffect(
    useCallback(() => { loadToday(); }, [])
  );

  const totalMl = Number(today?.totalMl) || 0;
  const goalMl = Number(today?.goalMl) || 2000;
  const progress = goalMl > 0 ? totalMl / goalMl : 0;
  const isGoalMet = progress >= 1;

  const glasses = Math.floor(totalMl / 250);
  const goalGlasses = Math.floor(goalMl / 250);

  const handleAdd = (ml: number) => addWater(ml);
  const handleRemove = () => removeWater(250);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <View style={s.headerContent}>
          <Text style={s.title}>Water</Text>
          <TouchableOpacity
            style={s.goalBtn}
            onPress={() => setShowGoalPicker(!showGoalPicker)}
          >
            <Text style={s.goalBtnText}>Goal: {goalMl}ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.glassContainer}>
          <WaterBottleLarge progress={progress} />
          {isGoalMet && (
            <Animated.View entering={FadeInDown} style={s.completeBadge}>
              <CheckCircle size={20} weight="fill" color="#FFFFFF" />
              <Text style={s.completeText}>Goal reached!</Text>
            </Animated.View>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: cardTints.sky, borderColor: withAlpha(cardBorder.sky, 0.5) }]}>
            <View style={s.statIconWell}><Drop size={20} weight="fill" color="#FFFFFF" /></View>
            <Text style={[s.statValue, { color: cute.ink }]}>{totalMl}ml</Text>
            <Text style={s.statLabel}>Consumed</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: cardTints.butter, borderColor: withAlpha(cardBorder.butter, 0.5) }]}>
            <View style={s.statIconWell}><Target size={20} weight="fill" color="#FFFFFF" /></View>
            <Text style={[s.statValue, { color: cute.ink }]}>{goalMl}ml</Text>
            <Text style={s.statLabel}>Goal</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: cardTints.mint, borderColor: withAlpha(cardBorder.mint, 0.5) }]}>
            <View style={s.statIconWell}><DropHalf size={20} weight="fill" color="#FFFFFF" /></View>
            <Text style={[s.statValue, { color: cute.ink }]}>{Math.max(goalMl - totalMl, 0)}ml</Text>
            <Text style={s.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Big cute "add a glass" button */}
        <TouchableOpacity
          style={[s.addGlassBtn, { backgroundColor: cute.action }]}
          onPress={() => handleAdd(STEP_ML)}
          activeOpacity={0.85}
        >
          <Plus size={26} weight="bold" color="#FFFFFF" />
          <Text style={s.addGlassText}>Add a glass (+250ml)</Text>
        </TouchableOpacity>

        {/* Quick add pills */}
        <View style={s.quickAdd}>
          <Text style={[s.sectionTitle, { color: cute.ink }]}>Quick Add</Text>
          <View style={s.quickBtns}>
            {[250, 500, 750].map((ml) => (
              <TouchableOpacity
                key={ml}
                style={[s.quickBtn, { backgroundColor: withAlpha(SKY, 0.14), borderColor: withAlpha(SKY, 0.4) }]}
                onPress={() => handleAdd(ml)}
              >
                <Plus size={16} weight="bold" color={SKY} />
                <Text style={[s.quickBtnText, { color: SKY }]}>+{ml}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom amount */}
        <View style={s.customSection}>
          <Text style={[s.sectionTitle, { color: cute.ink }]}>Adjust</Text>
          <View style={s.customBtns}>
            <TouchableOpacity
              style={[s.customBtn, { borderColor: withAlpha(cute.ink, 0.25) }]}
              onPress={handleRemove}
            >
              <Minus size={20} weight="bold" color={cute.inkSoft} />
              <Text style={[s.customBtnText, { color: cute.ink }]}>-250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.customBtn, { backgroundColor: cute.action, borderColor: cute.action }]}
              onPress={() => handleAdd(250)}
            >
              <Plus size={20} weight="bold" color="#FFFFFF" />
              <Text style={[s.customBtnText, { color: '#FFFFFF' }]}>+250ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Glass progress */}
        <View style={s.glassProgress}>
          <Text style={[s.glassLabel, { color: cute.inkSoft }]}>{glasses} of {goalGlasses} glasses</Text>
          <View style={[s.glassBar, { backgroundColor: withAlpha(SKY, 0.18) }]}>
            <View style={[s.glassFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: SKY }]} />
          </View>
        </View>
      </ScrollView>

      <BottomNav active="water" />
    </View>
  );
}

function RF(v: number) { return Math.round(v); }

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: cute.cream },
  header: {
    // paddingTop comes from the safe-area inset (applied inline).
    position: 'relative',
    paddingBottom: 14,
    paddingHorizontal: 18,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  title: { fontSize: 28, fontWeight: '800', color: cute.ink },
  goalBtn: {
    backgroundColor: withAlpha(cute.water, 0.16),
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goalBtnText: { fontSize: 14, fontWeight: '600', color: cute.water },

  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 100 },

  glassContainer: { alignItems: 'center', marginBottom: 20, paddingVertical: 10 },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: MINT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: -10,
  },
  completeText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  statIconWell: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: cute.action,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', color: cute.inkSoft },

  addGlassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 58,
    borderRadius: 999,
    marginBottom: 24,
    ...cuteShadow.md,
  },
  addGlassText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  quickAdd: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  quickBtns: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  quickBtnText: { fontSize: 15, fontWeight: '700' },

  customSection: { marginBottom: 24 },
  customBtns: { flexDirection: 'row', gap: 12 },
  customBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  customBtnText: { fontSize: 15, fontWeight: '700' },

  glassProgress: { marginBottom: 20 },
  glassLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  glassBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  glassFill: {
    height: '100%',
    borderRadius: 5,
  },
});
