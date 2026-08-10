import { Redirect, Stack, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  if (status === 'unlocked') {
    return <Redirect href={'/(tabs)/health' as Href} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
