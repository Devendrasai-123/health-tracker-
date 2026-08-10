import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { HealthAlert } from '@/constants/metrics';
import { GlassCard } from '@/components/GlassCard';
import { palette } from '@/constants/theme';

interface AlertBannerProps {
  alerts: HealthAlert[];
}

const LEVEL_ICON = {
  high: 'alert-circle',
  low: 'alert-outline',
  info: 'information-outline',
} as const;

const LEVEL_COLOR = {
  high: '#C62828',
  low: palette.vermillion,
  info: palette.masala,
} as const;

export function AlertBanner({ alerts }: AlertBannerProps) {
  const theme = useTheme();
  if (alerts.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {alerts.slice(0, 4).map((alert, i) => {
        const color = LEVEL_COLOR[alert.level];
        return (
          <GlassCard
            key={`${alert.title}-${i}`}
            style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}
            contentStyle={styles.content}>
            <MaterialCommunityIcons name={LEVEL_ICON[alert.level]} size={22} color={color} />
            <View style={styles.textWrap}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                {alert.title}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {alert.message}
              </Text>
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: {},
  content: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  textWrap: { flex: 1, marginLeft: 10 },
});
