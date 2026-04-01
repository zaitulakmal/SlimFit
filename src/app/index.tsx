import { Redirect } from 'expo-router';

// Redirect root to the main tab navigator
// D-06: App always opens to Home tab on launch
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
