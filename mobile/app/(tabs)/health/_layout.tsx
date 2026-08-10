import { Stack } from 'expo-router';
import { palette } from '@/constants/theme';

export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.orchidWhite },
        headerTintColor: palette.warmBlack,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.orchidWhite },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="body" options={{ title: 'Body Reports' }} />
      <Stack.Screen name="fuel" options={{ title: 'Fuel & Hydration' }} />
      <Stack.Screen name="gym" options={{ title: 'Gym & Activity' }} />
      <Stack.Screen name="grooming" options={{ title: 'Grooming' }} />
    </Stack>
  );
}
