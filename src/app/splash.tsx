import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay,
  withSequence, withRepeat, Easing, runOnJS,
} from 'react-native-reanimated';
import Svg, {
  Ellipse, Path, Circle as SvgCircle,
  Defs, LinearGradient, Stop, G,
} from 'react-native-svg';
import { useProfileStore } from '../stores/profileStore';

const { width: W } = Dimensions.get('window');

// ─── Colours ────────────────────────────────────────────────────────────────
const BG      = '#F6FFF0';   // very light green
const GREEN1  = '#56AB2F';
const GREEN2  = '#A8E063';
const BOWL_DARK  = '#D4A96A';
const BOWL_LIGHT = '#F0C97A';
const TOMATO  = '#E53935';
const TOMATO2 = '#EF9A9A';
const LEAF1   = '#43A047';
const LEAF2   = '#66BB6A';
const LEAF3   = '#A5D6A7';
const PURPLE  = '#7B1FA2';
const WHITE   = '#FFFFFF';

// ─── Static salad SVG ───────────────────────────────────────────────────────
function SaladBowl() {
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Defs>
        <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={GREEN1} />
          <Stop offset="100%" stopColor={GREEN2} />
        </LinearGradient>
        <LinearGradient id="bowlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={BOWL_LIGHT} />
          <Stop offset="100%" stopColor={BOWL_DARK} />
        </LinearGradient>
      </Defs>

      {/* Bowl shadow */}
      <Ellipse cx={110} cy={195} rx={75} ry={10} fill="rgba(0,0,0,0.10)" />

      {/* Bowl body */}
      <Path
        d="M 35,110 Q 35,185 110,185 Q 185,185 185,110 Z"
        fill="url(#bowlGrad)"
      />
      {/* Bowl rim */}
      <Ellipse cx={110} cy={110} rx={75} ry={18} fill={BOWL_LIGHT} />
      <Ellipse cx={110} cy={110} rx={68} ry={14} fill={BOWL_DARK} opacity={0.3} />

      {/* ── Salad leaves ─────────────────────────────────── */}
      {/* Back large leaves */}
      <Ellipse cx={80}  cy={95}  rx={28} ry={18} fill={LEAF1} transform="rotate(-25,80,95)" />
      <Ellipse cx={140} cy={93}  rx={28} ry={18} fill={LEAF2} transform="rotate(20,140,93)" />
      <Ellipse cx={110} cy={88}  rx={30} ry={16} fill={LEAF3} />

      {/* Mid leaves */}
      <Ellipse cx={68}  cy={105} rx={22} ry={13} fill={LEAF2} transform="rotate(-30,68,105)" />
      <Ellipse cx={152} cy={103} rx={22} ry={13} fill={LEAF1} transform="rotate(30,152,103)" />
      <Ellipse cx={110} cy={100} rx={24} ry={12} fill={LEAF2} />

      {/* Tomatoes */}
      <SvgCircle cx={88}  cy={112} r={12} fill={TOMATO} />
      <SvgCircle cx={88}  cy={112} r={7}  fill={TOMATO2} opacity={0.5} />
      <SvgCircle cx={132} cy={115} r={11} fill={TOMATO} />
      <SvgCircle cx={132} cy={115} r={6}  fill={TOMATO2} opacity={0.5} />
      {/* Tomato stems */}
      <Path d="M88,100 Q91,95 88,92" stroke={LEAF1} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M132,104 Q135,99 132,96" stroke={LEAF1} strokeWidth={2} fill="none" strokeLinecap="round" />

      {/* Front leaves */}
      <Ellipse cx={110} cy={118} rx={26} ry={13} fill={LEAF1} />
      <Ellipse cx={90}  cy={122} rx={18} ry={10} fill={LEAF3} transform="rotate(-15,90,122)" />
      <Ellipse cx={130} cy={120} rx={18} ry={10} fill={LEAF2} transform="rotate(15,130,120)" />

      {/* Fork */}
      <Path
        d="M170,60 L170,130"
        stroke={BOWL_DARK} strokeWidth={5} strokeLinecap="round"
      />
      <Path d="M163,60 L163,80 M170,60 L170,80 M177,60 L177,80"
        stroke={BOWL_DARK} strokeWidth={3} strokeLinecap="round"
      />
      <Path d="M163,80 Q170,88 177,80"
        stroke={BOWL_DARK} strokeWidth={3} fill="none"
      />
    </Svg>
  );
}

