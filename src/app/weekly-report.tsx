import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CaretLeft, ShareNetwork, ChartBar } from 'phosphor-react-native';
import { colors, typography, spacing, radius, shadow } from '../constants/theme-new';
import { cute, cardTints, cardBorder, withAlpha, cardTintOrder } from '@/theme/cute';
import { useStatsStore } from '../stores/statsStore';
import { buildWeeklyReport, weeklyReportShareText, type WeeklyReportSummary } from '../services/weeklyReport';

const C = colors;

export default function WeeklyReportScreen() {
  const [summary, setSummary] = useState<WeeklyReportSummary | null>(null);
  const streakMap = useStatsStore((s) => s.streakMap);

  useFocusEffect(
    useCallback(() => {
      buildWeeklyReport().then(setSummary);
    }, [])
  );

  const handleShare = () => {
    if (!summary) return;
    Share.share({ message: weeklyReportShareText(summary) });
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <CaretLeft size={22} color={C.text} weight="bold" />
        </Pressable>
        <Text style={s.headerTitle}>Weekly Report</Text>
        <Pressable onPress={handleShare} style={s.backBtn}>
          <ShareNetwork size={20} color={C.primary} weight="bold" />
        </Pressable>
      </View>

      {summary && (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.heroCard}>
            <View style={s.heroIcon}>
              <ChartBar size={30} weight="fill" color="#FFFFFF" />
            </View>
            <Text style={s.heroTitle}>Your week at a glance</Text>
          </View>

          <View style={s.grid}>
            {[
              { label: 'Days Logged', value: `${summary.daysLogged}/7` },
              { label: 'Avg Calories', value: `${summary.avgCalories}` },
              { label: 'Water Goal Hit', value: `${Math.round(summary.waterGoalHitRate * 100)}%` },
              {
                label: 'Weight Change',
                value:
                  summary.weightChangeKg === null
                    ? '—'
                    : `${summary.weightChangeKg > 0 ? '+' : ''}${summary.weightChangeKg}kg`,
              },
              { label: 'Workouts', value: `${summary.workoutCount}` },
              { label: 'Cal Burned', value: `${summary.caloriesBurned}` },
            ].map((tile, i) => (
              <StatTile key={tile.label} label={tile.label} value={tile.value} index={i} />
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Current Streaks</Text>
            <View style={s.streakRow}>
              <Text style={s.streakLabel}>Food logging</Text>
              <Text style={s.streakValue}>{streakMap['food']?.current ?? 0} days</Text>
            </View>
            <View style={s.streakRow}>
              <Text style={s.streakLabel}>Water goal</Text>
              <Text style={s.streakValue}>{streakMap['water']?.current ?? 0} days</Text>
            </View>
            <View style={s.streakRow}>
              <Text style={s.streakLabel}>Weigh-ins</Text>
              <Text style={s.streakValue}>{streakMap['weight']?.current ?? 0} days</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatTile({ label, value, index }: { label: string; value: string; index: number }) {
  const tint = cardTintOrder[index % cardTintOrder.length];
  return (
    <View style={[s.tile, { backgroundColor: cardTints[tint], borderColor: withAlpha(cardBorder[tint], 0.5) }]}>
      <Text style={s.tileValue}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.title, color: C.text },
  content: { padding: spacing.md, paddingBottom: spacing['2xl'], gap: spacing.md },
  heroCard: { alignItems: 'center', paddingVertical: spacing.md },
  heroIcon: {
    width: 60, height: 60, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: cute.action,
  },
  heroTitle: { ...typography.subtitle, color: C.text, marginTop: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31%', borderRadius: 28, padding: spacing.sm,
    alignItems: 'center', gap: 4, borderWidth: 1,
  },
  tileValue: { ...typography.title, color: cute.ink },
  tileLabel: { ...typography.caption, color: withAlpha(cute.ink, 0.7), textAlign: 'center' },
  card: { backgroundColor: C.surface, borderRadius: 28, padding: spacing.md, borderWidth: 1, borderColor: '#F2E7E2', gap: spacing.sm },
  sectionTitle: { ...typography.label, color: C.textSecondary },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  streakLabel: { ...typography.body, color: C.text },
  streakValue: { ...typography.body, color: C.primary, fontWeight: '700' },
});
