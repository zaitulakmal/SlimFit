import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../../constants/theme-new';

interface MacroChipProps {
  label: string;
  value: string;
  color: string;
  index?: number;
  small?: boolean;
}

export default function MacroChip({
  label,
  value,
  color,
  index = 0,
  small = false,
}: MacroChipProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify()}
      style={[
        styles.chip,
        small && styles.chipSmall,
        { borderLeftColor: color },
      ]}
    >
      <Text style={[styles.value, small && styles.valueSmall, { color }]}>
        {value}
      </Text>
      <Text style={[styles.label, small && styles.labelSmall]}>{label}</Text>
    </Animated.View>
  );
}

interface MacroRowProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories?: number;
  delay?: number;
}

export function MacroRow({ calories, protein, carbs, fat, delay = 0 }: MacroRowProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify()}
      style={styles.row}
    >
      <MacroChip label="Cal" value={String(calories)} color={colors.accent} index={0} />
      <MacroChip label="P" value={`${Math.round(protein)}g`} color={colors.primary} index={1} />
      <MacroChip label="C" value={`${Math.round(carbs)}g`} color={colors.secondary} index={2} />
      <MacroChip label="F" value={`${Math.round(fat)}g`} color={colors.purple} index={3} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  chipSmall: {
    paddingVertical: spacing.xs,
  },
  value: {
    ...typography.subtitle,
    fontWeight: '800',
  },
  valueSmall: {
    fontSize: 13,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  labelSmall: {
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
