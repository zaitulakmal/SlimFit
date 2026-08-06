import React, { useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../../constants/theme-new';
import { Mascot } from '../art/Mascot';

const { width: SCREEN_W } = Dimensions.get('window');
const CONFETTI_COLORS = [colors.primary, colors.accent, '#4CAF50', '#42A5F5', '#AB47BC'];

function ConfettiPiece({ index }: { index: number }) {
  const startX = (index * 37) % SCREEN_W;
  const fall = useSharedValue(-40);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const delay = (index % 10) * 80;
    fall.value = withDelay(
      delay,
      withTiming(700 + (index % 5) * 40, { duration: 1800 + (index % 6) * 150, easing: Easing.in(Easing.quad) })
    );
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 1000 }), 3, false));
    opacity.value = withDelay(delay + 1400, withTiming(0, { duration: 400 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: fall.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        style,
        { left: startX, backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length] },
      ]}
    />
  );
}

interface CelebrationModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onClose: () => void;
}

export default function CelebrationModal({
  visible,
  title,
  subtitle,
  ctaLabel = 'Keep Going',
  onClose,
}: CelebrationModalProps) {
  const scale = useSharedValue(0.7);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 11, stiffness: 140 });
    } else {
      scale.value = 0.7;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {visible && Array.from({ length: 24 }).map((_, i) => <ConfettiPiece key={i} index={i} />)}
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.art}>
            <Mascot size={96} mood="cheer" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{ctaLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,26,60,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 14,
    borderRadius: 2,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  art: { marginBottom: spacing.xs },
  title: { ...typography.heading, color: colors.text, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
