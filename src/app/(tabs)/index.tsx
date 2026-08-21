/**
 * Home screen — Slimora.
 *
 * Cream dashboard: greeting, a calorie ring whose filled arc is split by macro,
 * a CTA row, the AI assistant card, calories burned, a goal countdown and
 * explore cards.
 */

import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import {
  Drop,
  Barbell,
  BookOpenText,
  ChartLineUp,
  ArrowRight,
  PlusCircle,
  Lightning,
  Fire,
  UserCircle,
} from 'phosphor-react-native';

import { cute, radius, cuteShadow, withAlpha, cardTints, cardBorder } from '@/theme/cute';
import { MascotBuddy } from '@/components/art/MascotBuddy';
import { MacroDonut } from '@/components/art/MacroDonut';
import { AssistantChat } from '@/components/ui/AssistantChat';

import { useProfileStore } from '../../stores/profileStore';
import { useWeightStore } from '../../stores/weightStore';
import { useWaterStore } from '../../stores/waterStore';
import { useFoodStore } from '../../stores/foodStore';
import { useStatsStore, BADGE_DEFS, type BadgeDef } from '../../stores/statsStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useFastingStore } from '../../stores/fastingStore';
import { projectGoalDate, type GoalProjection } from '../../services/goalProjection';
import GoalCountdownCard from '../../components/ui/GoalCountdownCard';
import AdBanner from '../../components/ui/AdBanner';
import CelebrationModal from '../../components/ui/CelebrationModal';
import BadgeToast from '../../components/ui/BadgeToast';

const { width: W } = Dimensions.get('window');
const RF = (size: number) => Math.round(size * (W / 390));

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting_morning';
  if (h < 17) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

/** The i18n strings end in ", {{name}}" — drop the dangling comma when we have no name. */
function greetingText(line: string, name: string): string {
  return name ? line : line.replace(/[,\s]+$/, '');
}

// ── Explore card ──────────────────────────────────────────────────────────────
function ExploreCard({
  title,
  subtitle,
  icon,
  tint,
  onPress,
  index,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tint: keyof typeof cardTints;
  onPress: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 70 + 240).springify()}>
      <TouchableOpacity
        style={[
          ex.card,
          { backgroundColor: cardTints[tint], borderColor: withAlpha(cardBorder[tint], 0.5) },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={ex.iconWrap}>{icon}</View>
        <View style={ex.textWrap}>
          <Text style={ex.title}>{title}</Text>
          <Text style={ex.sub}>{subtitle}</Text>
        </View>
        <View style={ex.arrow}>
          <ArrowRight size={18} color="#FFFFFF" weight="bold" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ex = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cute.action,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: cute.ink, marginBottom: 3 },
  sub: { fontSize: 13, fontWeight: '500', color: withAlpha(cute.ink, 0.75) },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cute.action,
  },
});

// ── Mini bento card ───────────────────────────────────────────────────────────
function MiniCard({
  children,
  bgColor,
  onPress,
  index,
  style,
}: {
  children: React.ReactNode;
  bgColor: string;
  onPress?: () => void;
  index: number;
  style?: any;
}) {
  const body = (extra: any) => (
    <Animated.View
      entering={FadeInUp.delay(index * 70 + 120).springify()}
      style={[mi.card, { backgroundColor: bgColor }, cuteShadow.sm, extra]}
    >
      {children}
    </Animated.View>
  );
  // Sizing (flex) has to live on the outermost node, otherwise the touchable
  // wrapper collapses to its content width and the card never fills its column.
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={style}>
      {body(mi.fill)}
    </TouchableOpacity>
  ) : (
    body(style)
  );
}

