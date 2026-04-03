import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { House, ForkKnife, User, CaretLeft } from 'phosphor-react-native';
import { colors, spacing, radius } from '../constants/theme-new';
import { pastelColors } from '../constants/pastel-theme';

interface BottomNavProps {
  showBack?: boolean;
  active?: string;
}

export default function BottomNav({ showBack = false, active }: BottomNavProps) {
  const getActiveColor = (tab: string) => {
    if (active === tab) return pastelColors.primary;
    return colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      {showBack && (
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <CaretLeft size={24} color={colors.text} weight="bold" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}
      <View style={[styles.tabs, !showBack && styles.tabsFull]}>
        <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)')}>
          <House size={22} weight={active === 'home' ? 'fill' : 'regular'} color={getActiveColor('home')} />
          <Text style={[styles.tabText, active === 'home' && { color: pastelColors.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)/food-log')}>
          <ForkKnife size={22} weight={active === 'food' ? 'fill' : 'regular'} color={getActiveColor('food')} />
          <Text style={[styles.tabText, active === 'food' && { color: pastelColors.primary }]}>Food</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)/profile')}>
          <User size={22} weight={active === 'profile' ? 'fill' : 'regular'} color={getActiveColor('profile')} />
          <Text style={[styles.tabText, active === 'profile' && { color: pastelColors.primary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
    marginRight: spacing.md,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 4,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabsFull: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  tabText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});