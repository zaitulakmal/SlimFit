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
import { SproutMascot } from '@/components/SproutMascot';
import { colors, spacing } from '../../constants/theme-new';

const { width: W, height: H } = Dimensions.get('window');

const CORAL1 = '#FF8FA3';
const CORAL2 = '#FFB1A8';
const LEAF1 = '#7BD7B0';
const LEAF2 = '#9FE3C4';
const LEAF3 = '#C7EFDD';
const SKY   = '#7FC8F8';
const WHITE = '#FFFFFF';

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
          <SproutMascot size={180} />
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
