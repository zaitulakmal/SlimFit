import { View, StyleSheet } from 'react-native';
import { BANNER_AD_UNIT_ID } from '../../constants/adConfig';

// react-native-google-mobile-ads uses a native TurboModule that is not
// bundled inside Expo Go. Lazy-require it so the app doesn't crash when
// running in the simulator via Expo Go; ads simply won't render there.
let NativeAds: { BannerAd: any; BannerAdSize: any } | null = null;
try {
  NativeAds = require('react-native-google-mobile-ads');
} catch {}

export default function AdBanner() {
  if (!NativeAds) return null;
  const { BannerAd, BannerAdSize } = NativeAds;
  return (
    <View style={s.wrap}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
});
