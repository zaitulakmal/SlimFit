import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography } from '../../constants/theme-new';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  delay?: number;
  showPercentage?: boolean;
  animate?: boolean;
}

export default function ProgressRingNew({
  progress,
  size = 160,
  strokeWidth = 14,
  color = colors.primary,
  backgroundColor = colors.borderLight,
  children,
  delay = 0,
  showPercentage = false,
  animate = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useDerivedValue(() => {
    return withDelay(
      delay,
      animate
        ? withSpring(Math.min(Math.max(progress, 0), 1), {
            damping: 18,
            stiffness: 80,
            mass: 0.8,
          })
        : progress
    );
  }, [progress, delay, animate]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        {children}
        {showPercentage && (
          <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    ...typography.caption,
    fontWeight: '700',
    position: 'absolute',
    bottom: 8,
  },
});
