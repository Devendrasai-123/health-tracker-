import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/GlassCard';
import { palette, radii } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface MetricsCardProps {
  heartRate?: number | null;
  steps?: number | null;
  sleepHours?: number | null;
  stress?: number | null;
}

function MetricCell({
  icon,
  label,
  value,
  unit,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
}) {
  const theme = useTheme();
  const ink = theme.dark ? palette.orchidWhite : palette.warmBlack;
  const muted = theme.dark ? palette.chromeWhite : palette.masala;

  return (
    <View style={styles.cell}>
      <View style={[styles.icon, { backgroundColor: palette.vermillion + '18' }]}>
        <MaterialCommunityIcons name={icon} size={16} color={palette.vermillion} />
      </View>
      <Text style={[styles.label, { color: muted }]}>{label}</Text>
      <Text style={[styles.value, { color: ink }]}>
        {value}
        {unit ? <Text style={[styles.unit, { color: muted }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export function MetricsCard({ heartRate, steps, sleepHours, stress }: MetricsCardProps) {
  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      <View style={styles.row}>
        <MetricCell
          icon="heart-outline"
          label="Heart"
          value={heartRate != null ? String(heartRate) : '—'}
          unit="bpm"
        />
        <MetricCell
          icon="shoe-print"
          label="Steps"
          value={steps != null ? String(steps) : '—'}
        />
        <MetricCell
          icon="moon-waning-crescent"
          label="Sleep"
          value={sleepHours != null ? String(sleepHours) : '—'}
          unit="h"
        />
        <MetricCell
          icon="brain"
          label="Stress"
          value={stress != null ? String(stress) : '—'}
          unit="/10"
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12 },
  content: { paddingVertical: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { flex: 1, alignItems: 'center' },
  icon: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  unit: { fontSize: 11, fontWeight: '500' },
});
