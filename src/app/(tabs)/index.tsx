/**
 * Home screen — motivating daily dashboard.
 *
 * Phase 2:
 * - CALS-01: daily calorie ring (consumed vs TDEE, positive framing)
 * - WATR-02: water progress ring
 * - WGHT-03: goal progress toward target weight
 * - ENGM-02: animated progress rings, colorful motivating layout
 *
 * D-07: TDEE shown as "~1,850 kcal" with "estimated" sublabel
 * D-08: Animated ring triggers on tab focus
 */

import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, spacing, typography } from '../../constants/theme';
import { useProfileStore } from '../../stores/profileStore';
import { useWeightStore } from '../../stores/weightStore';
import { useWaterStore } from '../../stores/waterStore';
import { useFoodStore } from '../../stores/foodStore';
import { useStatsStore } from '../../stores/statsStore';
import ProgressRing from '../../components/common/ProgressRing';

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greeting_morning';
  if (hour < 17) return 'home.greeting_afternoon';
  return 'home.greeting_evening';
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const { todayLog: weightToday, logs: weightLogs } = useWeightStore();
  const waterToday = useWaterStore((s) => s.today);
  const dayLogs = useFoodStore((s) => s.dayLogs);
  const foodTotals = {
    calories: dayLogs.reduce((a, l) => a + l.calories, 0),
    proteinG: dayLogs.reduce((a, l) => a + l.proteinG, 0),
    carbsG: dayLogs.reduce((a, l) => a + l.carbsG, 0),
    fatG: dayLogs.reduce((a, l) => a + l.fatG, 0),
  };
  const streakMap = useStatsStore((s) => s.streakMap);
  const foodStreak = streakMap['food']?.current ?? 0;

  // Animate rings on focus
  const [calorieProgress, setCalorieProgress] = useState(0);
  const [waterProgress, setWaterProgress] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Reload stores
      useWeightStore.getState().loadLogs();
      useWaterStore.getState().loadToday();
      useFoodStore.getState().loadDayLogs();
      useStatsStore.getState().loadStats();

      // Trigger ring animations
      setCalorieProgress(0);
      setWaterProgress(0);
      const id = setTimeout(() => {
        const profile = useProfileStore.getState().profile;
        const tdeeVal = profile?.tdee ?? 0;
        const consumed = useFoodStore.getState().getTotals().calories;
        setCalorieProgress(tdeeVal > 0 ? Math.min(consumed / tdeeVal, 1) : 0);
        const water = useWaterStore.getState().today;
        const goal = water?.goalMl ?? 2000;
        const total = water?.totalMl ?? 0;
        setWaterProgress(goal > 0 ? Math.min(total / goal, 1) : 0);
      }, 80);
      return () => clearTimeout(id);
    }, [])
  );

  if (!profile) {
    return (
      <View style={s.emptyContainer}>
        <Ionicons name="person-circle-outline" size={64} color={colors.border} />
        <Text style={s.emptyText}>{t('home.empty_state')}</Text>
      </View>
    );
  }

  const tdee = profile.tdee ?? 0;
  const consumed = Math.round(foodTotals.calories);
  const remaining = Math.max(tdee - consumed, 0);
  const overBudget = consumed > tdee;
  const calorieRingColor = overBudget ? colors.amber : colors.vividGreen;
  const calorieFillProgress = tdee > 0 ? Math.min(consumed / tdee, 1) : 0;

  const waterTotalMl = waterToday?.totalMl ?? 0;
  const waterGoalMl = waterToday?.goalMl ?? 2000;
  const waterRingColor = waterProgress >= 1 ? colors.primary : colors.skyBlue;

  // Goal progress
  const currentWeight = weightToday?.weightKg ?? profile.weightKg;
  const targetWeight = profile.targetWeightKg;
  const startWeight = weightLogs.length > 0 ? weightLogs[0].weightKg : profile.weightKg;
  const totalNeeded = Math.abs(startWeight - targetWeight);
  const achieved = Math.abs(startWeight - currentWeight);
  const goalProgress = totalNeeded > 0 ? Math.min(achieved / totalNeeded, 1) : 0;

  const displayName = profile.name || '';

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Streak banner */}
      {foodStreak >= 2 && (
        <View style={s.streakBanner}>
          <Text style={s.streakFire}>🔥</Text>
          <Text style={s.streakText}>
            {foodStreak} {t('stats.days')} {t('stats.food_streak').toLowerCase()}!
          </Text>
        </View>
      )}

      {/* Greeting */}
      <View style={s.greetingSection}>
        <Text style={s.greetingText}>{t(getGreetingKey(), { name: displayName })}</Text>
        <Text style={s.dateText}>
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Calorie ring — centrepiece */}
      <View style={s.ringContainer}>
        <ProgressRing
          progress={calorieFillProgress}
          size={200}
          strokeWidth={16}
          color={calorieRingColor}
          backgroundColor={colors.border}
        >
          <View style={s.ringCenter}>
            <Text style={[s.ringMainValue, { color: calorieRingColor }]}>
              {remaining.toLocaleString()}
            </Text>
            <Text style={s.ringSubLabel}>{t('home.kcal_remaining', { n: '' }).trim()}</Text>
            <Text style={s.ringBudgetLabel}>~{tdee.toLocaleString()} kcal</Text>
          </View>
        </ProgressRing>
        <Text style={s.tdeeSub}>{t('home.daily_budget_sub')}</Text>
      </View>

      {/* Water + Weight mini cards */}
      <View style={s.cardsRow}>
        {/* Water card */}
        <TouchableOpacity
          style={s.card}
          onPress={() => router.push('/(tabs)/water')}
          activeOpacity={0.85}
        >
          <View style={s.cardIconRow}>
            <Ionicons name="water" size={20} color={colors.skyBlue} />
            <Text style={[s.cardLabel, { color: colors.skyBlue }]}>{t('tabs.water')}</Text>
          </View>
          <ProgressRing
            progress={waterProgress}
            size={72}
            strokeWidth={7}
            color={waterRingColor}
            backgroundColor={colors.border}
          >
            <Text style={[s.miniRingValue, { color: waterRingColor }]}>
              {waterTotalMl >= 1000
                ? `${(waterTotalMl / 1000).toFixed(1)}L`
                : `${waterTotalMl}`}
            </Text>
          </ProgressRing>
          <Text style={s.cardSub}>
            {waterTotalMl >= 1000
              ? `${(waterTotalMl / 1000).toFixed(1)}L`
              : `${waterTotalMl}ml`}
            {' / '}
            {waterGoalMl >= 1000 ? `${waterGoalMl / 1000}L` : `${waterGoalMl}ml`}
          </Text>
        </TouchableOpacity>

        {/* Weight / goal card */}
        <TouchableOpacity
          style={s.card}
          onPress={() => router.push('/(tabs)/weight')}
          activeOpacity={0.85}
        >
          <View style={s.cardIconRow}>
            <Ionicons name="scale-outline" size={20} color={colors.primary} />
            <Text style={[s.cardLabel, { color: colors.primary }]}>{t('tabs.weight')}</Text>
          </View>
          <Text style={s.cardBigValue}>{currentWeight} kg</Text>
          <View style={s.goalProgressTrack}>
            <View style={[s.goalProgressFill, { width: `${goalProgress * 100}%` as any }]} />
          </View>
          <Text style={s.cardSub}>
            {t('home.goal_target', { n: targetWeight })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's summary strip */}
      <View style={s.summaryStrip}>
        <View style={s.summaryItem}>
          <Ionicons name="flame-outline" size={18} color={colors.amber} />
          <Text style={s.summaryValue}>{consumed.toLocaleString()}</Text>
          <Text style={s.summaryLabel}>{t('home.consumed')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
          <Text style={s.summaryValue}>{remaining.toLocaleString()}</Text>
          <Text style={s.summaryLabel}>{t('home.remaining')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Ionicons name="water-outline" size={18} color={colors.skyBlue} />
          <Text style={s.summaryValue}>
            {waterTotalMl >= 1000 ? `${(waterTotalMl / 1000).toFixed(1)}L` : `${waterTotalMl}ml`}
          </Text>
          <Text style={s.summaryLabel}>{t('tabs.water')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.white },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  greetingSection: { marginBottom: spacing.lg, marginTop: spacing.sm },
  greetingText: { ...typography.heading, color: colors.textPrimary },
  dateText: { ...typography.label, color: colors.textSecondary, marginTop: spacing.xs },
  ringContainer: { alignItems: 'center', marginBottom: spacing.sm },
  ringCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  ringMainValue: { ...typography.display },
  ringSubLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },
  ringBudgetLabel: { ...typography.label, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  tdeeSub: { ...typography.label, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  cardsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  cardLabel: { ...typography.label },
  cardBigValue: { ...typography.heading, color: colors.textPrimary },
  miniRingValue: { ...typography.label, fontWeight: '700' as any },
  cardSub: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },
  goalProgressTrack: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  goalProgressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  summaryValue: { ...typography.body, color: colors.textPrimary },
  summaryLabel: { ...typography.label, color: colors.textSecondary },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.border },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  streakFire: { fontSize: 18 },
  streakText: { ...typography.body, color: colors.amber },
});
