import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function FoodLogLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: t('tabs.food') }} />
      <Stack.Screen name="search" options={{ presentation: 'card' }} />
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="recipes" options={{ presentation: 'card' }} />
    </Stack>
  );
}
