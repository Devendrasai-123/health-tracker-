import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';

export default function HealthCalendarScreen() {
  const theme = useTheme();
  return (
    <Screen title="Health Calendar" subtitle="A date-based view of your health activity">
      <GlassCard>
        <View>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Daily timeline</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Use Dashboard, Food and Workouts to record activity. A calendar aggregation is ready for the next data-view enhancement.
          </Text>
        </View>
      </GlassCard>
    </Screen>
  );
}
