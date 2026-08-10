import { Stack } from 'expo-router';
import { palette } from '@/constants/theme';

export default function CalendarLayout() {
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
      <Stack.Screen name="trip" options={{ title: 'Your Trip' }} />
      <Stack.Screen name="new-trip" options={{ title: 'Plan travel', presentation: 'modal' }} />
    </Stack>
  );
}
