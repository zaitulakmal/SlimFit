import { useState, useEffect, useRef } from 'react';
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
  Eye, EyeSlash, EnvelopeSimple, LockSimple, User,
} from 'phosphor-react-native';
import { useAuthStore } from '../../stores/authStore';

const { width: W, height: H } = Dimensions.get('window');

const BLUE     = '#208AEF';
const NAVY     = '#1A2B5C';
const RUBY     = '#C41E3A';
const WHITE    = '#FFFFFF';
const BG       = '#F8FAFC';
const TEXT     = '#1E293B';
const MUTED    = '#64748B';
const BORDER   = '#E2E8F0';
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
        withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,   { duration: 2400, easing: Easing.inOut(Easing.sin) }),
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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, error, clearError } = useAuthStore();

  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPwd, setConfirmPwd]     = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [localError, setLocalError]     = useState('');

  const emailRef   = useRef<TextInput>(null);
  const pwdRef     = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const headerOp = useSharedValue(0);
  const headerY  = useSharedValue(-20);
  const formOp   = useSharedValue(0);
  const formY    = useSharedValue(32);

  useEffect(() => {
    headerOp.value = withTiming(1, { duration: 600 });
    headerY.value  = withSpring(0, { damping: 14, stiffness: 100 });
    formOp.value   = withDelay(240, withTiming(1, { duration: 600 }));
    formY.value    = withDelay(240, withSpring(0, { damping: 16, stiffness: 110 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOp.value,
    transform: [{ translateY: headerY.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOp.value,
    transform: [{ translateY: formY.value }],
  }));

  const handleRegister = async () => {
    setLocalError('');
    if (!name.trim() || !email.trim() || !password) return;
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPwd) {
      setLocalError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try { await register(name.trim(), email.trim(), password); } catch {}
    finally { setLoading(false); }
  };

  const displayError = localError || error;
  const canSubmit = name.trim() && email.trim() && password && confirmPwd && !loading;

  return (
    <View style={s.root}>
      {/* Gradient header — shorter on register to leave room for 4 fields */}
      <View style={s.header}>
        <Svg style={StyleSheet.absoluteFillObject} width={W} height={H * 0.30}>
          <Defs>
            <LinearGradient id="lgRegister" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={BLUE} />
              <Stop offset="100%" stopColor={NAVY} />
            </LinearGradient>
          </Defs>
          <Path
            d={`M0,0 L${W},0 L${W},${H * 0.24} Q${W * 0.5},${H * 0.33} 0,${H * 0.24} Z`}
            fill="url(#lgRegister)"
          />
        </Svg>

        <FloatingOrb x={W * 0.08}  y={H * 0.06} r={44} color={WHITE} delay={0}   />
        <FloatingOrb x={W * 0.88}  y={H * 0.04} r={32} color={WHITE} delay={250} />
        <FloatingOrb x={W * 0.70}  y={H * 0.18} r={20} color={WHITE} delay={450} />
        <FloatingOrb x={W * 0.22}  y={H * 0.22} r={14} color={WHITE} delay={150} />

        <Animated.View style={[s.brand, headerStyle, { paddingTop: insets.top + 10 }]}>
          <Text style={s.appName}>Slimora</Text>
          <Text style={s.tagline}>Start your journey today</Text>
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
              <Text style={s.cardTitle}>Create Account</Text>
              <Text style={s.cardSub}>Fill in the details below to get started</Text>
            </View>

            {displayError ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Full Name</Text>
              <View style={s.inputRow}>
                <User size={18} color={MUTED} />
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={(t) => { setName(t); clearError(); setLocalError(''); }}
                  placeholder="Your name"
                  placeholderTextColor={MUTED}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Email</Text>
              <View style={s.inputRow}>
                <EnvelopeSimple size={18} color={MUTED} />
                <TextInput
                  ref={emailRef}
                  style={s.input}
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError(); setLocalError(''); }}
                  placeholder="you@email.com"
                  placeholderTextColor={MUTED}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => pwdRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Password</Text>
              <View style={s.inputRow}>
                <LockSimple size={18} color={MUTED} />
                <TextInput
                  ref={pwdRef}
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); setLocalError(''); }}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={MUTED}
                  secureTextEntry={!showPwd}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <Pressable onPress={() => setShowPwd(v => !v)} hitSlop={10} style={s.eyeBtn}>
                  {showPwd
                    ? <EyeSlash size={18} color={MUTED} />
                    : <Eye size={18} color={MUTED} />
                  }
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Confirm Password</Text>
              <View style={[
                s.inputRow,
                password && confirmPwd && password !== confirmPwd && s.inputRowError,
              ]}>
                <LockSimple size={18} color={MUTED} />
                <TextInput
                  ref={confirmRef}
                  style={[s.input, { flex: 1 }]}
                  value={confirmPwd}
                  onChangeText={(t) => { setConfirmPwd(t); setLocalError(''); }}
                  placeholder="Repeat password"
                  placeholderTextColor={MUTED}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={10} style={s.eyeBtn}>
                  {showConfirm
                    ? <EyeSlash size={18} color={MUTED} />
                    : <Eye size={18} color={MUTED} />
                  }
                </Pressable>
              </View>
              {password && confirmPwd && password !== confirmPwd ? (
                <Text style={s.inlineError}>Passwords don't match</Text>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                s.btn,
                !canSubmit && s.btnDisabled,
                pressed && canSubmit && s.btnPressed,
              ]}
              onPress={handleRegister}
              disabled={!canSubmit}
            >
              {loading
                ? <ActivityIndicator color={WHITE} />
                : <Text style={s.btnText}>Create Account</Text>
              }
            </Pressable>

            <View style={s.footer}>
              <Text style={s.footerText}>Already have an account? </Text>
              <Pressable onPress={() => router.replace('/auth/login')} hitSlop={8}>
                <Text style={s.footerLink}>Log In</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    height: H * 0.30,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  brand: {
    alignItems: 'center',
    paddingBottom: 22,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
  },

  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 18 },

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
  cardTitle:  { fontSize: 22, fontWeight: '700', color: TEXT },
  cardSub:    { fontSize: 14, color: MUTED },

  errorBox:  { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 },
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
  inputRowError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
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
  inlineError: { fontSize: 12, color: '#DC2626', marginTop: -2 },

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
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  btnPressed:  { opacity: 0.88 },
  btnText: { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: 0.2 },

  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 4 },
  footerText: { fontSize: 14, color: MUTED },
  footerLink: { fontSize: 14, color: RUBY, fontWeight: '700' },
});
