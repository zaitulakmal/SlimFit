import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { House, ForkKnife, UserCircle } from 'phosphor-react-native';

const ACTIVE   = '#A6171C';    // Deep Red
const INACTIVE = '#A0A0A0';   // Light Gray
const INDICATOR = '#F1C045';  // Golden Yellow

interface BottomNavProps {
  active?: 'home' | 'food' | 'profile';
}

export default function BottomNav({ active }: BottomNavProps) {
  const color  = (tab: string): string => active === tab ? ACTIVE : INACTIVE;
  const weight = (tab: string): 'fill' | 'regular' => active === tab ? 'fill' : 'regular';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)')}>
        {active === 'home' && <View style={styles.indicator} />}
        <House size={24} weight={weight('home')} color={color('home')} />
        <Text style={[styles.label, { color: color('home') }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)/food-log')}>
        {active === 'food' && <View style={styles.indicator} />}
        <ForkKnife size={24} weight={weight('food')} color={color('food')} />
        <Text style={[styles.label, { color: color('food') }]}>Food</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)/profile')}>
        {active === 'profile' && <View style={styles.indicator} />}
        <UserCircle size={24} weight={weight('profile')} color={color('profile')} />
        <Text style={[styles.label, { color: color('profile') }]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 72,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#EAE5DC',
    shadowColor: '#A6171C',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: INDICATOR,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 3,
  },
});
