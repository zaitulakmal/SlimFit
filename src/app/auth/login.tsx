import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay,
  withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import {
  Eye, EyeSlash, EnvelopeSimple, LockSimple,
} from 'phosphor-react-native';
import { useAuthStore } from '../../stores/authStore';

const { width: W, height: H } = Dimensions.get('window');

const BLUE    = '#208AEF';
const NAVY    = '#1A2B5C';
const RUBY    = '#C41E3A';
const WHITE   = '#FFFFFF';
const BG      = '#F8FAFC';
const TEXT    = '#1E293B';
const MUTED   = '#64748B';
const BORDER  = '#E2E8F0';
const INPUT_BG = '#F1F5F9';

function FloatingOrb({ x, y, r, color, delay }: {
  x: number; y: number; r: number; color: string; delay: number;
}) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(0.18, { duration: 800 }));
    ty.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,   { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
    position: 'absolute',
    left: x - r,
    top: y - r,
  }));

  return (
    <Animated.View style={style}>
      <Svg width={r * 2} height={r * 2}>
        <Circle cx={r} cy={r} r={r} fill={color} />
      </Svg>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, error, clearError } = useAuthStore();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const headerOp = useSharedValue(0);
  const headerY  = useSharedValue(-24);
  const formOp   = useSharedValue(0);
  const formY    = useSharedValue(32);

  useEffect(() => {
    headerOp.value = withTiming(1, { duration: 600 });
    headerY.value  = withSpring(0, { damping: 14, stiffness: 100 });
    formOp.value   = withDelay(260, withTiming(1, { duration: 600 }));
    formY.value    = withDelay(260, withSpring(0, { damping: 16, stiffness: 110 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOp.value,
    transform: [{ translateY: headerY.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOp.value,
    transform: [{ translateY: formY.value }],
  }));

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try { await login(email.trim(), password); } catch {}
    finally { setLoading(false); }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <View style={s.root}>
      {/* Gradient header */}
      <View style={s.header}>
        <Svg style={StyleSheet.absoluteFillObject} width={W} height={H * 0.44}>
          <Defs>
            <LinearGradient id="lgLogin" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={BLUE} />
              <Stop offset="100%" stopColor={NAVY} />
            </LinearGradient>
          </Defs>
          <Path
            d={`M0,0 L${W},0 L${W},${H * 0.37} Q${W * 0.5},${H * 0.47} 0,${H * 0.37} Z`}
            fill="url(#lgLogin)"
          />
        </Svg>

        {/* Decorative orbs */}
        <FloatingOrb x={W * 0.08}  y={H * 0.07} r={52} color={WHITE} delay={0}   />
        <FloatingOrb x={W * 0.88}  y={H * 0.05} r={38} color={WHITE} delay={300} />
        <FloatingOrb x={W * 0.72}  y={H * 0.22} r={24} color={WHITE} delay={500} />
        <FloatingOrb x={W * 0.20}  y={H * 0.28} r={18} color={WHITE} delay={150} />
        <FloatingOrb x={W * 0.50}  y={H * 0.04} r={14} color={WHITE} delay={400} />

        <Animated.View style={[s.brand, headerStyle, { paddingTop: insets.top + 12 }]}>
          <View style={s.logoRing}>
            <Text style={s.logoLetter}>S</Text>
          </View>
          <Text style={s.appName}>Slimora</Text>
          <Text style={s.tagline}>Your health, your journey</Text>
        </Animated.View>
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.card, formStyle]}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Welcome back</Text>
              <Text style={s.cardSub}>Log in to continue your journey</Text>
            </View>

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email field */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Email</Text>
              <View style={s.inputRow}>
                <EnvelopeSimple size={18} color={MUTED} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError(); }}
                  placeholder="you@email.com"
                  placeholderTextColor={MUTED}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password field */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Password</Text>
              <View style={s.inputRow}>
                <LockSimple size={18} color={MUTED} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); }}
                  placeholder="••••••••"
                  placeholderTextColor={MUTED}
                  secureTextEntry={!showPwd}
                />
                <Pressable
                  onPress={() => setShowPwd(v => !v)}
                  hitSlop={10}
                  style={s.eyeBtn}
                >
                  {showPwd
                    ? <EyeSlash size={18} color={MUTED} />
                    : <Eye size={18} color={MUTED} />
                  }
                </Pressable>
              </View>
            </View>

            <Pressable style={s.forgotRow} onPress={() => {}}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                s.btn,
                !canSubmit && s.btnDisabled,
                pressed && canSubmit && s.btnPressed,
              ]}
              onPress={handleLogin}
              disabled={!canSubmit}
            >
              {loading
                ? <ActivityIndicator color={WHITE} />
                : <Text style={s.btnText}>Log In</Text>
              }
            </Pressable>

            <View style={s.footer}>
              <Text style={s.footerText}>Don't have an account? </Text>
              <Pressable onPress={() => router.replace('/auth/register')} hitSlop={8}>
                <Text style={s.footerLink}>Sign Up</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },

  header: {
    height: H * 0.44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  brand: {
    alignItems: 'center',
    paddingBottom: 28,
  },
  logoRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: '800',
    color: WHITE,
    lineHeight: 38,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
  },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20 },

  card: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 6,
  },
  cardHeader: { gap: 4 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: TEXT },
  cardSub:   { fontSize: 14, color: MUTED },

  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 },
  errorText: { color: '#DC2626', fontSize: 14, lineHeight: 20 },

  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: TEXT },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    gap: 10,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  forgotRow: { alignSelf: 'flex-end', paddingVertical: 2 },
  forgotText: { fontSize: 13, fontWeight: '600', color: BLUE },

  btn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  btnPressed:  { opacity: 0.88 },
  btnText: { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },

  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  footerText: { fontSize: 14, color: MUTED },
  footerLink: { fontSize: 14, color: RUBY, fontWeight: '700' },
});
