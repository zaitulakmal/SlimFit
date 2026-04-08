import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay,
  withSequence, Easing, runOnJS,
} from 'react-native-reanimated';
import { useProfileStore } from '../stores/profileStore';

const { width: W, height: H } = Dimensions.get('window');

export default function SplashScreen() {
  const profile = useProfileStore((s) => s.profile);

  const logoScale   = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY       = useSharedValue(20);
  const tagOpacity  = useSharedValue(0);
  const bgOpacity   = useSharedValue(1);

  const navigate = () => {
    if (!profile?.onboardingCompleted) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  };

  useEffect(() => {
    // Logo pop in
    logoScale.value   = withSpring(1, { damping: 12, stiffness: 120 });
    logoOpacity.value = withTiming(1, { duration: 400 });

    // Name fade + slide up
    textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    textY.value       = withDelay(400, withSpring(0, { damping: 14 }));

    // Tagline
    tagOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));

    // Fade out and navigate
    bgOpacity.value = withDelay(
      1800,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) },
        (finished) => { if (finished) runOnJS(navigate)(); }
      )
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View style={[s.root, containerStyle]}>
      <View style={s.center}>
        {/* Logo circle */}
        <Animated.View style={[s.logoCircle, logoStyle]}>
          <Text style={s.logoEmoji}>💪</Text>
        </Animated.View>

        {/* App name */}
        <Animated.Text style={[s.appName, textStyle]}>
          Slimora
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[s.tagline, tagStyle]}>
          Your journey starts here
        </Animated.Text>
      </View>

      {/* Bottom dots */}
      <Animated.View style={[s.dots, tagStyle]}>
        <View style={[s.dot, s.dotActive]} />
        <View style={s.dot} />
        <View style={s.dot} />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0EBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 16,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#B39DDB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 52,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#3D2C6B',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8B7AB5',
    letterSpacing: 0.3,
  },
  dots: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4C5F0',
  },
  dotActive: {
    backgroundColor: '#B39DDB',
    width: 24,
    borderRadius: 4,
  },
});
