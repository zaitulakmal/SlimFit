import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../../constants/theme-new';
import type { GoalProjection } from '../../services/goalProjection';

interface GoalCountdownCardProps {
  projection: GoalProjection | null;
}

export default function GoalCountdownCard({ projection }: GoalCountdownCardProps) {
  if (!projection) return null;

  const weeks = Math.round(projection.daysRemaining / 7);
  const etaLabel = new Date(projection.etaDateStr + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.card}>
      <Text style={styles.days}>{projection.daysRemaining}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>days to goal at your current pace</Text>
        <Text style={styles.subtitle}>
          ~{Math.abs(projection.weeklyRateKg)}kg/week · ETA around {etaLabel} ({weeks}w)
        </Text>
      </View>
    </View>
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
  days: { ...typography.display, color: colors.primary, minWidth: 64 },
  title: { ...typography.label, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
