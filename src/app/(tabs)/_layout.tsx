import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  House,
  ForkKnife,
  Scales,
  Drop,
  Barbell,
  BookOpenText,
  Storefront,
  UserCircle,
} from 'phosphor-react-native';
import { colors } from '../../constants/theme';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.borderLight,
          height: 64,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        headerShown: false,
      }}
    >
      {/* D-05: Tab order — Home → Food → Weight → Water → Profile */}
      {/* D-06: App always opens to Home tab (index is default route) */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused, color, size }) => (
            <House size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="food-log"
        options={{
          title: t('tabs.food'),
          tabBarIcon: ({ focused, color, size }) => (
            <ForkKnife size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="weight"
        options={{
          title: t('tabs.weight'),
          tabBarIcon: ({ focused, color, size }) => (
            <Scales size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="water"
        options={{
          title: t('tabs.water'),
          tabBarIcon: ({ focused, color, size }) => (
            <Drop size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t('tabs.activity'),
          tabBarIcon: ({ focused, color, size }) => (
            <Barbell size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: t('tabs.recipes'),
          tabBarIcon: ({ focused, color, size }) => (
            <BookOpenText size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: t('tabs.grocery'),
          tabBarIcon: ({ focused, color, size }) => (
            <Storefront size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color, size }) => (
            <UserCircle size={size} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
