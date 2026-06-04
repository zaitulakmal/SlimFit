import { useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ScrollView, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue,
  useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Path } from 'react-native-svg';
import {
  X, Check, Lightning, ForkKnife, Drop, Scales,
  Clock, Barbell, BookOpenText, MapPin, Trophy, Star,
} from 'phosphor-react-native';
import { useProStore } from '../stores/proStore';

const { width: W, height: H } = Dimensions.get('window');

const NAVY  = '#1A2B5C';
const BLUE  = '#208AEF';
const GOLD  = '#F0C808';
const WHITE = '#FFFFFF';
const BG    = '#0F1A3C';

const PRO_FEATURES = [
  { icon: ForkKnife,   label: 'Full macro breakdown',        sub: 'Protein, carbs & fat per meal' },
  { icon: Clock,       label: 'Intermittent Fasting Timer',  sub: '16:8, 18:6, 20:4 protocols' },
  { icon: Scales,      label: 'Weight Tracker',              sub: 'Full history + goal progress chart' },
  { icon: Barbell,     label: 'Workout Logger',              sub: 'Log exercises + calories burned' },
  { icon: BookOpenText,label: 'Recipe Library',              sub: 'Healthy meal ideas with nutrition' },
  { icon: MapPin,      label: 'Grocery Finder',              sub: 'Find nearby healthy stores' },
  { icon: Trophy,      label: 'Streaks & Badges',            sub: 'Achievement rewards system' },
];

