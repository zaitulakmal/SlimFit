import { Stack } from 'expo-router';
import { TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { colors } from '../../constants/theme-new';

export default function WeightLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