const mi = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  fill: { flexGrow: 1 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const profile = useProfileStore((s) => s.profile);
  const { logs: weightLogs } = useWeightStore();
  const dayLogs = useFoodStore((s) => s.dayLogs);
  const streakMap = useStatsStore((s) => s.streakMap);
  const totalBurned = useWorkoutStore((s) => s.totalBurned);
  const isProfileLoaded = useProfileStore((s) => s.isLoaded);
  const isFoodLoaded = useFoodStore((s) => s.isLoaded);

  const foodTotals = {
    calories: Number(dayLogs.reduce((a, l) => a + Number(l.calories), 0)),
    proteinG: Number(dayLogs.reduce((a, l) => a + Number(l.proteinG), 0)),
    carbsG: Number(dayLogs.reduce((a, l) => a + Number(l.carbsG), 0)),
    fatG: Number(dayLogs.reduce((a, l) => a + Number(l.fatG), 0)),
  };

  const foodStreak = Number(streakMap['food']?.current) || 0;

  const [milestoneQueue, setMilestoneQueue] = useState<BadgeDef[]>([]);
  const [toastQueue, setToastQueue] = useState<BadgeDef[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      useWeightStore.getState().loadLogs();
      // Water and fasting have no card here any more, but the AI assistant reads
      // both out of these stores — without the load it would report 0 ml.
      useWaterStore.getState().loadToday();
      useFastingStore.getState().loadToday();
      useFoodStore.getState().loadDayLogs();
      useStatsStore
        .getState()
        .loadStats()
        .then((newlyUnlocked) => {
          if (newlyUnlocked.length === 0) return;
          const defs = newlyUnlocked
            .map((id) => BADGE_DEFS.find((b) => b.id === id))
            .filter(Boolean) as BadgeDef[];
          setMilestoneQueue((q) => [...q, ...defs.filter((d) => d.isMilestone)]);
          setToastQueue((q) => [...q, ...defs.filter((d) => !d.isMilestone)]);
        });
      useWorkoutStore.getState().loadToday();
    }, [])
  );

  if (!isProfileLoaded || !isFoodLoaded) {
    return (
      <View style={s.emptyState}>
        <MascotBuddy size={120} mood="happy" />
        <Text style={s.emptyText}>Loading…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.emptyState}>
        <UserCircle size={72} color={cute.inkFaint} weight="regular" />
        <Text style={s.emptyText}>{t('home.empty_state')}</Text>
      </View>
    );
  }

  const tdee = Number(profile.calorieTarget ?? profile.tdee) || 0;
  const consumed = Math.round(Number(foodTotals.calories));
  const netBudget = tdee + Number(totalBurned);
  const targetWeight = Number(profile.targetWeightKg);

  const goalProjection: GoalProjection | null = projectGoalDate(
    weightLogs.map((w) => ({ dateStr: w.dateStr, weightKg: w.weightKg })),
    targetWeight,
    new Date().toISOString().split('T')[0]
  );

  const name = profile.name || '';

  // The donut's segment angles come from each macro's share of the calories
  // eaten: 4 kcal per gram of protein and carbs, 9 for fat.
  const macroSlices = [
    { key: 'protein', label: 'Protein', grams: Number(foodTotals.proteinG), kcalPerGram: 4, accent: cute.protein },
    { key: 'carbs', label: 'Carbs', grams: Number(foodTotals.carbsG), kcalPerGram: 4, accent: cute.carbs },
    { key: 'fat', label: 'Fat', grams: Number(foodTotals.fatG), kcalPerGram: 9, accent: cute.fat },
  ];


  // One-line nudge on the card; the real answers come from the chat itself.
  const remainingKcal = Math.max(netBudget - consumed, 0);
  const assistantTeaser =
    consumed <= 0
      ? `Nothing logged yet today — you have ${Math.round(netBudget).toLocaleString()} kcal to work with. Ask me what to eat.`
      : consumed > netBudget
        ? `You're ${Math.round(consumed - netBudget).toLocaleString()} kcal over today. Ask me how to balance it out.`
        : `${Math.round(remainingKcal).toLocaleString()} kcal left today. Ask me about your food, weight, or goal.`;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      showsVerticalScrollIndicator={false}>
      {/* ── HERO: greeting + calorie donut split by macro ── */}
      <View style={[s.header, { paddingTop: insets.top + RF(8) }]}>
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greetText} numberOfLines={2}>
              {greetingText(t(greetingKey(), { name }), name)}
            </Text>
            <Text style={s.dateText}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          {foodStreak >= 2 && (
            <View style={s.streakPill}>
              <Fire size={16} color={cute.warn} weight="fill" />
              <Text style={s.streakNum}>{foodStreak}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).springify()} style={s.donutWrap}>
          <MacroDonut consumed={consumed} budget={netBudget} macros={macroSlices} size={RF(230)} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(140).springify()} style={s.ctaRow}>
          <TouchableOpacity
            style={s.ctaPrimary}
            activeOpacity={0.9}
            onPress={() => router.push('/fasting-hidden')}
          >
            <Text style={s.ctaPrimaryText}>Fasting plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ctaIcon} activeOpacity={0.8} onPress={() => router.push('/water-hidden')}>
            <Drop size={20} color={cute.ink} weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity style={s.ctaIcon} activeOpacity={0.8} onPress={() => router.push('/(tabs)/food-log')}>
            <PlusCircle size={20} color={cute.ink} weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity style={s.ctaIcon} activeOpacity={0.8} onPress={() => router.push('/weekly-report')}>
            <ChartLineUp size={20} color={cute.ink} weight="bold" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── BODY ────────────────────────────────────────── */}
      <View style={s.body}>
        {/* AI assistant card */}
        <Animated.View
          entering={FadeInUp.delay(160).springify()}
          style={[s.assistantCard, { backgroundColor: cute.blush }]}
        >
          <View style={s.assistantTop}>
            <MascotBuddy size={42} mood="happy" animated={false} />
            <Text style={s.assistantName}>Slimora assistant</Text>
          </View>
          <Text style={s.assistantMsg}>{assistantTeaser}</Text>
          <TouchableOpacity style={s.assistantBtn} activeOpacity={0.9} onPress={() => setChatOpen(true)}>
            <Text style={s.assistantBtnText}>Let’s discuss</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Calories burned from exercise */}
        {totalBurned > 0 && (
          <View style={s.bentoRow}>
            <MiniCard
              bgColor={withAlpha(cute.butter, 0.2)}
              index={3}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 110 }}
            >
              <Lightning size={24} weight="fill" color={cute.warn} />
              <Text style={[s.bentoNum, { color: '#B8860B', fontSize: RF(24), marginTop: 6 }]}>
                {Number(totalBurned).toLocaleString()}
              </Text>
              <Text style={[s.bentoLabel, { color: '#B8860B' }]}>Burned</Text>
            </MiniCard>
          </View>
        )}

        {/* Goal countdown */}
        <Animated.View entering={FadeInUp.delay(180).springify()} style={{ marginBottom: 16 }}>
          <GoalCountdownCard projection={goalProjection} />
        </Animated.View>


        {/* Explore */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={s.sectionLabel}>
          <Text style={s.sectionTitle}>Explore</Text>
        </Animated.View>

        <ExploreCard
          title="Recipes"
          subtitle="Browse healthy meals"
          icon={<BookOpenText size={26} weight="fill" color="#FFFFFF" />}
          tint="sky"
          onPress={() => router.push('/recipes-hidden')}
          index={0}
        />
        <ExploreCard
          title="Activity"
          subtitle="Log workouts"
          icon={<Barbell size={26} weight="fill" color="#FFFFFF" />}
          tint="butter"
          onPress={() => router.push('/activity-hidden')}
          index={1}
        />
        <ExploreCard
          title="Weekly Report"
          subtitle="See how this week went"
          icon={<ChartLineUp size={26} weight="fill" color="#FFFFFF" />}
          tint="mint"
          onPress={() => router.push('/weekly-report')}
          index={2}
        />

        <AdBanner />
        <View style={{ height: 100 }} />
      </View>

      {milestoneQueue[0] && (
        <CelebrationModal
          visible
          title={t(milestoneQueue[0].titleKey)}
          subtitle={t(milestoneQueue[0].descKey)}
          onClose={() => setMilestoneQueue((q) => q.slice(1))}
        />
      )}
      {toastQueue[0] && (
        <BadgeToast
          badge={toastQueue[0]}
          title={t(toastQueue[0].titleKey)}
          onDone={() => setToastQueue((q) => q.slice(1))}
        />
      )}

      <AssistantChat visible={chatOpen} onClose={() => setChatOpen(false)} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: cute.cream },
  header: { paddingHorizontal: RF(18), paddingBottom: RF(14), alignItems: 'center' },
  greetRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: RF(6) },
  greetText: { fontSize: RF(26), fontWeight: '800', color: cute.ink, letterSpacing: -0.6, lineHeight: RF(32) },
  dateText: { fontSize: RF(13), fontWeight: '500', color: cute.inkSoft, marginTop: RF(2) },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withAlpha(cute.butter, 0.35),
    paddingHorizontal: RF(12),
    paddingVertical: RF(6),
    borderRadius: 999,
  },
  streakNum: { fontSize: RF(14), fontWeight: '800', color: '#B8860B' },

  donutWrap: { alignItems: 'center', marginTop: RF(14), marginBottom: RF(20) },

  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: RF(10), width: '100%' },
  ctaPrimary: {
    flex: 1,
    height: RF(58),
    borderRadius: 999,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: RF(18),
  },
  ctaPrimaryText: { color: '#FFFFFF', fontSize: RF(16), fontWeight: '800' },
  ctaIcon: {
    width: RF(56),
    height: RF(56),
    borderRadius: 999,
    backgroundColor: cute.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: cute.line,
  },

  body: { paddingHorizontal: 18, paddingTop: RF(18) },

  sectionLabel: { marginBottom: RF(12), marginTop: RF(4) },
  sectionTitle: { fontSize: RF(17), fontWeight: '700', color: cute.ink, letterSpacing: -0.2 },

  bentoRow: { flexDirection: 'row', gap: RF(10), marginBottom: RF(10) },
  bentoNum: { fontSize: RF(24), fontWeight: '900', letterSpacing: -0.5 },
  bentoLabel: { fontSize: RF(11), fontWeight: '700', marginTop: 2 },

  assistantCard: {
    borderRadius: radius.xl,
    padding: RF(18),
    marginBottom: RF(16),
    borderWidth: 1,
    borderColor: withAlpha('#E894C4', 0.5),
  },
  assistantTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: RF(10) },
  assistantName: { fontSize: RF(16), fontWeight: '800', color: cute.ink },
  assistantMsg: { fontSize: RF(14), fontWeight: '500', color: cute.ink, lineHeight: RF(21), marginBottom: RF(14) },
  assistantBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#161616',
    paddingHorizontal: RF(20),
    paddingVertical: RF(12),
    borderRadius: 999,
  },
  assistantBtnText: { color: '#FFFFFF', fontSize: RF(14), fontWeight: '700' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cute.cream,
    gap: RF(14),
  },
  emptyText: { fontSize: RF(14), color: cute.inkSoft, textAlign: 'center', paddingHorizontal: RF(28) },
});
