import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay,
  withSequence, withRepeat, Easing,
} from 'react-native-reanimated';
import Svg, {
  Ellipse, Path, Circle as SvgCircle,
  Defs, LinearGradient, Stop,
} from 'react-native-svg';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing } from '../../constants/theme-new';

const { width: W, height: H } = Dimensions.get('window');

const CORAL1 = '#FF8FA3';
const CORAL2 = '#FFB1A8';
const BOWL_DARK  = '#F0C97A';
const BOWL_LIGHT = '#FFE3A3';
const TOMATO  = '#FF6B8A';
const TOMATO2 = '#FFB1A8';
const LEAF1 = '#7BD7B0';
const LEAF2 = '#9FE3C4';
const LEAF3 = '#C7EFDD';
const SKY   = '#7FC8F8';
const WHITE = '#FFFFFF';

function SaladBowl() {
  return (
    <Svg width={180} height={180} viewBox="0 0 220 220">
      <Defs>
        <LinearGradient id="bowlGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={BOWL_LIGHT} />
          <Stop offset="100%" stopColor={BOWL_DARK} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={110} cy={195} rx={75} ry={10} fill="rgba(0,0,0,0.10)" />
      <Path d="M 35,110 Q 35,185 110,185 Q 185,185 185,110 Z" fill="url(#bowlGrad2)" />
      <Ellipse cx={110} cy={110} rx={75} ry={18} fill={BOWL_LIGHT} />
      <Ellipse cx={110} cy={110} rx={68} ry={14} fill={BOWL_DARK} opacity={0.3} />
      <Ellipse cx={80}  cy={95}  rx={28} ry={18} fill={LEAF1} transform="rotate(-25,80,95)" />
      <Ellipse cx={140} cy={93}  rx={28} ry={18} fill={LEAF2} transform="rotate(20,140,93)" />
      <Ellipse cx={110} cy={88}  rx={30} ry={16} fill={LEAF3} />
      <Ellipse cx={68}  cy={105} rx={22} ry={13} fill={LEAF2} transform="rotate(-30,68,105)" />
      <Ellipse cx={152} cy={103} rx={22} ry={13} fill={LEAF1} transform="rotate(30,152,103)" />
      <Ellipse cx={110} cy={100} rx={24} ry={12} fill={LEAF2} />
      <SvgCircle cx={88}  cy={112} r={12} fill={TOMATO} />
      <SvgCircle cx={88}  cy={112} r={7}  fill={TOMATO2} opacity={0.5} />
      <SvgCircle cx={132} cy={115} r={11} fill={TOMATO} />
      <SvgCircle cx={132} cy={115} r={6}  fill={TOMATO2} opacity={0.5} />
      <Path d="M88,100 Q91,95 88,92" stroke={LEAF1} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M132,104 Q135,99 132,96" stroke={LEAF1} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Ellipse cx={110} cy={118} rx={26} ry={13} fill={LEAF1} />
      <Ellipse cx={90}  cy={122} rx={18} ry={10} fill={LEAF3} transform="rotate(-15,90,122)" />
      <Ellipse cx={130} cy={120} rx={18} ry={10} fill={LEAF2} transform="rotate(15,130,120)" />
      <Path d="M170,60 L170,130" stroke={BOWL_DARK} strokeWidth={5} strokeLinecap="round" />
      <Path d="M163,60 L163,80 M170,60 L170,80 M177,60 L177,80" stroke={BOWL_DARK} strokeWidth={3} strokeLinecap="round" />
      <Path d="M163,80 Q170,88 177,80" stroke={BOWL_DARK} strokeWidth={3} fill="none" />
    </Svg>
  );
}

function FloatingLeaf({ x, y, size, delay, color }: {
  x: number; y: number; size: number; delay: number; color: string;
}) {
  const ty  = useSharedValue(0);
  const rot = useSharedValue(0);
  const op  = useSharedValue(0);

  useEffect(() => {
    op.value  = withDelay(delay, withTiming(0.6, { duration: 600 }));
    ty.value  = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-10, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,   { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    ));
    rot.value = withDelay(delay, withRepeat(
      withSequence(withTiming(12, { duration: 1400 }), withTiming(-12, { duration: 1400 })),
      -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
    opacity: op.value,
    position: 'absolute', left: x, top: y,
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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Entrance animations
  const bowlY   = useSharedValue(-40);
  const bowlOp  = useSharedValue(0);
  const formY   = useSharedValue(40);
  const formOp  = useSharedValue(0);

  useEffect(() => {
    bowlOp.value = withTiming(1, { duration: 500 });
    bowlY.value  = withSpring(0, { damping: 12, stiffness: 90 });
    formOp.value = withDelay(300, withTiming(1, { duration: 500 }));
    formY.value  = withDelay(300, withSpring(0, { damping: 14, stiffness: 100 }));
  }, []);

  const bowlStyle = useAnimatedStyle(() => ({
    opacity: bowlOp.value,
    transform: [{ translateY: bowlY.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOp.value,
    transform: [{ translateY: formY.value }],
  }));

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Green header background */}
      <View style={s.headerBg}>
        <Svg style={StyleSheet.absoluteFillObject} width={W} height={H * 0.45}>
          <Defs>
            <LinearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={CORAL1} />
              <Stop offset="100%" stopColor={CORAL2} />
            </LinearGradient>
          </Defs>
          <Path
            d={`M0,0 L${W},0 L${W},${H * 0.38} Q${W * 0.5},${H * 0.48} 0,${H * 0.38} Z`}
            fill="url(#headerGrad)"
          />
        </Svg>

        {/* Floating leaves */}
        <FloatingLeaf x={20}     y={40}  size={32} delay={200} color={LEAF3} />
        <FloatingLeaf x={W-60}   y={30}  size={28} delay={400} color={LEAF1} />
        <FloatingLeaf x={W-40}   y={100} size={22} delay={600} color={LEAF2} />
        <FloatingLeaf x={30}     y={120} size={26} delay={300} color={LEAF2} />

        {/* Salad bowl + title */}
        <Animated.View style={[s.bowlContainer, bowlStyle]}>
          <SaladBowl />
          <Text style={s.appName}>Slimora</Text>
          <Text style={s.tagline}>Your health, your journey</Text>
        </Animated.View>
      </View>

      {/* Form card */}
      <KeyboardAvoidingView
        style={s.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.card, formStyle]}>
            <Text style={s.cardTitle}>Welcome back</Text>

            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                placeholder="you@email.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[s.btn, (!email || !password || loading) && s.btnDisabled]}
              onPress={handleLogin}
              disabled={!email || !password || loading}
            >
              {loading
                ? <ActivityIndicator color={WHITE} />
                : <Text style={s.btnText}>Log In</Text>
              }
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/auth/register')}>
                <Text style={s.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF4E4' },

  // Header
  headerBg: {
    height: H * 0.45,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bowlContainer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: -0.5,
    marginTop: -spacing.sm,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },

  // Form
  formWrapper: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  errorBox: {
    backgroundColor: '#FFE8EE',
    borderRadius: 10,
    padding: spacing.md,
  },
  errorText: { color: '#FF6B6B', fontSize: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  btn: {
    backgroundColor: CORAL1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '700', color: WHITE },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerLink: { fontSize: 14, color: CORAL1, fontWeight: '700' },
});
