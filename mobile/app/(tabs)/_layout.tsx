import { Redirect, Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: string; size: number }) {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  };
}

export default function TabLayout() {
  const status = useAuthStore((s) => s.status);
  const theme = useTheme();

  if (status !== 'unlocked') {
    return <Redirect href={status === 'uninitialized' ? '/(auth)/welcome' : '/(auth)/unlock'} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: theme.colors.surface },
        tabBarLabelStyle: { fontSize: 11 },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Home', tabBarIcon: tabIcon('view-dashboard-outline') }}
      />
      <Tabs.Screen
        name="medical"
        options={{ title: 'Medical', tabBarIcon: tabIcon('flask-outline') }}
      />
      <Tabs.Screen
        name="food"
        options={{ title: 'Food', tabBarIcon: tabIcon('silverware-fork-knife') }}
      />
      <Tabs.Screen
        name="workouts"
        options={{ title: 'Workouts', tabBarIcon: tabIcon('dumbbell') }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon('cog-outline') }} />
    </Tabs>
  );
}
