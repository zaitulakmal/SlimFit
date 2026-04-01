/**
 * ProgressRing — animated SVG calorie ring.
 *
 * Renders two SVG circles (background arc + foreground progress arc).
 * Animation: react-native-reanimated useAnimatedProps with strokeDashoffset.
 * Duration: 600ms, Easing.out(Easing.cubic) per UI-SPEC Calorie Ring Animation.
 * Triggers on `progress` change — parent uses useFocusEffect to re-trigger on tab focus (D-08).
 *
 * Props:
 *   progress         0–1 fill fraction (1 = full ring)
 *   size             outer diameter in dp (default 200)
 *   strokeWidth      arc stroke width (default 16)
 *   color            arc foreground color
 *   backgroundColor  arc background color (default #E5E7EB)
 *   children         content rendered in the ring center
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;          // 0–1
  size?: number;             // outer diameter dp (default 200)
  strokeWidth?: number;      // arc stroke width (default 16)
  color: string;             // foreground arc color
  backgroundColor?: string;  // background arc color
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 16,
  color,
  backgroundColor = colors.border,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Animated progress value — 600ms ease-out cubic (UI-SPEC Interaction Contracts)
  const animatedProgress = useDerivedValue(() => {
    return withTiming(progress, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
        // Rotate -90° so arc starts at the top of the circle
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background arc — always full 360° */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Foreground progress arc */}
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
          // Start arc from top: rotate -90° around center
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>

      {/* Center content slot */}
      <View style={[styles.center, { width: size, height: size }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
