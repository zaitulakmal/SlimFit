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
  Defs, LinearGradient, Stop,
} from 'react-native-svg';
import { useProfileStore } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import { SproutMascot } from '@/components/SproutMascot';
import { cute } from '@/theme/cute';

const { width: W } = Dimensions.get('window');

// ─── Colours (Slimora cute palette) ──────────────────────────────────────────
const BG      = '#FAF4E4';   // soft cream
const LEAF1   = '#7BD7B0';
const LEAF2   = '#9FE3C4';
const LEAF3   = '#C7EFDD';
const SKY     = '#7FC8F8';
const WHITE   = '#FFFFFF';

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
  const user = useAuthStore((s) => s.user);

  const bowlScale   = useSharedValue(0);
  const bowlY       = useSharedValue(60);
  const bowlOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY       = useSharedValue(20);
  const tagOpacity  = useSharedValue(0);
  const bgOpacity   = useSharedValue(1);
  const bgScale     = useSharedValue(1.05);

  const navigate = () => {
    if (!user) {
      router.replace('/auth/login');
    } else if (!profile?.onboardingCompleted) {
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
            <Stop offset="0%"   stopColor="#FFF3D6" />
            <Stop offset="55%"  stopColor="#FAF4E4" />
            <Stop offset="100%" stopColor="#E6F6EE" />
          </LinearGradient>
        </Defs>
        <Path d={`M0,0 L${W},0 L${W},900 L0,900 Z`} fill="url(#splashBg)" />
        {/* Decorative circles */}
        <SvgCircle cx={W * 0.9} cy={80}  r={70}  fill="#FFE09A" opacity={0.35} />
        <SvgCircle cx={W * 0.1} cy={700} r={90}  fill={LEAF1} opacity={0.14} />
        <SvgCircle cx={W * 0.5} cy={820} r={110} fill={SKY} opacity={0.12} />
      </Svg>

      {/* Floating leaves */}
      <FloatingLeaf x={20}      y={120} size={36} delay={300}  color={LEAF1} />
      <FloatingLeaf x={W - 55}  y={150} size={30} delay={500}  color={LEAF2} />
      <FloatingLeaf x={30}      y={400} size={28} delay={700}  color={LEAF3} />
      <FloatingLeaf x={W - 50}  y={420} size={32} delay={200}  color={LEAF1} />
      <FloatingLeaf x={W * 0.4} y={80}  size={24} delay={900}  color={LEAF2} />

      {/* Sprout mascot — same character as the launcher icon */}
      <Animated.View style={[s.bowlWrap, bowlStyle]}>
        <SproutMascot size={220} />
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[s.appName, textStyle]}>
        Slimora
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[s.tagline, tagStyle]}>
        Eat fresh, feel great
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
    color: cute.ink,
    letterSpacing: 1,
    textShadowColor: 'rgba(91,214,180,0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: cute.inkSoft,
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
    backgroundColor: '#CDEFE3',
  },
  dotActive: {
    backgroundColor: cute.mintDeep,
    width: 24,
    borderRadius: 4,
  },
});
