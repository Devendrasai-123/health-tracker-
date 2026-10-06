import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/GlassCard';

export default function HealthFinanceScreen() {
  const theme = useTheme();
  return (
    <Screen title="Health Finance" subtitle="Keep care costs visible and intentional">
      <GlassCard>
        <View>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Health budget</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Finance tracking is currently informational. Expense entry and category totals are planned for a future database migration.
          </Text>
        </View>
      </GlassCard>
    </Screen>
  );
}
