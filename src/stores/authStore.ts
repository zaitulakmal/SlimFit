import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  // Same inner-package import as src/lib/firebase.ts — mixing it with the
  // umbrella 'firebase/auth' would load a second copy of the auth SDK and
  // these functions would be handed an Auth built by the other one.
} from '@firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  isLoaded: boolean;
  error: string | null;
  init: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoaded: false,
  error: null,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, isLoaded: true });
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      const msg = firebaseErrorMsg(e.code);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  register: async (name, email, password) => {
    set({ error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
    } catch (e: any) {
      const msg = firebaseErrorMsg(e.code);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));

function firebaseErrorMsg(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'Email already registered.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default: return 'Something went wrong. Please try again.';
  }
}
