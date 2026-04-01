import { Redirect } from 'expo-router';

// Template explore screen — redirected to tabs in SlimTrack
export default function Explore() {
  return <Redirect href="/(tabs)" />;
}
