import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { colors, typography, spacing, radius, shadow } from '../constants/theme-new';
import ProgressRingNew from '../components/ui/ProgressRingNew';
import { LockedFeature } from '../components/ui/LockedFeature';
import { useGlowScoreStore } from '../stores/glowScoreStore';
import { glowScoreLabel } from '../services/glowScore';

const C = colors;

const COMPONENTS: { key: 'loggingScore' | 'waterScore' | 'weighInScore' | 'activityScore'; label: string }[] = [
  { key: 'loggingScore', label: 'Food Logging' },
  { key: 'waterScore', label: 'Water Goal' },
  { key: 'weighInScore', label: 'Weigh-Ins' },
  { key: 'activityScore', label: 'Activity' },
];

export default function GlowScoreScreen() {
  const { today, history, loadAndCompute } = useGlowScoreStore();

  useFocusEffect(
    useCallback(() => {
      loadAndCompute();
    }, [])
  );

  const score = today?.score ?? 0;
  const maxHistoryScore = Math.max(1, ...history.map((h) => h.score));

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <CaretLeft size={22} color={C.text} weight="bold" />
        </Pressable>
        <Text style={s.headerTitle}>Glow Score</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <ProgressRingNew progress={score / 100} size={140} strokeWidth={16} color={C.accent}>
            <Text style={s.heroScore}>{score}</Text>
            <Text style={s.heroOutOf}>/ 100</Text>
          </ProgressRingNew>
          <Text style={s.heroLabel}>{glowScoreLabel(score)}</Text>
          <Text style={s.heroSub}>Based on your last 7 days of consistency</Text>
        </View>

        <LockedFeature featureName="Glow Score breakdown">
          <View style={s.card}>
            <Text style={s.sectionTitle}>Breakdown</Text>
            {today &&
              COMPONENTS.map((c) => (
                <View key={c.key} style={s.barRow}>
                  <Text style={s.barLabel}>{c.label}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${(today[c.key] / 25) * 100}%` }]} />
                  </View>
                  <Text style={s.barValue}>{today[c.key]}/25</Text>
                </View>
              ))}
          </View>
        </LockedFeature>

        {history.length > 1 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Last 14 Days</Text>
            <View style={s.trendRow}>
              {history.map((h) => (
                <View key={h.dateStr} style={s.trendBarWrap}>
                  <View style={[s.trendBar, { height: Math.max(4, (h.score / maxHistoryScore) * 60) }]} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  heroCard: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xs },
  heroScore: { ...typography.display, color: C.text },
  heroOutOf: { ...typography.caption, color: C.textSecondary, marginTop: -6 },
  heroLabel: { ...typography.title, color: C.primary, marginTop: spacing.sm },
  heroSub: { ...typography.caption, color: C.textSecondary },
  card: { backgroundColor: C.surface, borderRadius: radius.xl, padding: spacing.md, ...shadow.sm, gap: spacing.sm },
  sectionTitle: { ...typography.label, color: C.textSecondary },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { ...typography.caption, color: C.text, width: 90 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.borderLight, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.accent, borderRadius: 4 },
  barValue: { ...typography.caption, color: C.textSecondary, width: 40, textAlign: 'right' },
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 64 },
  trendBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 60 },
  trendBar: { width: '100%', backgroundColor: C.accent, borderRadius: 3 },
});
