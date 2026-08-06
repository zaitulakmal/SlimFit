import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CaretLeft, ShareNetwork, ChartBar } from 'phosphor-react-native';
import { colors, typography, spacing, radius, shadow } from '../constants/theme-new';
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
              <ChartBar size={30} weight="fill" color={colors.primary} />
            </View>
            <Text style={s.heroTitle}>Your week at a glance</Text>
          </View>

          <View style={s.grid}>
            <StatTile label="Days Logged" value={`${summary.daysLogged}/7`} />
            <StatTile label="Avg Calories" value={`${summary.avgCalories}`} />
            <StatTile label="Water Goal Hit" value={`${Math.round(summary.waterGoalHitRate * 100)}%`} />
            <StatTile
              label="Weight Change"
              value={summary.weightChangeKg === null ? '—' : `${summary.weightChangeKg > 0 ? '+' : ''}${summary.weightChangeKg}kg`}
            />
            <StatTile label="Workouts" value={`${summary.workoutCount}`} />
            <StatTile label="Cal Burned" value={`${summary.caloriesBurned}`} />
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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.tile}>
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
    backgroundColor: colors.primary + '1A',
  },
  heroTitle: { ...typography.subtitle, color: C.text, marginTop: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31%', backgroundColor: C.surface, borderRadius: radius.lg, padding: spacing.sm,
    alignItems: 'center', gap: 4, ...shadow.sm,
  },
  tileValue: { ...typography.title, color: C.primary },
  tileLabel: { ...typography.caption, color: C.textSecondary, textAlign: 'center' },
  card: { backgroundColor: C.surface, borderRadius: radius.xl, padding: spacing.md, ...shadow.sm, gap: spacing.sm },
  sectionTitle: { ...typography.label, color: C.textSecondary },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  streakLabel: { ...typography.body, color: C.text },
  streakValue: { ...typography.body, color: C.primary, fontWeight: '700' },
});
