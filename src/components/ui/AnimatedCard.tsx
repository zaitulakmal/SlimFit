import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../../constants/theme-new';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing | number;
  variant?: 'default' | 'elevated' | 'outline' | 'filled';
  animated?: boolean;
  borderRadius?: keyof typeof radius;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedCard({
  children,
  onPress,
  style,
  padding = 'md',
  variant = 'default',
  animated = true,
  borderRadius = 'lg',
}: AnimatedCardProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleVal = animated
      ? interpolate(pressed.value, [0, 1], [1, 0.97], Extrapolation.CLAMP)
      : 1;

    return {
      transform: [
        { scale: withSpring(scaleVal, { damping: 20, stiffness: 200 }) },
      ],
      opacity: withTiming(animated ? interpolate(pressed.value, [0, 1], [1, 0.95]) : 1, { duration: 100 }),
    };
  });

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 200 });
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
      borderWidth: 0,
    },
    elevated: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    filled: {
      backgroundColor: colors.primarySubtle,
      borderWidth: 0,
    },
  };

  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      style={[
        styles.card,
        variantStyles[variant] as ViewStyle,
        { padding: paddingValue, borderRadius: radius[borderRadius] },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
