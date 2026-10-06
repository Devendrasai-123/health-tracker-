import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';

export default function HealthEducationScreen() {
  const theme = useTheme();
  return (
    <Screen title="Health Education" subtitle="Understand your tracked data">
      <GlassCard>
        <View>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Your data, explained</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Recovery scores combine sleep, heart rate, stress and weight signals. They are informational and are not medical advice.
          </Text>
        </View>
      </GlassCard>
    </Screen>
  );
}
