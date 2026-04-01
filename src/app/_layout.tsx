import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useProfileStore } from '../stores/profileStore';
import '../i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { profile, isLoaded, loadProfile } = useProfileStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile()
      .catch((e) => {
        console.error('[Layout] loadProfile failed:', e);
        setError(String(e));
      })
      .finally(() => SplashScreen.hideAsync());
  }, []);

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errTitle}>Startup Error</Text>
        <Text style={s.errMsg}>{error}</Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={s.center}>
        <Text style={s.msg}>Loading...</Text>
      </View>
    );
  }

  // Slot renders the matched child route.
  // - If route is / → src/app/index.tsx handles the redirect
  // - If onboarding not done → src/app/index.tsx redirects to /onboarding
  return <Slot />;
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  msg: { fontSize: 16, color: '#6B7280' },
  errTitle: { fontSize: 18, fontWeight: '700', color: '#FF6B6B', marginBottom: 12 },
  errMsg: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
});
