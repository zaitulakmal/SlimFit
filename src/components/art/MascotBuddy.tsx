/**
 * MascotBuddy — the animated character on the Home screen.
 *
 * Renders the <Mascot/> SVG with a gentle Reanimated float + breathe loop.
 *
 * This used to mount a react-three-fiber <Canvas> over expo-gl. That path
 * crashed on device ("Element type is invalid … got: undefined") and always
 * fell back to this 2D mascot anyway, while dragging three.js (~1MB of JS) and
 * a GL surface into the home screen. The SVG buddy is the real thing now.
 */
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Mascot, type Mood } from './Mascot';

export interface MascotBuddyProps {
  size?: number;
  mood?: Mood;
  /** Set false for static surfaces (list rows, screenshots). */
  animated?: boolean;
}

export function MascotBuddy({ size = 150, mood = 'happy', animated = true }: MascotBuddyProps) {
  const bob = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    bob.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    sway.value = withRepeat(
      withTiming(1, { duration: 2900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [animated, bob, sway]);

  // 'cheer' gets a livelier hop than the idle breathing.
  const lift = mood === 'cheer' ? 0.06 : 0.035;

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * size * lift },
      { rotate: `${(sway.value - 0.5) * 5}deg` },
      { scale: 1 + bob.value * 0.02 },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        },
        animated ? floatStyle : null,
      ]}
    >
      <Mascot size={size} mood={mood} />
    </Animated.View>
  );
}