// ─── Floating leaf ──────────────────────────────────────────────────────────
function FloatingLeaf({ x, y, size, delay, color }: {
  x: number; y: number; size: number; delay: number; color: string;
}) {
  const ty   = useSharedValue(0);
  const rot  = useSharedValue(0);
  const op   = useSharedValue(0);

  useEffect(() => {
    op.value  = withDelay(delay, withTiming(0.7, { duration: 600 }));
    ty.value  = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-12, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,   { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    ));
    rot.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(15,  { duration: 1200 }),
        withTiming(-15, { duration: 1200 }),
      ), -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
    opacity: op.value,
    position: 'absolute',
    left: x,
    top: y,
  }));

  return (
    <Animated.View style={style}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Ellipse cx={20} cy={20} rx={18} ry={10} fill={color} />
        <Path d="M20,10 L20,30" stroke={WHITE} strokeWidth={1.5} opacity={0.4} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// ─── Main splash ─────────────────────────────────────────────────────────────
export default function SplashScreen() {
  const profile = useProfileStore((s) => s.profile);

  const bowlScale   = useSharedValue(0);
  const bowlY       = useSharedValue(60);
  const bowlOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY       = useSharedValue(20);
  const tagOpacity  = useSharedValue(0);
  const bgOpacity   = useSharedValue(1);
  const bgScale     = useSharedValue(1.05);

  const navigate = () => {
    if (!profile?.onboardingCompleted) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  };

  useEffect(() => {
    // Background zoom-in
    bgScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });

    // Bowl drops in with spring
    bowlOpacity.value = withTiming(1, { duration: 400 });
    bowlY.value       = withSpring(0, { damping: 10, stiffness: 80 });
    bowlScale.value   = withSpring(1, { damping: 12, stiffness: 100 });

    // Text slides up
    textOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    textY.value       = withDelay(500, withSpring(0, { damping: 14, stiffness: 120 }));

    // Tagline
    tagOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

    // Fade out → navigate
    bgOpacity.value = withDelay(
      2600,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) },
        (finished) => { if (finished) runOnJS(navigate)(); }
      )
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    transform: [{ scale: bgScale.value }],
  }));

  const bowlStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bowlY.value },
      { scale: bowlScale.value },
    ],
    opacity: bowlOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
  }));

  return (
    <Animated.View style={[s.root, bgStyle]}>
      {/* Background gradient */}
      <Svg width={W} height="100%" style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} 900`}>
        <Defs>
          <LinearGradient id="splashBg" x1="0%" y1="0%" x2="30%" y2="100%">
            <Stop offset="0%"   stopColor="#E8F5E9" />
            <Stop offset="60%"  stopColor="#F6FFF0" />
            <Stop offset="100%" stopColor="#DCEDC8" />
          </LinearGradient>
        </Defs>
        <Path d={`M0,0 L${W},0 L${W},900 L0,900 Z`} fill="url(#splashBg)" />
        {/* Decorative circles */}
        <SvgCircle cx={W * 0.9} cy={80}  r={70}  fill={GREEN2} opacity={0.18} />
        <SvgCircle cx={W * 0.1} cy={700} r={90}  fill={GREEN1} opacity={0.12} />
        <SvgCircle cx={W * 0.5} cy={820} r={110} fill={GREEN2} opacity={0.10} />
      </Svg>

      {/* Floating leaves */}
      <FloatingLeaf x={20}      y={120} size={36} delay={300}  color={LEAF1} />
      <FloatingLeaf x={W - 55}  y={150} size={30} delay={500}  color={LEAF2} />
      <FloatingLeaf x={30}      y={400} size={28} delay={700}  color={LEAF3} />
      <FloatingLeaf x={W - 50}  y={420} size={32} delay={200}  color={LEAF1} />
      <FloatingLeaf x={W * 0.4} y={80}  size={24} delay={900}  color={LEAF2} />

      {/* Salad bowl */}
      <Animated.View style={[s.bowlWrap, bowlStyle]}>
        <SaladBowl />
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[s.appName, textStyle]}>
        Slimora
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[s.tagline, tagStyle]}>
        Eat fresh, feel great 🥗
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[s.dots, tagStyle]}>
        <View style={[s.dot, s.dotActive]} />
        <View style={s.dot} />
        <View style={s.dot} />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bowlWrap: {
    marginBottom: 8,
  },
  appName: {
    fontSize: 44,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 1,
    textShadowColor: 'rgba(86,171,47,0.2)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: '#558B2F',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  dots: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C5E1A5',
  },
  dotActive: {
    backgroundColor: GREEN1,
    width: 24,
    borderRadius: 4,
  },
});
