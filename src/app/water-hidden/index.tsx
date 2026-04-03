import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedProps, useSharedValue,
  withSpring, withTiming, Easing,
  useAnimatedStyle, interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Rect, ClipPath, Defs, G, Circle as SvgCircle, Stop, RadialGradient } from 'react-native-svg';
import { Minus, Plus, Drop, CheckCircle, X } from 'phosphor-react-native';

import { pastelColors } from '../../constants/pastel-theme';
import { useWaterStore } from '../../stores/waterStore';
import BottomNav from '../../components/BottomNav';

const { width: W } = Dimensions.get('window');
const C = pastelColors;

const STEP_ML = 250;
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function HeaderDecoration() {
  return (
    <Svg width={W} height={200} style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} 200`}>
      <Defs>
        <RadialGradient id="waterHeaderGrad" cx="50%" cy="0%" r="100%">
          <Stop offset="0%" stopColor={C.headerTop} />
          <Stop offset="100%" stopColor={C.headerBottom} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={200} fill="url(#waterHeaderGrad)" />
      
      {/* Water drops decoration */}
      <SvgCircle cx={W * 0.15} cy={50} r={20} fill={C.white} opacity={0.2} />
      <SvgCircle cx={W * 0.8} cy={30} r={15} fill={C.white} opacity={0.15} />
      <SvgCircle cx={W * 0.5} cy={180} r={30} fill={C.white} opacity={0.1} />
      
      {/* Wavy bottom */}
      <Path d={`M0,175 Q${W * 0.3},200 ${W * 0.5},185 Q${W * 0.7},170 ${W},190 L${W},200 L0,200 Z`} fill={C.background} />
    </Svg>
  );
}

function WaterGlass({ progress }: { progress: number }) {
  const GW = 260, GH = 300;
  const fillAnim = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withTiming(Math.min(progress, 1), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const maxFill = 230;
  const fillProps = useAnimatedProps(() => ({
    y: 28 + (maxFill - fillAnim.value * maxFill),
    height: fillAnim.value * maxFill,
  }));

  const isGoalMet = progress >= 1;
  const fillColor = isGoalMet ? C.primary : C.blue;

  return (
    <Svg width={GW} height={GH} viewBox={`0 0 ${GW} ${GH}`}>
      <Defs>
        <ClipPath id="glassClip2">
          <Path d="M32,26 L228,26 L210,274 Q210,284 198,284 L102,284 Q90,284 90,274 Z" />
        </ClipPath>
      </Defs>

      {/* Glass body background */}
      <Path
        d="M32,26 L228,26 L210,274 Q210,284 198,284 L102,284 Q90,284 90,274 Z"
        fill={`${fillColor}15`}
        stroke={fillColor}
        strokeWidth={3}
      />

      {/* Water fill */}
      <G clipPath="url(#glassClip2)">
        <AnimatedRect
          x={32} width={196}
          fill={fillColor}
          opacity={0.7}
          animatedProps={fillProps}
        />
        {/* Shine */}
        <Rect x={50} y={40} width={12} height={140} rx={6} fill="rgba(255,255,255,0.4)" />
        <Rect x={70} y={40} width={6} height={100} rx={3} fill="rgba(255,255,255,0.2)" />
      </G>

      {/* Rim highlight */}
      <Path
        d="M32,26 L228,26"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function WaterScreen() {
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
      <View style={s.header}>
        <HeaderDecoration />
        
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
        {/* Main glass */}
        <View style={s.glassContainer}>
          <WaterGlass progress={progress} />
          
          {isGoalMet && (
            <Animated.View entering={FadeInDown} style={s.completeBadge}>
              <CheckCircle size={20} weight="fill" color={C.white} />
              <Text style={s.completeText}>Goal reached!</Text>
            </Animated.View>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: C.cardBlue }]}>
            <Drop size={24} weight="fill" color={C.blue} />
            <Text style={s.statValue}>{totalMl}ml</Text>
            <Text style={s.statLabel}>Consumed</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.cardMint }]}>
            <Text style={s.statEmoji}>🎯</Text>
            <Text style={s.statValue}>{goalMl}ml</Text>
            <Text style={s.statLabel}>Goal</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.cardYellow }]}>
            <Text style={s.statEmoji}>💧</Text>
            <Text style={s.statValue}>{Math.max(goalMl - totalMl, 0)}ml</Text>
            <Text style={s.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Quick add buttons */}
        <View style={s.quickAdd}>
          <Text style={s.sectionTitle}>Quick Add</Text>
          <View style={s.quickBtns}>
            {[250, 500, 750].map((ml) => (
              <TouchableOpacity
                key={ml}
                style={[s.quickBtn, { backgroundColor: C.cardBlue }]}
                onPress={() => handleAdd(ml)}
              >
                <Plus size={18} weight="bold" color={C.blue} />
                <Text style={[s.quickBtnText, { color: C.blue }]}>+{ml}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom amount */}
        <View style={s.customSection}>
          <Text style={s.sectionTitle}>Custom Amount</Text>
          <View style={s.customBtns}>
            <TouchableOpacity
              style={[s.customBtn, { borderColor: C.border }]}
              onPress={handleRemove}
            >
              <Minus size={20} weight="bold" color={C.coral} />
              <Text style={s.customBtnText}>250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.customBtn, { backgroundColor: C.primary, borderColor: C.primary }]}
              onPress={() => handleAdd(250)}
            >
              <Plus size={20} weight="bold" color={C.white} />
              <Text style={[s.customBtnText, { color: C.white }]}>250ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Glass progress */}
        <View style={s.glassProgress}>
          <Text style={s.glassLabel}>{glasses} of {goalGlasses} glasses</Text>
          <View style={s.glassBar}>
            <View style={[s.glassFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
        </View>
      </ScrollView>

      <BottomNav active="water" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    position: 'relative',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  title: { fontSize: 28, fontWeight: '800', color: C.white },
  goalBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goalBtnText: { fontSize: 14, fontWeight: '600', color: C.white },
  
  content: { padding: 20, paddingBottom: 100 },
  
  glassContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: -10,
  },
  completeText: { fontSize: 14, fontWeight: '700', color: C.white },
  
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  statLabel: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
  statEmoji: { fontSize: 20 },
  
  quickAdd: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  quickBtns: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
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
    borderRadius: 12,
    borderWidth: 2,
  },
  customBtnText: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  
  glassProgress: { marginBottom: 20 },
  glassLabel: { fontSize: 14, fontWeight: '600', color: C.textSecondary, textAlign: 'center', marginBottom: 8 },
  glassBar: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  glassFill: {
    height: '100%',
    backgroundColor: C.blue,
    borderRadius: 4,
  },
});
