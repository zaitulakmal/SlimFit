import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useProfileStore } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import { useProStore } from '../stores/proStore';
import '../i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { profile, isLoaded: profileLoaded, loadProfile } = useProfileStore();
  const { user, isLoaded: authLoaded, init } = useAuthStore();
  const initPro = useProStore((s) => s.init);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { initPro(); }, []);
  const isReady = authLoaded && profileLoaded;
  const prevUser = useRef<typeof user>(undefined);

  // Init Firebase auth listener
  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, []);

  // Load local profile once auth is ready
  useEffect(() => {
    if (!authLoaded) return;
    loadProfile()
      .catch((e) => {
        console.error('[Layout] loadProfile failed:', e);
        setError(String(e));
      })
      .finally(() => SplashScreen.hideAsync());
  }, [authLoaded]);

  // Navigate when auth state changes
  useEffect(() => {
    if (!isReady) return;

    const wasLoggedIn = prevUser.current !== undefined && prevUser.current !== null;
    const isLoggedIn = user !== null;
    prevUser.current = user;

    if (!isLoggedIn) {
      router.replace('/auth/login');
    } else if (!wasLoggedIn) {
      // Just logged in / registered
      if (!profile?.onboardingCompleted) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, isReady]);

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errTitle}>Startup Error</Text>
        <Text style={s.errMsg}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return <View style={s.center} />;
  }

  return <Slot />;
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#fff' },
  errTitle: { fontSize: 18, fontWeight: '700', color: '#FF6B6B', marginBottom: 12 },
  errMsg: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
});
