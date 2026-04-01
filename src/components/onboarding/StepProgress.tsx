/**
 * StepProgress — thin 4px progress bar for the onboarding wizard.
 * Purple fill (#9C27B0) per UI-SPEC onboarding wizard chrome.
 * Animates width using React Native Animated.timing (200ms) per Interaction Contracts.
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/theme';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepProgress({
  currentStep,
  totalSteps,
}: StepProgressProps) {
  const progress = useRef(
    new Animated.Value((currentStep - 1) / totalSteps)
  ).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: currentStep / totalSteps,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps, progress]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width: widthInterpolated }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    backgroundColor: colors.purple,
    borderRadius: 2,
  },
});
