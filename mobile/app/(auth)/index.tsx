import { Redirect, type Href } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

/** Entry for auth group: route first-launch vs returning users. */
export default function AuthIndex() {
  const status = useAuthStore((s) => s.status);
  if (status === 'unlocked') return <Redirect href={'/(tabs)/health' as Href} />;
  if (status === 'uninitialized') return <Redirect href="/(auth)/welcome" />;
  return <Redirect href="/(auth)/unlock" />;
}
