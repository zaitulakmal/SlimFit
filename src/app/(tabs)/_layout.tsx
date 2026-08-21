import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ForkKnifeIcon, HouseIcon, UserCircleIcon, FlowerLotusIcon } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { cute, withAlpha } from '@/theme/cute';

/**
 * Bar height above the system inset. Icon pill (32) + label (~14) + padding.
 * Screens pad their scroll content with useBottomTabBarHeight() so every tab
 * ends at the same place — see TAB_BAR_BASE consumers.
 */
export const TAB_BAR_BASE = 58;

const ACTIVE   = cute.coralDeep;
const INACTIVE = cute.inkFaint;
const WHITE    = cute.card;

function TabIcon({
  icon: Icon,
  focused,
}: {
  icon: typeof HouseIcon;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Icon size={22} weight={focused ? 'fill' : 'regular'} color={focused ? ACTIVE : INACTIVE} />
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopWidth: 0,
          // Grow with the device's bottom inset instead of guessing per-platform,
          // so gesture-nav Android and notched iOS both sit flush.
          height: TAB_BAR_BASE + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          shadowColor: '#E0A6A0',
          shadowOpacity: 0.14,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -4 },
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={HouseIcon} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="food-log"
        options={{
          title: t('tabs.food'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={ForkKnifeIcon} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: t('tabs.garden'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={FlowerLotusIcon} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={UserCircleIcon} focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: withAlpha(cute.coral, 0.16),
  },
});
