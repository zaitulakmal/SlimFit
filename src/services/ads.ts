// react-native-google-mobile-ads uses a native TurboModule — not available in
// Expo Go. Lazy-require so the app runs in simulator without crashing.
let InterstitialAd: any = null;
let AdEventType: any = null;

try {
  const m = require('react-native-google-mobile-ads');
  InterstitialAd = m.InterstitialAd;
  AdEventType = m.AdEventType;
} catch {}

import { INTERSTITIAL_AD_UNIT_ID } from '../constants/adConfig';

const MIN_GAP_MS = 3 * 60 * 1000;

let interstitial: any = null;
let isLoaded = false;
let lastShownAt = 0;

function attachListeners() {
  if (!interstitial) return;
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    attachListeners();
    interstitial.load();
  });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    isLoaded = false;
  });
}

export function preloadInterstitial(): void {
  if (!InterstitialAd) return;
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: false,
  });
  attachListeners();
  interstitial.load();
}

export function maybeShowInterstitial(): void {
  if (!interstitial || !isLoaded) return;
  const now = Date.now();
  if (now - lastShownAt < MIN_GAP_MS) return;
  lastShownAt = now;
  interstitial.show();
}
