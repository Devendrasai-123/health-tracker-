import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

import { stackScreenOptions } from '@/constants/theme';

export default function BrainLayout() {
  const theme = useTheme();

  return (
    <Stack screenOptions={stackScreenOptions(theme.dark)}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="graph" options={{ title: 'Knowledge Graph' }} />
      <Stack.Screen name="media" options={{ title: 'Books & Media' }} />
      <Stack.Screen name="skills" options={{ title: 'Skills & Marks' }} />
      <Stack.Screen name="college" options={{ title: 'College' }} />
      <Stack.Screen name="finance" options={{ title: 'Finance' }} />
      <Stack.Screen name="investments" options={{ title: 'Stocks & Crypto' }} />
      <Stack.Screen name="insights" options={{ title: 'AI Insights' }} />
    </Stack>
  );
}
