/**
 * ActivityCard — selectable card for the activity level step.
 * Per D-04 and UI-SPEC Activity level card layout:
 *   - Default: white bg, #E5E7EB border, border-radius 12px, 56px min-height
 *   - Selected: #4CAF50 border (2px), #E8F5E9 bg tint, checkmark-circle top-right
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, typography } from '../../constants/theme';

interface ActivityCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

export default function ActivityCard({
  icon,
  title,
  description,
  selected,
  onPress,
}: ActivityCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      {/* Left icon */}
      <Ionicons
        name={icon}
        size={28}
        color={selected ? colors.primary : colors.textSecondary}
        style={styles.icon}
      />

      {/* Label group */}
      <View style={styles.labelGroup}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Selected checkmark — top-right */}
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={colors.primary}
          style={styles.checkmark}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    position: 'relative',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selectedTint,
  },
  icon: {
    marginRight: 12,
  },
  labelGroup: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
  },
  description: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
