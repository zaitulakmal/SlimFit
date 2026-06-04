import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Lock, Star } from 'phosphor-react-native';
import { useProStore } from '../../stores/proStore';

interface Props {
  children: React.ReactNode;
  featureName?: string;
}

export function LockedFeature({ children, featureName }: Props) {
  const isPro = useProStore((s) => s.isPro);
  if (isPro) return <>{children}</>;

  return (
    <View style={s.wrap}>
      {children}
      {/* Lock overlay */}
      <Pressable
        style={s.overlay}
        onPress={() => router.push('/paywall')}
      >
        <View style={s.badge}>
          <Lock size={16} weight="fill" color="#1A2B5C" />
          <Text style={s.badgeText}>Pro</Text>
        </View>
      </Pressable>
    </View>
  );
}

export function ProOnlyScreen() {
  return (
    <View style={s.fullLock}>
      <View style={s.iconWrap}>
        <Star size={40} weight="fill" color="#F0C808" />
      </View>
      <Text style={s.lockTitle}>Pro Feature</Text>
      <Text style={s.lockSub}>Upgrade to Slimora Pro to unlock this feature and everything else.</Text>
      <Pressable style={s.unlockBtn} onPress={() => router.push('/paywall')}>
        <Text style={s.unlockBtnText}>Upgrade to Pro — RM 9.99</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,26,60,0.65)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0C808',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#1A2B5C' },

  fullLock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    backgroundColor: '#F8FAFC',
  },
  iconWrap: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(240,200,8,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockTitle: { fontSize: 24, fontWeight: '800', color: '#1A2B5C', textAlign: 'center' },
  lockSub: {
    fontSize: 15, color: '#64748B',
    textAlign: 'center', lineHeight: 22,
  },
  unlockBtn: {
    backgroundColor: '#F0C808',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
    shadowColor: '#F0C808',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  unlockBtnText: { fontSize: 16, fontWeight: '800', color: '#1A2B5C' },
});
