import { Redirect } from 'expo-router';
import { useProfileStore } from '../stores/profileStore';

export default function Index() {
  const profile = useProfileStore((s) => s.profile);

  if (!profile?.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
