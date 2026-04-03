import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInRight, FadeInUp } from 'react-native-reanimated';
import { colors, typography, spacing, radius, shadow } from '../../constants/theme-new';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  index?: number;
  style?: ViewStyle;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = colors.primary,
  index = 0,
  style,
}: StatsCardProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify()}
      style={[styles.card, style]}
    >
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
          {icon}
        </View>
      )}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Animated.View>
  );
}

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = colors.primary,
  backgroundColor = colors.borderLight,
  height = 8,
  borderRadius = 4,
  animated = true,
}: ProgressBarProps) {
  return (
    <View
      style={[
        styles.progressTrack,
        { backgroundColor, height, borderRadius },
      ]}
    >
      <View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
            height,
            borderRadius,
          },
        ]}
      />
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  index?: number;
}

export function SectionHeader({ title, action, index = 0 }: SectionHeaderProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).springify()}
      style={styles.sectionHeader}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Text style={styles.sectionAction}>{action.label}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.md,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.heading,
    fontWeight: '800',
    marginBottom: 2,
  },
  title: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.micro,
    color: colors.textTertiary,
    marginTop: 2,
  },
  progressTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
  },
  sectionAction: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
});
