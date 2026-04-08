import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { House, ForkKnife, UserCircle } from 'phosphor-react-native';

const ACTIVE   = '#B39DDB';
const INACTIVE = '#C4B5FD';

interface BottomNavProps {
  active?: 'home' | 'food' | 'profile';
}

export default function BottomNav({ active }: BottomNavProps) {
  const color  = (tab: string): string => active === tab ? ACTIVE : INACTIVE;
  const weight = (tab: string): 'fill' | 'regular' => active === tab ? 'fill' : 'regular';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)')}>
        <House size={24} weight={weight('home')} color={color('home')} />
        <Text style={[styles.label, { color: color('home') }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)/food-log')}>
        <ForkKnife size={24} weight={weight('food')} color={color('food')} />
        <Text style={[styles.label, { color: color('food') }]}>Food</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => router.push('/(tabs)/profile')}>
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
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
