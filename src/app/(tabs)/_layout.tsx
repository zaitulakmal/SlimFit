import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { ForkKnifeIcon, HouseIcon, UserCircleIcon } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

const ACTIVE   = '#208AEF';
const INACTIVE = '#94A3B8';
const WHITE    = '#FFFFFF';
const NAVY     = '#1A2B5C';

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 82 : 68,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          shadowColor: NAVY,
          shadowOpacity: 0.10,
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
    backgroundColor: '#EFF6FF',
  },
});
