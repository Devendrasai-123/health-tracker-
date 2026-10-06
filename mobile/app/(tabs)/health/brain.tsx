import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';

export default function HealthBrainScreen() {
  const theme = useTheme();
  return (
    <Screen title="Mind & Brain" subtitle="Stress, sleep and recovery support">
      <GlassCard>
        <View>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Mental wellness</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Log stress and sleep from Dashboard to keep your recovery insights current.
          </Text>
        </View>
      </GlassCard>
    </Screen>
  );
}
