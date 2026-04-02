import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../constants/theme';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 64,
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
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="food-log"
        options={{
          title: t('tabs.food'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="weight"
        options={{
          title: t('tabs.weight'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'scale' : 'scale-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="water"
        options={{
          title: t('tabs.water'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'water' : 'water-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t('tabs.activity'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'barbell' : 'barbell-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: t('tabs.recipes'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
