import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

import { stackScreenOptions } from '@/constants/theme';

export default function CalendarLayout() {
  const theme = useTheme();

  return (
    <Stack screenOptions={stackScreenOptions(theme.dark)}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="trip" options={{ title: 'Your Trip' }} />
      <Stack.Screen name="new-trip" options={{ title: 'Plan travel', presentation: 'modal' }} />
    </Stack>
  );
}
