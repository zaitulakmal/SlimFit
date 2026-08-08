import { initializeApp, getApps } from 'firebase/app';
// Imported from the inner `@firebase/auth` rather than the umbrella
// `firebase/auth` on purpose.
//
// The umbrella package's export map has no "react-native" condition, so Metro
// falls through to its `default` (browser/esm) build — which contains no
// getReactNativePersistence and no AsyncStorage awareness at all. The old
// `import { getReactNativePersistence } from 'firebase/auth'` therefore
// resolved to undefined on device, initializeAuth threw, the catch below
// swallowed it, and every install ran on in-memory persistence: users were
// signed out on each cold start and dumped back on the login screen.
//
// `@firebase/auth` does declare the react-native condition, so this picks up
// the real native build. It requires the same '@firebase/app' instance that
// `firebase/app` re-exports, so there is still exactly one app registry.
import * as firebaseAuth from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Only present in the react-native build; absent on web, where browser
// persistence is the default and nothing extra is needed.
const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence?: (storage: unknown) => firebaseAuth.Persistence;
  }
).getReactNativePersistence;

let auth: firebaseAuth.Auth;
try {
  auth = firebaseAuth.initializeAuth(
    app,
    getReactNativePersistence ? { persistence: getReactNativePersistence(AsyncStorage) } : undefined
  );
} catch {
  // Already initialized (hot reload), or persistence unavailable on this
  // platform — fall back to whatever the SDK set up for this app.
  auth = firebaseAuth.getAuth(app);
}

export { auth };
export const db = getFirestore(app);
