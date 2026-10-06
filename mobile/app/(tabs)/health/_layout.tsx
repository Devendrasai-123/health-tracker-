import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

import { stackScreenOptions } from '@/constants/theme';

export default function HealthLayout() {
  const theme = useTheme();

  return (
    <Stack screenOptions={stackScreenOptions(theme.dark)}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="body" options={{ title: 'Body Reports' }} />
      <Stack.Screen name="fuel" options={{ title: 'Fuel & Hydration' }} />
      <Stack.Screen name="gym" options={{ title: 'Gym & Activity' }} />
      <Stack.Screen name="grooming" options={{ title: 'Grooming' }} />
      <Stack.Screen name="calendar" options={{ title: 'Health Calendar' }} />
      <Stack.Screen name="brain" options={{ title: 'Mind & Brain' }} />
      <Stack.Screen name="finance" options={{ title: 'Health Finance' }} />
      <Stack.Screen name="education" options={{ title: 'Health Education' }} />
    </Stack>
  );
}
