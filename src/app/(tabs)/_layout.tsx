import { Tabs } from 'expo-router';
import { ForkKnifeIcon, HouseIcon, UserCircleIcon } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A2B5C',
        tabBarInactiveTintColor: '#9AA3C0',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#1A2B5C',
          shadowOpacity: 0.10,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused, color, size }) => (
            <HouseIcon size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="food-log"
        options={{
          title: t('tabs.food'),
          tabBarIcon: ({ focused, color, size }) => (
            <ForkKnifeIcon size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color, size }) => (
            <UserCircleIcon size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