function PulsingGlow() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1,    { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.25,
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style, { alignItems: 'center', justifyContent: 'center' }]}>
      <Svg width={260} height={260}>
        <Defs>
          <LinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={GOLD} />
            <Stop offset="100%" stopColor={BLUE} />
          </LinearGradient>
        </Defs>
        <Circle cx={130} cy={130} r={120} fill="url(#glowGrad)" />
      </Svg>
    </Animated.View>
  );
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { isPro, loading, error, product, purchase, restore, clearError } = useProStore();

  useEffect(() => {
    if (isPro) router.back();
  }, [isPro]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const price = product?.localizedPrice ?? 'RM 9.99';

  const handlePurchase = async () => {
    const ok = await purchase();
    if (ok) {
      Alert.alert('🎉 Welcome to Pro!', 'All features are now unlocked. Enjoy Slimora Pro!', [
        { text: 'Let's go!', onPress: () => router.back() },
      ]);
    }
  };

  const handleRestore = async () => {
    const ok = await restore();
    if (ok) {
      Alert.alert('Restored!', 'Your Pro purchase has been restored.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <View style={s.root}>
      {/* Dark gradient background */}
      <Svg style={StyleSheet.absoluteFillObject} width={W} height={H}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#0F1A3C" />
            <Stop offset="60%" stopColor="#1A2B5C" />
            <Stop offset="100%" stopColor="#0D1526" />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#bgGrad)" />
      </Svg>

      {/* Close button */}
      <Pressable
        style={[s.closeBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        hitSlop={12}
      >
        <X size={22} color="rgba(255,255,255,0.6)" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 52, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero badge */}
        <Animated.View entering={FadeInUp.delay(0).duration(600)} style={s.heroBadgeWrap}>
          <PulsingGlow />
          <View style={s.heroBadge}>
            <Star size={28} weight="fill" color={GOLD} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={s.heroText}>
          <Text style={s.heroTitle}>Slimora Pro</Text>
          <Text style={s.heroSub}>Unlock everything. Reach your goals faster.</Text>
        </Animated.View>

        {/* Features list */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={s.featuresCard}>
          <Text style={s.featuresTitle}>Everything included</Text>
          {PRO_FEATURES.map(({ icon: Icon, label, sub }, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureIconWrap}>
                <Icon size={18} weight="fill" color={GOLD} />
              </View>
              <View style={s.featureText}>
                <Text style={s.featureLabel}>{label}</Text>
                <Text style={s.featureSub}>{sub}</Text>
              </View>
              <Check size={16} weight="bold" color="#4ADE80" />
            </View>
          ))}
        </Animated.View>

        {/* Free vs Pro comparison */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={s.compCard}>
          <View style={s.compRow}>
            <Text style={s.compHeader}>Feature</Text>
            <Text style={[s.compHeader, { color: '#94A3B8' }]}>Free</Text>
            <Text style={[s.compHeader, { color: GOLD }]}>Pro</Text>
          </View>
          {[
            ['Food Logging',   '✓', '✓'],
            ['Calorie Count',  '✓', '✓'],
            ['Water Tracker',  '✓', '✓'],
            ['Macros (P/C/F)', '—', '✓'],
            ['Fasting Timer',  '—', '✓'],
            ['Weight Tracker', '—', '✓'],
            ['Workout Logger', '—', '✓'],
            ['Recipes',        '—', '✓'],
          ].map(([feat, free, pro], i) => (
            <View key={i} style={[s.compRow, i % 2 === 0 && s.compRowAlt]}>
              <Text style={s.compFeat}>{feat}</Text>
              <Text style={[s.compVal, free === '—' && { color: '#475569' }]}>{free}</Text>
              <Text style={[s.compVal, { color: pro === '✓' ? '#4ADE80' : '#475569' }]}>{pro}</Text>
            </View>
          ))}
        </Animated.View>

        {/* One-time price note */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={s.priceNote}>
          <Lightning size={16} weight="fill" color={GOLD} />
          <Text style={s.priceNoteText}>One-time payment · No subscription · Lifetime access</Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={s.ctaWrap}>
          <Pressable
            style={({ pressed }) => [s.ctaBtn, pressed && { opacity: 0.88 }, loading && { opacity: 0.6 }]}
            onPress={handlePurchase}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={NAVY} />
            ) : (
              <>
                <Text style={s.ctaPrice}>{price}</Text>
                <Text style={s.ctaLabel}>Upgrade to Pro</Text>
              </>
            )}
          </Pressable>

          <Pressable style={s.restoreBtn} onPress={handleRestore} disabled={loading}>
            <Text style={s.restoreText}>Restore previous purchase</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 20, alignItems: 'center' },

  heroBadgeWrap: {
    width: 96, height: 96,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  heroBadge: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(240,200,8,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(240,200,8,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroText: { alignItems: 'center', marginBottom: 28, gap: 8 },
  heroTitle: {
    fontSize: 34, fontWeight: '900', color: WHITE,
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 16, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 22,
  },

  featuresCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 20,
    marginBottom: 16,
    gap: 14,
  },
  featuresTitle: {
    fontSize: 13, fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  featureIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(240,200,8,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureLabel: { fontSize: 14, fontWeight: '700', color: WHITE },
  featureSub:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },

  compCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  compRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  compRowAlt: { backgroundColor: 'rgba(255,255,255,0.03)' },
  compHeader: { flex: 1, fontSize: 12, fontWeight: '700', color: WHITE, textAlign: 'center' },
  compFeat:   { flex: 2, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  compVal:    { flex: 1, fontSize: 14, fontWeight: '700', color: WHITE, textAlign: 'center' },

  priceNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 24,
    backgroundColor: 'rgba(240,200,8,0.10)',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1, borderColor: 'rgba(240,200,8,0.2)',
  },
  priceNoteText: { fontSize: 13, fontWeight: '600', color: GOLD },

  ctaWrap: { width: '100%', alignItems: 'center', gap: 14 },
  ctaBtn: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaPrice: {
    fontSize: 13, fontWeight: '700', color: NAVY,
    letterSpacing: 0.3, marginBottom: 2,
  },
  ctaLabel: {
    fontSize: 18, fontWeight: '900', color: NAVY,
    letterSpacing: -0.3,
  },
  restoreBtn: { paddingVertical: 8 },
  restoreText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline' },
});
