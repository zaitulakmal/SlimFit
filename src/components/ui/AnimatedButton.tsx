import React from 'react';
import { Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../constants/theme-new';

interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedButton({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(0.9, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const variantStyles = {
    primary: {
      container: {
        backgroundColor: disabled ? colors.textTertiary : colors.primary,
      },
      text: {
        color: colors.textInverse,
      },
    },
    secondary: {
      container: {
        backgroundColor: disabled ? colors.borderLight : colors.secondary,
      },
      text: {
        color: colors.textInverse,
      },
    },
    ghost: {
      container: {
        backgroundColor: disabled ? colors.borderLight : colors.surface,
        borderWidth: 1.5,
        borderColor: disabled ? colors.borderLight : colors.primary,
      },
      text: {
        color: disabled ? colors.textTertiary : colors.primary,
      },
    },
    danger: {
      container: {
        backgroundColor: disabled ? colors.textTertiary : colors.danger,
      },
      text: {
        color: colors.textInverse,
      },
    },
  };

  const sizeStyles = {
    sm: {
      container: {
        height: 36,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
      },
      text: {
        fontSize: 13,
      },
    },
    md: {
      container: {
        height: 48,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.lg,
      },
      text: {
        fontSize: 15,
      },
    },
    lg: {
      container: {
        height: 56,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.xl,
      },
      text: {
        fontSize: 17,
      },
    },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        v.container as ViewStyle,
        s.container as ViewStyle,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {icon && iconPosition === 'left' ? <>{icon}</> : null}
      <Animated.Text
        style={[
          styles.text,
          v.text as TextStyle,
          s.text as TextStyle,
          icon ? styles.iconTextLeft : undefined,
          textStyle,
        ]}
      >
        {title}
      </Animated.Text>
      {icon && iconPosition === 'right' ? <>{icon}</> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  iconTextLeft: {
    marginLeft: spacing.xs,
  },
});
