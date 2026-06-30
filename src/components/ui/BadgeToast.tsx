import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import { colors, typography, spacing, radius, shadow } from '../../constants/theme-new';
import type { BadgeDef } from '../../stores/statsStore';

interface BadgeToastProps {
  badge: BadgeDef;
  title: string;
  onDone: () => void;
}

export default function BadgeToast({ badge, title, onDone }: BadgeToastProps) {
  const translateY = useSharedValue(-100);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 14, stiffness: 160 });
    const id = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 300 }, () => {});
      setTimeout(onDone, 320);
    }, 2600);
    return () => clearTimeout(id);
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={[styles.wrap, style]}>
      <View style={[styles.iconWrap, { backgroundColor: badge.color + '22' }]}>
        <Ionicons name={badge.icon as any} size={20} color={badge.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Badge Unlocked</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 56,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    zIndex: 999,
    ...shadow.lg,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.caption, color: colors.textSecondary },
  title: { ...typography.subtitle, color: colors.text },
});
