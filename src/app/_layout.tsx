import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { DATABASE_NAME } from '../db';
import { useProfileStore } from '../stores/profileStore';
import '../i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { profile, isLoaded, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile()
      .catch((e) => console.warn('[Layout] loadProfile error:', e))
      .finally(() => SplashScreen.hideAsync());
  }, []);

  if (!isLoaded) {
    return (
      <View style={s.center}>
        <Text style={s.msg}>Loading...</Text>
      </View>
    );
  }

  if (!profile?.onboardingCompleted) {
    return (
      <SQLiteProvider databaseName={DATABASE_NAME}>
        <Redirect href="/onboarding" />
      </SQLiteProvider>
    );
  }

  return (
    <SQLiteProvider databaseName={DATABASE_NAME}>
      <Slot />
    </SQLiteProvider>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  msg: { fontSize: 16, color: '#6B7280' },
});
