import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useProfileStore } from '../stores/profileStore';
import '../i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const { profile, isLoaded, loadProfile } = useProfileStore();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadProfile()
      .catch((e) => {
        console.error('[Layout] loadProfile failed:', e);
        setError(String(e));
      })
      .finally(() => {
        SplashScreen.hideAsync();
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!profile?.onboardingCompleted) {
      router.replace('/onboarding' as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [ready]);

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errTitle}>Startup Error</Text>
        <Text style={s.errMsg}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={s.center}>
        <Text style={s.msg}>Loading...</Text>
      </View>
    );
  }

  return <Slot />;
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  msg: { fontSize: 16, color: '#6B7280' },
  errTitle: { fontSize: 18, fontWeight: '700', color: '#FF6B6B', marginBottom: 12 },
  errMsg: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
});
