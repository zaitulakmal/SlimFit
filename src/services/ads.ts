import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { INTERSTITIAL_AD_UNIT_ID } from '../constants/adConfig';

const MIN_GAP_MS = 3 * 60 * 1000; // don't show more than once every 3 minutes

let interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: false,
});
let isLoaded = false;
let lastShownAt = 0;

function attachListeners() {
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
  attachListeners();
  interstitial.load();
}

/** Shows the preloaded interstitial if one is ready and the cooldown has elapsed. No-op otherwise. */
export function maybeShowInterstitial(): void {
  const now = Date.now();
  if (!isLoaded || now - lastShownAt < MIN_GAP_MS) return;
  lastShownAt = now;
  interstitial.show();
}
