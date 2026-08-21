import { Stack } from 'expo-router';

/**
 * Without this layout the directory registers as the route "garden/index",
 * so <Tabs.Screen name="garden"> never matches and the tab falls back to a
 * raw label and default icon. food-log and profile carry the same file.
 */
export default function GardenLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
