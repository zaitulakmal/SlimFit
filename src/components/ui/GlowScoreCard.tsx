import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import ProgressRingNew from './ProgressRingNew';
import { colors, typography, spacing, radius, shadow } from '../../constants/theme-new';
import { glowScoreLabel, type GlowScoreBreakdown } from '../../services/glowScore';

interface GlowScoreCardProps {
  breakdown: GlowScoreBreakdown | null;
}

export default function GlowScoreCard({ breakdown }: GlowScoreCardProps) {
  const score = breakdown?.score ?? 0;

  return (
    <Pressable style={styles.card} onPress={() => router.push('/glow-score')}>
      <ProgressRingNew progress={score / 100} size={72} strokeWidth={8} color={colors.accent}>
        <Text style={styles.scoreText}>{score}</Text>
      </ProgressRingNew>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Glow Score</Text>
        <Text style={styles.subtitle}>{glowScoreLabel(score)} — tap for breakdown</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow.sm,
  },
  scoreText: { ...typography.title, color: colors.text },
  title: { ...typography.subtitle, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
