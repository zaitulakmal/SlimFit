import { TestIds } from 'react-native-google-mobile-ads';

// Real AdMob ad unit IDs for Slimora (Android). Using Google's test IDs in
// dev builds so ads render without risking policy strikes from serving real
// ads on a development build.
export const BANNER_AD_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-3572237500754680/6724645858';
export const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3572237500754680/7410620108';
