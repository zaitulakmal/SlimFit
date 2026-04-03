import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../../constants/theme-new';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  color?: string;
  delay?: number;
}

export default function StreakBadge({
  streak,
  size = 'md',
  showLabel = true,
  label = 'day streak',
  color = colors.accent,
  delay = 0,
}: StreakBadgeProps) {
  const scale = useSharedValue(0);
  const flameScale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 150 }));

    if (streak >= 3) {
      flameScale.value = withDelay(
        delay + 300,
        withRepeat(
          withSequence(
            withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    }
  }, [streak]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  const sizeStyles = {
    sm: {
      container: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: spacing.xs },
      emoji: 18,
      value: 16,
      label: 10,
    },
    md: {
      container: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
      emoji: 24,
      value: 22,
      label: 12,
    },
    lg: {
      container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
      emoji: 32,
      value: 30,
      label: 14,
    },
  };

  const s = sizeStyles[size];

  if (streak < 1) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        s.container as any,
        containerStyle,
      ]}
    >
      <Animated.Text style={[flameStyle, { fontSize: s.emoji, textAlign: 'center' }]}>
        🔥
      </Animated.Text>
      <View style={styles.textContainer}>
        <Text style={[styles.value, { fontSize: s.value, color }]}>
          {streak}
        </Text>
        {showLabel && (
          <Text style={[styles.label, { fontSize: s.label }]}>{label}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.streakBg,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  textContainer: {
    alignItems: 'center',
  },
  value: {
    fontWeight: '800',
    lineHeight: undefined,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: undefined,
  },
});
